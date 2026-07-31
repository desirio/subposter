import { TwitterApi } from 'twitter-api-v2';
import { getDecryptedTokens, saveConnection } from './supabase/social-tokens';

/**
 * Get a valid X access token, refreshing if expired.
 * X OAuth 2.0 tokens expire after ~2 hours.
 */
export async function getValidXToken(userId: string): Promise<string | null> {
  const tokens = await getDecryptedTokens(userId, 'x');
  if (!tokens) return null;

  // Check if token is expired or expiring within 5 minutes
  if (
    tokens.tokenExpiresAt &&
    tokens.tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000
  ) {
    if (!tokens.refreshToken) return null;

    try {
      const client = new TwitterApi({
        clientId: process.env.X_CLIENT_ID!,
        clientSecret: process.env.X_CLIENT_SECRET,
      });

      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      } = await client.refreshOAuth2Token(tokens.refreshToken);

      await saveConnection(userId, {
        platform: 'x',
        accessToken,
        refreshToken: newRefreshToken,
        platformUserId: tokens.platformUserId,
        platformUsername: tokens.platformUsername,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      });

      return accessToken;
    } catch (err) {
      console.error('X token refresh failed:', err);
      return null;
    }
  }

  return tokens.accessToken;
}

/**
 * Get a valid LinkedIn access token.
 * LinkedIn tokens last ~60 days. Refresh requires re-auth.
 */
export async function getValidLinkedInToken(userId: string): Promise<{
  accessToken: string;
  personUrn: string;
} | null> {
  const tokens = await getDecryptedTokens(userId, 'linkedin');
  if (!tokens || !tokens.platformUserId) return null;

  // LinkedIn doesn't support silent refresh -- if expired, user must re-authenticate
  if (tokens.tokenExpiresAt && tokens.tokenExpiresAt.getTime() < Date.now()) {
    return null;
  }

  return {
    accessToken: tokens.accessToken,
    personUrn: tokens.platformUserId,
  };
}

/**
 * Get a valid Threads access token.
 * Long-lived tokens last ~60 days and can be refreshed.
 */
export async function getValidThreadsToken(userId: string): Promise<{
  accessToken: string;
  userId: string;
} | null> {
  const tokens = await getDecryptedTokens(userId, 'threads');
  if (!tokens || !tokens.platformUserId) return null;

  // Check if token is expiring within 7 days -- refresh proactively
  if (
    tokens.tokenExpiresAt &&
    tokens.tokenExpiresAt.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
  ) {
    try {
      const res = await fetch(
        `https://graph.threads.net/refresh_access_token?` +
          new URLSearchParams({
            grant_type: 'th_refresh_token',
            access_token: tokens.accessToken,
          }).toString()
      );

      if (res.ok) {
        const data = await res.json();
        await saveConnection(userId, {
          platform: 'threads',
          accessToken: data.access_token,
          platformUserId: tokens.platformUserId,
          platformUsername: tokens.platformUsername,
          tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        });
        return { accessToken: data.access_token, userId: tokens.platformUserId };
      }
    } catch (err) {
      console.error('Threads token refresh failed:', err);
    }
  }

  // If expired and refresh failed, return null
  if (tokens.tokenExpiresAt && tokens.tokenExpiresAt.getTime() < Date.now()) {
    return null;
  }

  return { accessToken: tokens.accessToken, userId: tokens.platformUserId };
}
