import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing auth-helpers
const mockGetUser = vi.fn()
const mockGetDecryptedTokens = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/social-tokens', () => ({
  getDecryptedTokens: (...args: unknown[]) => mockGetDecryptedTokens(...args),
}))

import {
  getAuthenticatedUser,
  unauthorizedResponse,
  notConnectedResponse,
  getUserPlatformTokens,
} from '@/lib/auth-helpers'

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when session exists', async () => {
    const fakeUser = { id: 'user-1', email: 'test@example.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: fakeUser }, error: null })

    const user = await getAuthenticatedUser()

    expect(user).toEqual(fakeUser)
  })

  it('returns null when no session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const user = await getAuthenticatedUser()

    expect(user).toBeNull()
  })

  it('returns null when auth error occurs', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Session expired'),
    })

    const user = await getAuthenticatedUser()

    expect(user).toBeNull()
  })
})

describe('unauthorizedResponse', () => {
  it('returns 401 with error message', async () => {
    const response = unauthorizedResponse()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })
})

describe('notConnectedResponse', () => {
  it('returns 403 with platform-specific message', async () => {
    const response = notConnectedResponse('X')

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('X not connected')
  })
})

describe('getUserPlatformTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns decrypted tokens for a platform', async () => {
    const tokens = { accessToken: 'decrypted-token', refreshToken: 'refresh' }
    mockGetDecryptedTokens.mockResolvedValueOnce(tokens)

    const result = await getUserPlatformTokens('user-1', 'x')

    expect(result).toEqual(tokens)
    expect(mockGetDecryptedTokens).toHaveBeenCalledWith('user-1', 'x')
  })

  it('returns null when no tokens exist', async () => {
    mockGetDecryptedTokens.mockResolvedValueOnce(null)

    const result = await getUserPlatformTokens('user-1', 'threads')

    expect(result).toBeNull()
  })
})
