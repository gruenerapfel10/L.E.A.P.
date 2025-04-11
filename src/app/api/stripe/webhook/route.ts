import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Ensure required environment variables are set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
  console.error(
    'CRITICAL ERROR: Missing required environment variables for Stripe/Supabase webhook.' +
    ` STRIPE_SECRET_KEY: ${!!stripeSecretKey}, STRIPE_WEBHOOK_SECRET: ${!!webhookSecret}, ` +
    `NEXT_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseServiceKey}`
  )
  // In a real app, throw an error or return a specific response to prevent startup
  throw new Error('Missing critical environment variables.')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2022-11-15'
})

// Create a Supabase client instance configured for Service Role access
// This bypasses RLS and should ONLY be used in secure server-side environments like this webhook.
const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey)

// Helper function to update user profile in Supabase using the ADMIN client
async function updateUserSubscription(userId: string, updates: Record<string, any>) {
  console.log(`[Webhook ADMIN] Attempting update for user ${userId} with:`, updates)
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id')

  if (error) {
    console.error(`[Webhook ADMIN] ❌ Supabase update error for user ${userId}:`, error)
  } else {
    if (data && data.length > 0) {
      console.log(`[Webhook ADMIN] ✅ Successfully updated profile for user ${userId}. Updated row ID(s):`, data.map(d => d.id))
    } else {
      console.warn(`[Webhook ADMIN] ⚠️ Supabase update for user ${userId} reported success but returned 0 rows. Was the user ID correct? Did the data actually change?`)
    }
  }
  return { data, error }
}

// Helper function to map Stripe Price ID to Plan Name
function mapPriceIdToPlan(priceId?: string | null): 'free' | 'pro' | 'premium' {
  if (!priceId) return 'free' // Handle null/undefined priceId
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    return 'pro'
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
    return 'premium'
  }
  console.warn(`[Webhook] Unknown Price ID encountered: ${priceId}. Defaulting to free plan.`)
  return 'free' // Default to free if price ID doesn't match known plans
}

