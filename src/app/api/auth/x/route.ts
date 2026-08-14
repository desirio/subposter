import { NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const clientId = process.env.X_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'X OAuth not configured' }, { status: 500 })
  }

  const client = new TwitterApi({ clientId })
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/x/callback`,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
  )

  const response = NextResponse.redirect(url)
  response.cookies.set('x_oauth_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  response.cookies.set('x_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
