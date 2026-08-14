import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { saveConnection } from '@/lib/supabase/social-tokens'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('threads_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/settings?error=threads_auth_failed', request.url))
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/threads/callback`

    // Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID!,
        client_secret: process.env.THREADS_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    })

    if (!tokenRes.ok) {
      console.error('Threads token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(new URL('/settings?error=threads_auth_failed', request.url))
    }

    const tokenData = await tokenRes.json()
    const shortLivedToken = tokenData.access_token

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.threads.net/access_token?` +
        new URLSearchParams({
          grant_type: 'th_exchange_token',
          client_secret: process.env.THREADS_APP_SECRET!,
          access_token: shortLivedToken,
        }).toString()
    )

    let accessToken = shortLivedToken
    let expiresIn = 3600 // short-lived default

    if (longLivedRes.ok) {
      const longLivedData = await longLivedRes.json()
      accessToken = longLivedData.access_token
      expiresIn = longLivedData.expires_in // ~60 days in seconds
    }

    // Get user info
    const userRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`
    )
    let threadsUserId = tokenData.user_id?.toString()
    let threadsUsername = 'Threads User'

    if (userRes.ok) {
      const userData = await userRes.json()
      threadsUserId = userData.id?.toString() ?? threadsUserId
      threadsUsername = userData.username ?? threadsUsername
    }

    await saveConnection(user.id, {
      platform: 'threads',
      accessToken,
      platformUserId: threadsUserId,
      platformUsername: threadsUsername,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: 'threads_basic,threads_content_publish',
    })

    const response = NextResponse.redirect(new URL('/settings?connected=threads', request.url))
    response.cookies.delete('threads_oauth_state')
    return response
  } catch (err) {
    console.error('Threads OAuth callback error:', err)
    const response = NextResponse.redirect(
      new URL('/settings?error=threads_auth_failed', request.url)
    )
    response.cookies.delete('threads_oauth_state')
    return response
  }
}
