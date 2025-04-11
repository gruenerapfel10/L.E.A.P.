import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ensure Stripe secret key is set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY; // Use standard name
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables.');
}

const stripe = new Stripe(stripeSecretKey, { // Use the variable
  apiVersion: '2022-11-15', // Use a consistent API version
});

// Define helper to get or create Stripe customer ID
async function getOrCreateStripeCustomerId(userId: string, email: string): Promise<string> {
  const supabase = await createClient();
  
  // 1. Check if the user already has a stripe_customer_id in Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
    console.error(`[Checkout] Error fetching profile for user ${userId}:`, profileError);
    throw new Error('Could not fetch user profile.');
  }

  if (profile?.stripe_customer_id) {
    console.log(`[Checkout] Found existing Stripe Customer ID for user ${userId}: ${profile.stripe_customer_id}`);
    return profile.stripe_customer_id;
  }

  // 2. If not found, create a new Stripe Customer
  console.log(`[Checkout] No Stripe Customer ID found for user ${userId}. Creating new Stripe Customer.`);
  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        supabaseUserId: userId, // Link Stripe customer to Supabase user ID
      },
    });
    console.log(`[Checkout] Created new Stripe Customer for user ${userId}: ${customer.id}`);

    // 3. Update the user's profile in Supabase with the new Stripe Customer ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (updateError) {
      console.error(`[Checkout] Error updating profile for user ${userId} with Stripe Customer ID:`, updateError);
      // Don't throw here, proceed with checkout but log the error
    }

    return customer.id;
  } catch (stripeError: any) {
    console.error(`[Checkout] Error creating Stripe Customer for user ${userId}:`, stripeError);
    throw new Error(`Could not create Stripe customer: ${stripeError.message}`);
  }
}

export async function POST(req: Request) {
  console.log('[Checkout] Received request to create checkout session.');
  try {
    const { priceId } = await req.json();
    
    if (!priceId) {
      console.error('[Checkout] Price ID is required.');
      return new NextResponse('Price ID is required', { status: 400 });
    }
    console.log(`[Checkout] Requested Price ID: ${priceId}`);

    // Get the Supabase user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Checkout] Supabase session error:', sessionError);
      return new NextResponse('Authentication error', { status: 500 });
    }
    
    if (!session?.user) {
      console.error('[Checkout] Unauthorized - No user session found.');
      return new NextResponse('Unauthorized - No user session found', { status: 401 });
    }

    const user = session.user;
    console.log(`[Checkout] Authenticated User ID: ${user.id}, Email: ${user.email}`);

    // Get or create the Stripe Customer ID
    const customerId = await getOrCreateStripeCustomerId(user.id, user.email || '');
    console.log(`[Checkout] Using Stripe Customer ID: ${customerId}`);

    // Define success and cancel URLs
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing`;
    console.log(`[Checkout] Success URL: ${successUrl}`);
    console.log(`[Checkout] Cancel URL: ${cancelUrl}`);

    // Create the Stripe Checkout Session
    console.log(`[Checkout] Creating Stripe Checkout Session for customer ${customerId} and price ${priceId}`);
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14, // Add 14-day free trial
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        // Pass Supabase user ID and the selected price ID for the webhook
        supabaseUserId: user.id,
        priceId: priceId, 
      },
    });
    console.log(`[Checkout] Stripe Checkout Session created: ${checkoutSession.id}`);

    // Return the checkout session URL
    if (!checkoutSession.url) {
      console.error('[Checkout] Stripe Checkout Session URL is missing.');
      throw new Error('Could not create checkout session.');
    }

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error('[Checkout] General error creating checkout session:', error);
    return new NextResponse(`Server error: ${error.message || 'Unknown error'}`, { status: 500 });
  }
} 