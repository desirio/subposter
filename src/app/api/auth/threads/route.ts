import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const appId = process.env.THREADS_APP_ID
  if (!appId) {
    return NextResponse.json({ error: 'Threads OAuth not configured' }, { status: 500 })
  }

  const state = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/threads/callback`

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'threads_basic,threads_content_publish',
    response_type: 'code',
    state,
  })

  const response = NextResponse.redirect(
    `https://threads.net/oauth/authorize?${params.toString()}`
  )
  response.cookies.set('threads_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
