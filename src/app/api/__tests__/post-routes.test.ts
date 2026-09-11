import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getValidXToken: vi.fn(),
  getValidThreadsToken: vi.fn(),
  getValidLinkedInToken: vi.fn(),
  postSingleTweet: vi.fn(),
  postThread: vi.fn(),
  postSingleThreadsPost: vi.fn(),
  postThreadsThread: vi.fn(),
  postToLinkedIn: vi.fn(),
}))

vi.mock('@/lib/auth-helpers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth-helpers')>()),
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}))
vi.mock('@/lib/token-refresh', () => ({
  getValidXToken: mocks.getValidXToken,
  getValidThreadsToken: mocks.getValidThreadsToken,
  getValidLinkedInToken: mocks.getValidLinkedInToken,
}))
vi.mock('@/lib/twitter', () => ({ postSingleTweet: mocks.postSingleTweet, postThread: mocks.postThread }))
vi.mock('@/lib/threads', () => ({
  postSingleThreadsPost: mocks.postSingleThreadsPost,
  postThreadsThread: mocks.postThreadsThread,
}))
vi.mock('@/lib/linkedin', () => ({ postToLinkedIn: mocks.postToLinkedIn }))

import { POST as postTweet } from '@/app/api/post-tweet/route'
import { POST as postThreads } from '@/app/api/post-threads/route'
import { POST as postLinkedIn } from '@/app/api/post-linkedin/route'

function body(tweets: string[], format: 'single' | 'thread') {
  return new NextRequest('http://localhost:3000/api/x', {
    method: 'POST',
    body: JSON.stringify({ tweets, format }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getAuthenticatedUser.mockResolvedValue({ id: 'user-1' })
})

describe('POST /api/post-tweet', () => {
  it('posts with the refreshed X token', async () => {
    mocks.getValidXToken.mockResolvedValue('fresh-token')
    mocks.postSingleTweet.mockResolvedValue({ success: true, tweetId: 'tw-1' })

    const res = await postTweet(body(['Hello'], 'single'))

    expect(mocks.getValidXToken).toHaveBeenCalledWith('user-1')
    expect(mocks.postSingleTweet).toHaveBeenCalledWith('Hello', { accessToken: 'fresh-token' })
    expect(await res.json()).toEqual({ success: true, tweetId: 'tw-1' })
  })

  it('returns 403 asking to reconnect when the token cannot be refreshed', async () => {
    mocks.getValidXToken.mockResolvedValue(null)

    const res = await postTweet(body(['Hello'], 'single'))

    expect(res.status).toBe(403)
    expect((await res.json()).error).toContain('Reconnect it in Settings')
    expect(mocks.postSingleTweet).not.toHaveBeenCalled()
  })

  it('returns 401 when signed out', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null)

    const res = await postTweet(body(['Hello'], 'single'))

    expect(res.status).toBe(401)
    expect(mocks.getValidXToken).not.toHaveBeenCalled()
  })
})

describe('POST /api/post-threads', () => {
  it('posts a thread with the refreshed Threads credentials', async () => {
    const creds = { accessToken: 'th-token', userId: 'th-user' }
    mocks.getValidThreadsToken.mockResolvedValue(creds)
    mocks.postThreadsThread.mockResolvedValue({ success: true, threadId: 'th-1' })

    await postThreads(body(['a', 'b'], 'thread'))

    expect(mocks.getValidThreadsToken).toHaveBeenCalledWith('user-1')
    expect(mocks.postThreadsThread).toHaveBeenCalledWith(['a', 'b'], creds)
  })

  it('returns 403 when Threads is not connected', async () => {
    mocks.getValidThreadsToken.mockResolvedValue(null)

    const res = await postThreads(body(['a'], 'single'))

    expect(res.status).toBe(403)
  })
})

describe('POST /api/post-linkedin', () => {
  it('posts with the stored LinkedIn credentials when still valid', async () => {
    const creds = { accessToken: 'li-token', personUrn: 'urn:li:person:abc' }
    mocks.getValidLinkedInToken.mockResolvedValue(creds)
    mocks.postToLinkedIn.mockResolvedValue({ success: true, postId: 'li-1' })

    await postLinkedIn(body(['Hello LinkedIn'], 'single'))

    expect(mocks.postToLinkedIn).toHaveBeenCalledWith('Hello LinkedIn', creds)
  })

  it('returns 403 once the LinkedIn token has expired', async () => {
    mocks.getValidLinkedInToken.mockResolvedValue(null)

    const res = await postLinkedIn(body(['Hello'], 'single'))

    expect(res.status).toBe(403)
    expect(mocks.postToLinkedIn).not.toHaveBeenCalled()
  })
})
