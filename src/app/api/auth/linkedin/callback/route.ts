import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { saveConnection } from '@/lib/supabase/social-tokens'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('linkedin_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', request.url))
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }).toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('LinkedIn token exchange failed:', err)
      return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', request.url))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // seconds

    // Get user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileRes.ok) {
      console.error('LinkedIn profile fetch failed:', await profileRes.text())
      return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', request.url))
    }

    const profile = await profileRes.json()
    const personUrn = `urn:li:person:${profile.sub}`

    await saveConnection(user.id, {
      platform: 'linkedin',
      accessToken,
      platformUserId: personUrn,
      platformUsername: profile.name ?? profile.email ?? 'LinkedIn User',
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
      scopes: 'openid,profile,w_member_social',
    })

    const response = NextResponse.redirect(new URL('/settings?connected=linkedin', request.url))
    response.cookies.delete('linkedin_oauth_state')
    return response
  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err)
    const response = NextResponse.redirect(
      new URL('/settings?error=linkedin_auth_failed', request.url)
    )
    response.cookies.delete('linkedin_oauth_state')
    return response
  }
}
