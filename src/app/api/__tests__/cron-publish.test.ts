import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockPublishDuePosts = vi.hoisted(() => vi.fn())

vi.mock('@/lib/scheduled-publisher', () => ({ publishDuePosts: mockPublishDuePosts }))

import { GET } from '@/app/api/cron/publish-scheduled/route'

const SECRET = 'test-cron-secret-0123456789'
const URL = 'http://localhost:3000/api/cron/publish-scheduled'

function request(headers: Record<string, string> = {}, url = URL) {
  return new NextRequest(url, { headers })
}

describe('GET /api/cron/publish-scheduled', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('CRON_SECRET', SECRET)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('runs the publisher and returns its summary for a valid Bearer secret', async () => {
    const summary = { processed: 2, published: 1, failed: 1, interrupted: 0 }
    mockPublishDuePosts.mockResolvedValue(summary)

    const res = await GET(request({ authorization: `Bearer ${SECRET}` }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(summary)
    expect(mockPublishDuePosts).toHaveBeenCalledOnce()
  })

  it.each([
    ['no header', {}],
    ['a wrong secret', { authorization: 'Bearer not-the-secret' }],
    ['the secret without the Bearer prefix', { authorization: SECRET }],
    ['a secret with extra characters', { authorization: `Bearer ${SECRET}x` }],
  ])('rejects %s with 401', async (_label, headers) => {
    const res = await GET(request(headers))

    expect(res.status).toBe(401)
    expect(mockPublishDuePosts).not.toHaveBeenCalled()
  })

  it('no longer accepts the secret as a query parameter', async () => {
    const res = await GET(request({}, `${URL}?secret=${SECRET}`))

    expect(res.status).toBe(401)
    expect(mockPublishDuePosts).not.toHaveBeenCalled()
  })

  it('refuses to run at all when CRON_SECRET is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')

    const res = await GET(request({ authorization: 'Bearer ' }))

    expect(res.status).toBe(500)
    expect(mockPublishDuePosts).not.toHaveBeenCalled()
  })

  it('returns 500 when the publisher throws', async () => {
    mockPublishDuePosts.mockRejectedValue(new Error('database unavailable'))

    const res = await GET(request({ authorization: `Bearer ${SECRET}` }))

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'database unavailable' })
  })
})
