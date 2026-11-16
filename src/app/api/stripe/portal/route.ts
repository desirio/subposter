import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getUserProfile } from '@/lib/supabase/user-profile'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const profile = await getUserProfile(user.id)

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    )
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${request.headers.get('origin')}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
