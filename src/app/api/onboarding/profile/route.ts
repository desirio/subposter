import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/supabase/user-profile'

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  const { display_name, substack_url, content_focus } = body

  try {
    await getOrCreateUserProfile(user.id)
    const profile = await updateUserProfile(user.id, {
      display_name,
      substack_url,
      content_focus,
      onboarding_step: 3,
    })

    return NextResponse.json({ profile })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save profile' },
      { status: 500 }
    )
  }
}
