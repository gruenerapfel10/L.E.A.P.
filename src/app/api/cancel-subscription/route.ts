import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ensure Stripe secret key is set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15',
});

export async function POST(req: Request) {
  console.log('[Cancel Subscription] Received request');
  try {
    // Validate request body
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      console.error('[Cancel Subscription] No subscription ID provided');
      return new NextResponse('Subscription ID is required', { status: 400 });
    }

    // Authenticate the user
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('[Cancel Subscription] Authentication error:', sessionError);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify the subscription belongs to the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Cancel Subscription] Profile error:', profileError);
      return new NextResponse('User profile not found', { status: 404 });
    }

    if (profile.stripe_subscription_id !== subscriptionId) {
      console.error('[Cancel Subscription] Subscription ID mismatch');
      return new NextResponse('Subscription ID does not match user profile', { status: 403 });
    }

    // Cancel the subscription at period end (doesn't immediately cancel, allows user to use until end of paid period)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log(`[Cancel Subscription] Successfully marked subscription ${subscriptionId} to cancel at period end`);

    // Update the user's profile with the new subscription status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'canceled',
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('[Cancel Subscription] Error updating profile:', updateError);
      // We don't return an error here since the subscription was successfully canceled in Stripe
      // The webhook will eventually update the status
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('[Cancel Subscription] Error:', error);
    return new NextResponse(`Server error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
} 