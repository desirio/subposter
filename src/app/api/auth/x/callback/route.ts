import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { saveConnection } from '@/lib/supabase/social-tokens'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('x_oauth_state')?.value
  const codeVerifier = request.cookies.get('x_oauth_verifier')?.value

  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(new URL('/settings?error=x_auth_failed', request.url))
  }

  try {
    const client = new TwitterApi({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET,
    })

    const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/x/callback`,
    })

    // Get the authenticated user's info
    const loggedClient = new TwitterApi(accessToken)
    const { data: twitterUser } = await loggedClient.v2.me()

    await saveConnection(user.id, {
      platform: 'x',
      accessToken,
      refreshToken,
      platformUserId: twitterUser.id,
      platformUsername: twitterUser.username,
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
      scopes: 'tweet.read,tweet.write,users.read,offline.access',
    })

    const response = NextResponse.redirect(new URL('/settings?connected=x', request.url))
    response.cookies.delete('x_oauth_verifier')
    response.cookies.delete('x_oauth_state')
    return response
  } catch (err) {
    console.error('X OAuth callback error:', err)
    const response = NextResponse.redirect(new URL('/settings?error=x_auth_failed', request.url))
    response.cookies.delete('x_oauth_verifier')
    response.cookies.delete('x_oauth_state')
    return response
  }
}
