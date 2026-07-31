import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getUserConnections } from '@/lib/supabase/social-tokens'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const connections = await getUserConnections(user.id)
    return NextResponse.json({ connections })
  } catch (err) {
    console.error('Connections fetch error:', err)
    return NextResponse.json({ connections: [] })
  }
}
