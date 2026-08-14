import { createClient } from './server'
import { encrypt, decrypt } from '../crypto'

export interface SocialConnectionInput {
  platform: 'x' | 'threads' | 'linkedin'
  accessToken: string
  refreshToken?: string
  platformUserId?: string
  platformUsername?: string
  tokenExpiresAt?: Date
  scopes?: string
}

export interface DecryptedTokens {
  accessToken: string
  refreshToken?: string
  platformUserId?: string
  platformUsername?: string
  tokenExpiresAt?: Date
}

export async function saveConnection(userId: string, conn: SocialConnectionInput) {
  const supabase = createClient()
  const { encrypted: access_token_encrypted, iv: access_token_iv } = encrypt(conn.accessToken)

  let refresh_token_encrypted: string | null = null
  let refresh_token_iv: string | null = null
  if (conn.refreshToken) {
    const r = encrypt(conn.refreshToken)
    refresh_token_encrypted = r.encrypted
    refresh_token_iv = r.iv
  }

  const { error } = await supabase.from('social_connections').upsert(
    {
      user_id: userId,
      platform: conn.platform,
      access_token_encrypted,
      access_token_iv,
      refresh_token_encrypted,
      refresh_token_iv,
      platform_user_id: conn.platformUserId ?? null,
      platform_username: conn.platformUsername ?? null,
      token_expires_at: conn.tokenExpiresAt?.toISOString() ?? null,
      scopes: conn.scopes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,platform' }
  )

  if (error) throw error
}

export async function getDecryptedTokens(
  userId: string,
  platform: string
): Promise<DecryptedTokens | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single()

  if (error || !data) return null

  return {
    accessToken: decrypt(data.access_token_encrypted, data.access_token_iv),
    refreshToken:
      data.refresh_token_encrypted && data.refresh_token_iv
        ? decrypt(data.refresh_token_encrypted, data.refresh_token_iv)
        : undefined,
    platformUserId: data.platform_user_id ?? undefined,
    platformUsername: data.platform_username ?? undefined,
    tokenExpiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
  }
}

export async function getUserConnections(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('social_connections')
    .select('platform, platform_username, created_at, token_expires_at')
    .eq('user_id', userId)

  return data ?? []
}

export async function deleteConnection(userId: string, platform: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_connections')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform)

  if (error) throw error
}
