import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/supabase/user-profile'

export async function POST() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    await getOrCreateUserProfile(user.id)
    const profile = await updateUserProfile(user.id, {
      onboarding_completed: true,
    })

    const response = NextResponse.json({ profile })
    response.cookies.set('onboarding_done', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
