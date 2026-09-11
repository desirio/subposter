import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ADMIN = { __client: 'admin' }
const COOKIE = { __client: 'cookie' }
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const mocks = vi.hoisted(() => ({
  getDecryptedTokens: vi.fn(),
  saveConnection: vi.fn(),
  refreshOAuth2Token: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('@/lib/supabase/social-tokens', () => ({
  getDecryptedTokens: mocks.getDecryptedTokens,
  saveConnection: mocks.saveConnection,
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => COOKIE }))
vi.mock('twitter-api-v2', () => ({
  TwitterApi: class {
    refreshOAuth2Token = mocks.refreshOAuth2Token
  },
}))

import { getValidXToken, getValidLinkedInToken, getValidThreadsToken } from '@/lib/token-refresh'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getValidXToken', () => {
  const stored = {
    accessToken: 'old-access',
    refreshToken: 'old-refresh',
    platformUserId: 'x-id',
    platformUsername: 'writer',
  }

  it('returns the stored token while it is still valid', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + HOUR) })

    expect(await getValidXToken('user-1', ADMIN as never)).toBe('old-access')
    expect(mocks.getDecryptedTokens).toHaveBeenCalledWith('user-1', 'x', ADMIN)
    expect(mocks.refreshOAuth2Token).not.toHaveBeenCalled()
  })

  it('refreshes an expired token and saves the new pair through the same client', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() - HOUR) })
    mocks.refreshOAuth2Token.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      expiresIn: 7200,
    })

    const token = await getValidXToken('user-1', ADMIN as never)

    expect(token).toBe('new-access')
    expect(mocks.refreshOAuth2Token).toHaveBeenCalledWith('old-refresh')
    const [userId, saved, client] = mocks.saveConnection.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(client).toBe(ADMIN)
    expect(saved).toMatchObject({
      platform: 'x',
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      platformUserId: 'x-id',
      platformUsername: 'writer',
    })
    expect(saved.tokenExpiresAt.getTime()).toBeGreaterThan(Date.now() + HOUR)
  })

  it('refreshes a token that expires within 5 minutes', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + 60_000) })
    mocks.refreshOAuth2Token.mockResolvedValue({ accessToken: 'new', refreshToken: 'r', expiresIn: 7200 })

    expect(await getValidXToken('user-1', ADMIN as never)).toBe('new')
  })

  it('returns null when expired and there is no refresh token', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({
      ...stored,
      refreshToken: undefined,
      tokenExpiresAt: new Date(Date.now() - HOUR),
    })

    expect(await getValidXToken('user-1', ADMIN as never)).toBeNull()
  })

  it('returns null without saving when the refresh is rejected', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() - HOUR) })
    mocks.refreshOAuth2Token.mockRejectedValue(new Error('invalid_grant'))

    expect(await getValidXToken('user-1', ADMIN as never)).toBeNull()
    expect(mocks.saveConnection).not.toHaveBeenCalled()
  })

  it('returns null when X is not connected', async () => {
    mocks.getDecryptedTokens.mockResolvedValue(null)

    expect(await getValidXToken('user-1', ADMIN as never)).toBeNull()
  })

  it("uses the signed-in user's client when none is passed", async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + HOUR) })

    await getValidXToken('user-1')

    expect(mocks.getDecryptedTokens).toHaveBeenCalledWith('user-1', 'x', COOKIE)
  })
})

describe('getValidLinkedInToken', () => {
  it('returns the token and member URN while valid', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({
      accessToken: 'li',
      platformUserId: 'urn:li:person:abc',
      tokenExpiresAt: new Date(Date.now() + 30 * DAY),
    })

    expect(await getValidLinkedInToken('user-1', ADMIN as never)).toEqual({
      accessToken: 'li',
      personUrn: 'urn:li:person:abc',
    })
    expect(mocks.getDecryptedTokens).toHaveBeenCalledWith('user-1', 'linkedin', ADMIN)
  })

  it('returns null once expired, since LinkedIn needs a full reconnect', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({
      accessToken: 'li',
      platformUserId: 'urn:li:person:abc',
      tokenExpiresAt: new Date(Date.now() - DAY),
    })

    expect(await getValidLinkedInToken('user-1', ADMIN as never)).toBeNull()
  })

  it('returns null when the member URN is missing', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ accessToken: 'li' })

    expect(await getValidLinkedInToken('user-1', ADMIN as never)).toBeNull()
  })
})

describe('getValidThreadsToken', () => {
  const stored = { accessToken: 'th-old', platformUserId: 'th-user', platformUsername: 'writer' }

  it('returns the stored token without refreshing when far from expiry', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + 30 * DAY) })

    expect(await getValidThreadsToken('user-1', ADMIN as never)).toEqual({ accessToken: 'th-old', userId: 'th-user' })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('refreshes within 7 days of expiry and saves through the same client', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + 2 * DAY) })
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'th-new', expires_in: 60 * 24 * 60 * 60 }),
    })

    const creds = await getValidThreadsToken('user-1', ADMIN as never)

    expect(creds).toEqual({ accessToken: 'th-new', userId: 'th-user' })
    expect(String(mocks.fetch.mock.calls[0][0])).toContain('grant_type=th_refresh_token')
    const [, saved, client] = mocks.saveConnection.mock.calls[0]
    expect(client).toBe(ADMIN)
    expect(saved).toMatchObject({ platform: 'threads', accessToken: 'th-new', platformUserId: 'th-user' })
  })

  it('falls back to the current token when a refresh fails before expiry', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() + 2 * DAY) })
    mocks.fetch.mockResolvedValue({ ok: false })

    expect(await getValidThreadsToken('user-1', ADMIN as never)).toEqual({ accessToken: 'th-old', userId: 'th-user' })
  })

  it('returns null when expired and the refresh fails', async () => {
    mocks.getDecryptedTokens.mockResolvedValue({ ...stored, tokenExpiresAt: new Date(Date.now() - DAY) })
    mocks.fetch.mockRejectedValue(new Error('network'))

    expect(await getValidThreadsToken('user-1', ADMIN as never)).toBeNull()
  })
})
