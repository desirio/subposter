import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { deleteConnection } from '@/lib/supabase/social-tokens'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { platform } = await request.json()

  if (!['x', 'threads', 'linkedin'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  try {
    await deleteConnection(user.id, platform)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Disconnect error:', err)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
