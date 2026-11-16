import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/supabase/user-profile'
import type { PricingPlan, BillingInterval } from '@/lib/types'

const VALID_PLANS: PricingPlan[] = ['starter', 'plus', 'pro']
const VALID_INTERVALS: BillingInterval[] = ['monthly', 'annual']

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  const { selected_plan, billing_interval } = body

  if (!VALID_PLANS.includes(selected_plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  if (!VALID_INTERVALS.includes(billing_interval)) {
    return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 })
  }

  try {
    await getOrCreateUserProfile(user.id)
    const profile = await updateUserProfile(user.id, {
      selected_plan,
      billing_interval,
      onboarding_step: 4,
    })

    return NextResponse.json({ profile })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save plan' },
      { status: 500 }
    )
  }
}
