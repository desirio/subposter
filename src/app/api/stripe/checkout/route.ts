import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getUserProfile } from '@/lib/supabase/user-profile'
import { getStripe } from '@/lib/stripe'
import type { PricingPlan, BillingInterval } from '@/lib/types'

export const dynamic = 'force-dynamic'

function getPriceMap(): Record<PricingPlan, Record<BillingInterval, string | undefined>> {
  return {
    starter: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    },
    plus: {
      monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_PLUS_ANNUAL_PRICE_ID,
    },
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  const { plan, interval } = body as { plan: PricingPlan; interval: BillingInterval }

  if (!['starter', 'plus', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  if (!['monthly', 'annual'].includes(interval)) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 })
  }

  const priceId = getPriceMap()[plan]?.[interval]
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const profile = await getUserProfile(user.id)

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get('origin')}/onboarding/connect?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/onboarding/plan`,
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: user.id, plan },
      },
      metadata: { userId: user.id, plan },
    }

    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email
      sessionParams.customer_creation = 'always'
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