export async function POST(req: Request) {
  console.log('[Webhook] ===== Received POST request =====')
  console.log('[Webhook] Received Stripe webhook request.')
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  let event: Stripe.Event

  // 1. Verify webhook signature
  try {
    if (!signature) {
      console.error('[Webhook] ⚠️ Missing stripe-signature header')
      return new NextResponse('Missing stripe-signature header', { status: 400 })
    }
    const verifiedSignature: string = signature
    
    console.log('[Webhook] Verifying webhook signature...')
    event = stripe.webhooks.constructEvent(body, verifiedSignature, webhookSecret!)
    console.log(`[Webhook] ✅ Webhook signature verified. Event ID: ${event.id}, Type: ${event.type}`)
  } catch (err: any) {
    console.error(`[Webhook] ⚠️ Webhook signature verification failed: ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 2. Handle the event
  let updateError: any = null
  try {
    console.log(`[Webhook] Processing event type: ${event.type}`)
    
    // Perform database operations based on event type
    // All DB operations within the switch now use supabaseAdmin via updateUserSubscription or direct calls
    switch (event.type) {
      // --- Initial Subscription Creation --- 
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabaseUserId
        const priceId = session.metadata?.priceId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        console.log(`[Webhook] Checkout Session Completed: ${session.id}`)
        console.log(`[Webhook] Metadata - UserID: ${userId}, PriceID: ${priceId}`)
        console.log(`[Webhook] Stripe IDs - Subscription: ${subscriptionId}, Customer: ${customerId}`)

        if (!userId || !subscriptionId || !customerId || !priceId) {
          console.warn(`[Webhook] ⚠️ Missing required data in checkout.session.completed: ${session.id}`)
          break // Exit if essential data is missing
        }
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        let periodEndISO: string | null = null
        if (subscription.current_period_end) {
          periodEndISO = new Date(subscription.current_period_end * 1000).toISOString()
        }

        ({ error: updateError } = await updateUserSubscription(userId, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId, 
          stripe_price_id: priceId,
          plan: mapPriceIdToPlan(priceId),
          subscription_status: subscription.status,
          subscription_period_end: periodEndISO,
        }))
        break
      }

      // --- Ongoing Subscription Updates --- 
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string | null ?? null
        const customerId = invoice.customer as string | null ?? null

        console.log(`[Webhook] Invoice Paid: ${invoice.id} for Subscription: ${subscriptionId ?? 'N/A'}`)

        if (!customerId) {
          // We almost always need the customer ID
          console.warn(`[Webhook] ⚠️ Missing customer ID in invoice.paid: ${invoice.id}`)
          break
        }
        
        // Find Supabase user by Stripe Customer ID
        const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        
        if (profileError || !profile) {
          console.error(`[Webhook] ❌ Error or no profile found for customer ${customerId} on invoice.paid:`, profileError)
          break
        }

        // If subscriptionId is available on the invoice, retrieve it for latest details
        let subscriptionStatus: Stripe.Subscription.Status | null = null
        let priceId: string | null = null
        let periodEndISO: string | null = null

        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            subscriptionStatus = subscription.status
            priceId = subscription.items.data[0]?.price.id ?? null
            if (subscription.current_period_end) {
              periodEndISO = new Date(subscription.current_period_end * 1000).toISOString()
            }
          } catch (subError) {
            console.error(`[Webhook] Error retrieving subscription ${subscriptionId} during invoice.paid:`, subError)
            // Decide if you want to proceed without full subscription details or break
          }
        }

        // Only update if we have a status to update with
        if (subscriptionStatus) {
          ({ error: updateError } = await updateUserSubscription(profile.id, {
            plan: mapPriceIdToPlan(priceId),
            stripe_price_id: priceId,
            subscription_status: subscriptionStatus,
            subscription_period_end: periodEndISO,
          }))
        } else {
          console.warn(`[Webhook] Skipping profile update for invoice.paid ${invoice.id} as subscription details couldn't be fully retrieved.`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string | null ?? null
        console.log(`[Webhook] Invoice Payment Failed: ${invoice.id}`)
        
        if (!customerId) {
          console.warn(`[Webhook] ⚠️ Missing customer ID in invoice.payment_failed: ${invoice.id}`)
          break
        }
        // Find Supabase user and potentially update status to 'past_due' or rely on customer.subscription.updated
        const { data: profile, error } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        
        if (!error && profile) {
          console.log(`[Webhook] Optionally update status for user ${profile.id} due to payment failure.`)
          // Example: await updateUserSubscription(profile.id, { subscription_status: 'past_due' })
          // Often better handled by customer.subscription.updated
        } else {
          console.error(`[Webhook] ❌ Error or no profile found for customer ${customerId} on invoice.payment_failed:`, error)
        }
        break
      }

      // --- Subscription Lifecycle Changes (Upgrades, Downgrades, Cancellations) ---
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string | null ?? null
        const priceId = subscription.items.data[0]?.price.id ?? null
        let periodEndISO: string | null = null
        if (subscription.current_period_end) {
          periodEndISO = new Date(subscription.current_period_end * 1000).toISOString()
        }
        
        console.log(`[Webhook] Customer Subscription Updated: ${subscription.id}, Status: ${subscription.status}`)

        if (!customerId) {
          console.warn(`[Webhook] ⚠️ Missing customer ID in customer.subscription.updated: ${subscription.id}`)
          break
        }
        
        // Find Supabase user by Stripe Customer ID
        const { data: profile, error } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()

        if (error || !profile) {
          console.error(`[Webhook] ❌ Error or no profile found for customer ${customerId} on subscription update:`, error)
          break
        }
        
        ({ error: updateError } = await updateUserSubscription(profile.id, {
          plan: mapPriceIdToPlan(priceId),
          stripe_price_id: priceId,
          subscription_status: subscription.status,
          subscription_period_end: periodEndISO,
          stripe_subscription_id: subscription.id, 
        }))
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string | null ?? null
        console.log(`[Webhook] Customer Subscription Deleted: ${subscription.id}`)
        
        if (!customerId) {
          console.warn(`[Webhook] ⚠️ Missing customer ID in customer.subscription.deleted: ${subscription.id}`)
          break
        }

        // Find Supabase user by Stripe Customer ID
        const { data: profile, error } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single()

        if (error || !profile) {
          console.error(`[Webhook] ❌ Error or no profile found for customer ${customerId} on subscription deletion:`, error)
          break
        }

        ({ error: updateError } = await updateUserSubscription(profile.id, {
          plan: 'free', // Revert plan to free
          subscription_status: 'canceled', // Explicitly set status
          stripe_subscription_id: null, // Clear Stripe IDs
          stripe_price_id: null,
          subscription_period_end: null, // Clear period end
        }))
        break
      }

      default: {
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
        break
      }
    }
    
    // Check if any database update failed during processing
    if (updateError) {
      console.error('[Webhook] Error occurred during database update, returning 500.', updateError)
      // Return 500 but log the specific DB error
      return new NextResponse(`Webhook handler database update error: ${updateError.message || 'Unknown DB error'}`, { status: 500 })
    }

    // 3. Return a success response to Stripe
    console.log(`[Webhook] Finished processing event: ${event.id}`)
    return new NextResponse('Webhook processed successfully', { status: 200 })

  } catch (error: any) {
    console.error(`[Webhook] ❌ Unexpected error processing webhook event ${event?.id ?? 'unknown'}:`, error)
    return new NextResponse(`Webhook handler error: ${error.message || 'Unknown error'}`, { status: 500 })
  }
} 