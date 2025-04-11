import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  console.log('[STRIPE WEBHOOK] Received request');
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    console.log('[STRIPE WEBHOOK] Constructing event...');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[STRIPE WEBHOOK] Event constructed: ${event.id}, Type: ${event.type}`);
  } catch (err: any) {
    console.error('[STRIPE WEBHOOK] ⚠️ Webhook signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = await createClient();
  console.log(`[STRIPE WEBHOOK] Processing event type: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId; // Assuming priceId is passed in metadata
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        console.log(`[STRIPE WEBHOOK] Checkout Session Completed: ${session.id}`);
        console.log(`[STRIPE WEBHOOK] Metadata - User ID: ${userId}, Price ID: ${priceId}`);
        console.log(`[STRIPE WEBHOOK] Subscription ID: ${subscriptionId}, Customer ID: ${customerId}`);

        if (userId && subscriptionId && customerId) {
          console.log(`[STRIPE WEBHOOK] Updating profile for user ID: ${userId}`);
          const { data, error } = await supabase
            .from('profiles')
            .update({
              is_subscribed: true,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId, // Update priceId as well
              stripe_customer_id: customerId, // Store customerId if not already there
              plan: priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'pro' : 
                    priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ? 'premium' : 'free' // Determine plan based on priceId
            })
            .eq('id', userId)
            .select(); // Use select to see the result

          if (error) {
            console.error(`[STRIPE WEBHOOK] ❌ Supabase update error for user ${userId}:`, error);
          } else {
            console.log(`[STRIPE WEBHOOK] ✅ Successfully updated profile for user ${userId}. Updated data:`, data);
          }
        } else {
          console.warn(`[STRIPE WEBHOOK] ⚠️ Missing required data in session ${session.id}: userId=${userId}, subscriptionId=${subscriptionId}, customerId=${customerId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id;
        const subscriptionStatus = subscription.status;
        console.log(`[STRIPE WEBHOOK] Customer Subscription Updated: ${subscription.id}, Status: ${subscriptionStatus}, Price ID: ${priceId}`);

        // Get the user's profile based on stripe_customer_id
        console.log(`[STRIPE WEBHOOK] Finding profile for Stripe Customer ID: ${customerId}`);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, plan') // Select current plan too
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError) {
          console.error(`[STRIPE WEBHOOK] ❌ Error fetching profile for customer ${customerId}:`, profileError);
        } else if (profile) {
          const newPlan = priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'pro' : 
                          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ? 'premium' : 'free';
          const isSubscribed = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
          console.log(`[STRIPE WEBHOOK] Updating profile for user ID: ${profile.id}. New plan: ${newPlan}, isSubscribed: ${isSubscribed}`);

          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              is_subscribed: isSubscribed,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              plan: newPlan
            })
            .eq('id', profile.id)
            .select();

          if (updateError) {
            console.error(`[STRIPE WEBHOOK] ❌ Supabase update error for user ${profile.id}:`, updateError);
          } else {
            console.log(`[STRIPE WEBHOOK] ✅ Successfully updated profile for user ${profile.id}. Updated data:`, updateData);
          }
        } else {
          console.warn(`[STRIPE WEBHOOK] ⚠️ No profile found for Stripe Customer ID: ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        console.log(`[STRIPE WEBHOOK] Customer Subscription Deleted: ${subscription.id}`);

        // Get the user's profile
        console.log(`[STRIPE WEBHOOK] Finding profile for Stripe Customer ID: ${customerId}`);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profileError) {
          console.error(`[STRIPE WEBHOOK] ❌ Error fetching profile for customer ${customerId}:`, profileError);
        } else if (profile) {
          console.log(`[STRIPE WEBHOOK] Updating profile for user ID: ${profile.id} (Subscription Deleted)`);
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({
              is_subscribed: false,
              stripe_subscription_id: null,
              stripe_price_id: null,
              plan: 'free' // Revert plan to free
            })
            .eq('id', profile.id)
            .select();

          if (updateError) {
            console.error(`[STRIPE WEBHOOK] ❌ Supabase update error for user ${profile.id}:`, updateError);
          } else {
            console.log(`[STRIPE WEBHOOK] ✅ Successfully updated profile for user ${profile.id} (Set to free). Updated data:`, updateData);
          }
        } else {
          console.warn(`[STRIPE WEBHOOK] ⚠️ No profile found for Stripe Customer ID: ${customerId}`);
        }
        break;
      }

      default: {
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
        break;
      }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK] ❌ Error processing webhook:', error);
    return new NextResponse(`Webhook handler error: ${error.message}`, { status: 500 });
  }
} 