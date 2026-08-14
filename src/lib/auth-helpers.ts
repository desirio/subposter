import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDecryptedTokens, DecryptedTokens } from '@/lib/supabase/social-tokens'

export async function getAuthenticatedUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function notConnectedResponse(platform: string) {
  return NextResponse.json(
    { success: false, error: `${platform} not connected. Go to Settings to connect.` },
    { status: 403 }
  )
}

export async function getUserPlatformTokens(
  userId: string,
  platform: 'x' | 'threads' | 'linkedin'
): Promise<DecryptedTokens | null> {
  return getDecryptedTokens(userId, platform)
}
