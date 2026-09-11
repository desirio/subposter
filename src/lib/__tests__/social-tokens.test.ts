import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockQuery } from '@/test/supabase-query-mock'

const mockCookieFrom = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/server', () => ({ createClient: () => ({ from: mockCookieFrom }) }))

import { getDecryptedTokens, saveConnection } from '@/lib/supabase/social-tokens'
import { encrypt } from '@/lib/crypto'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('TOKEN_ENCRYPTION_KEY', 'a'.repeat(64))
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getDecryptedTokens', () => {
  it('reads from the client it is given and decrypts the tokens', async () => {
    const access = encrypt('access-123')
    const refresh = encrypt('refresh-456')
    const q = mockQuery({
      data: {
        access_token_encrypted: access.encrypted,
        access_token_iv: access.iv,
        refresh_token_encrypted: refresh.encrypted,
        refresh_token_iv: refresh.iv,
        platform_user_id: 'x-id',
        platform_username: 'writer',
        token_expires_at: '2026-09-11T12:00:00.000Z',
      },
    })
    const admin = { from: vi.fn().mockReturnValue(q.builder) }

    const tokens = await getDecryptedTokens('user-1', 'x', admin as never)

    expect(admin.from).toHaveBeenCalledWith('social_connections')
    expect(mockCookieFrom).not.toHaveBeenCalled()
    expect(q.argsOf('eq')).toEqual([['user_id', 'user-1'], ['platform', 'x']])
    expect(tokens).toEqual({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      platformUserId: 'x-id',
      platformUsername: 'writer',
      tokenExpiresAt: new Date('2026-09-11T12:00:00.000Z'),
    })
  })

  it('returns null when there is no connection', async () => {
    const admin = { from: vi.fn().mockReturnValue(mockQuery({ error: { code: 'PGRST116' } }).builder) }

    expect(await getDecryptedTokens('user-1', 'x', admin as never)).toBeNull()
  })

  it("falls back to the signed-in user's client", async () => {
    mockCookieFrom.mockReturnValue(mockQuery({ data: null }).builder)

    await getDecryptedTokens('user-1', 'x')

    expect(mockCookieFrom).toHaveBeenCalledWith('social_connections')
  })
})

describe('saveConnection', () => {
  it('upserts encrypted tokens through the client it is given', async () => {
    const q = mockQuery({})
    const admin = { from: vi.fn().mockReturnValue(q.builder) }

    await saveConnection('user-1', { platform: 'x', accessToken: 'plain-access' }, admin as never)

    expect(mockCookieFrom).not.toHaveBeenCalled()
    const [row, options] = q.argsOf('upsert')[0] as [Record<string, unknown>, unknown]
    expect(options).toEqual({ onConflict: 'user_id,platform' })
    expect(row).toMatchObject({ user_id: 'user-1', platform: 'x' })
    expect(row.access_token_encrypted).not.toContain('plain-access')
  })
})
