import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import type { PricingPlan } from '@/lib/types'

export const dynamic = 'force-dynamic'

function buildPlanFromPriceMap(): Record<string, PricingPlan> {
  const map: Record<string, PricingPlan> = {}
  const mappings: Array<[string | undefined, PricingPlan]> = [
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID, 'starter'],
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID, 'starter'],
    [process.env.STRIPE_PLUS_MONTHLY_PRICE_ID, 'plus'],
    [process.env.STRIPE_PLUS_ANNUAL_PRICE_ID, 'plus'],
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID, 'pro'],
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID, 'pro'],
  ]
  for (const [priceId, plan] of mappings) {
    if (priceId) map[priceId] = plan
  }
  return map
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const planFromPrice = buildPlanFromPriceMap()
  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as PricingPlan | undefined

        if (!userId) break

        const updates: Record<string, unknown> = {
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString(),
        }

        if (session.subscription) {
          updates.stripe_subscription_id = session.subscription as string
        }

        if (plan && ['starter', 'plus', 'pro'].includes(plan)) {
          updates.selected_plan = plan
        }

        await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        const priceId = subscription.items.data[0]?.price?.id
        const newPlan = priceId ? planFromPrice[priceId] : undefined

        const updates: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        }

        if (newPlan) {
          updates.selected_plan = newPlan
        }

        await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', profile.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('user_profiles')
          .update({
            selected_plan: 'starter',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.error(`Payment failed for customer ${customerId}, invoice ${invoice.id}`)
        break
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
