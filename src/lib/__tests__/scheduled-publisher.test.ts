import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScheduledPost } from '@/lib/supabase/scheduled-posts'

const ADMIN = { __client: 'admin' }

const mocks = vi.hoisted(() => ({
  claimDuePosts: vi.fn(),
  completePublishing: vi.fn(),
  failStalePublishingPosts: vi.fn(),
  cookieClient: vi.fn(),
  getValidXToken: vi.fn(),
  getValidThreadsToken: vi.fn(),
  getValidLinkedInToken: vi.fn(),
  postSingleTweet: vi.fn(),
  postThread: vi.fn(),
  postSingleThreadsPost: vi.fn(),
  postThreadsThread: vi.fn(),
  postToLinkedIn: vi.fn(),
}))

vi.mock('@/lib/supabase/scheduled-posts', () => ({
  claimDuePosts: mocks.claimDuePosts,
  completePublishing: mocks.completePublishing,
  failStalePublishingPosts: mocks.failStalePublishingPosts,
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ADMIN }))
// The cron has no user session: touching the cookie client is the original bug
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.cookieClient }))
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

import { publishDuePosts } from '@/lib/scheduled-publisher'

function post(overrides: Partial<ScheduledPost>): ScheduledPost {
  return {
    id: 'post-1',
    user_id: 'user-1',
    platform: 'x',
    format: 'single',
    content: { tweets: ['Hello world'] },
    status: 'publishing',
    scheduled_at: '2026-09-11T10:00:00Z',
    posted_at: null,
    error_message: null,
    source_article_title: null,
    source_article_link: null,
    skill_used: null,
    platform_post_id: null,
    created_at: '2026-09-11T09:00:00Z',
    updated_at: '2026-09-11T10:00:00Z',
    ...overrides,
  }
}

describe('publishDuePosts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.failStalePublishingPosts.mockResolvedValue(0)
    mocks.completePublishing.mockResolvedValue(undefined)
    mocks.cookieClient.mockImplementation(() => {
      throw new Error('cookie client used outside a user request')
    })
  })

  it('publishes a single X post using a token fetched with the admin client', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({})])
    mocks.getValidXToken.mockResolvedValue('x-token')
    mocks.postSingleTweet.mockResolvedValue({ success: true, tweetId: 'tw-1' })

    const summary = await publishDuePosts()

    expect(mocks.getValidXToken).toHaveBeenCalledWith('user-1', ADMIN)
    expect(mocks.postSingleTweet).toHaveBeenCalledWith('Hello world', { accessToken: 'x-token' })
    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', { success: true, platformPostId: 'tw-1' })
    expect(mocks.cookieClient).not.toHaveBeenCalled()
    expect(summary).toEqual({ processed: 1, published: 1, failed: 0, interrupted: 0 })
  })

  it('publishes an X thread with every tweet', async () => {
    const tweets = ['1/ Start', '2/ Middle', '3/ End']
    mocks.claimDuePosts.mockResolvedValue([post({ format: 'thread', content: { tweets } })])
    mocks.getValidXToken.mockResolvedValue('x-token')
    mocks.postThread.mockResolvedValue({ success: true, tweetId: 'tw-first' })

    await publishDuePosts()

    expect(mocks.postThread).toHaveBeenCalledWith(tweets, { accessToken: 'x-token' })
    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', { success: true, platformPostId: 'tw-first' })
  })

  it('publishes Threads posts and threads with the stored Threads user', async () => {
    const creds = { accessToken: 'th-token', userId: 'th-user' }
    mocks.claimDuePosts.mockResolvedValue([
      post({ id: 'single', platform: 'threads' }),
      post({ id: 'thread', platform: 'threads', format: 'thread', content: { tweets: ['a', 'b'] } }),
    ])
    mocks.getValidThreadsToken.mockResolvedValue(creds)
    mocks.postSingleThreadsPost.mockResolvedValue({ success: true, threadId: 'th-1' })
    mocks.postThreadsThread.mockResolvedValue({ success: true, threadId: 'th-2' })

    const summary = await publishDuePosts()

    expect(mocks.getValidThreadsToken).toHaveBeenCalledWith('user-1', ADMIN)
    expect(mocks.postSingleThreadsPost).toHaveBeenCalledWith('Hello world', creds)
    expect(mocks.postThreadsThread).toHaveBeenCalledWith(['a', 'b'], creds)
    expect(mocks.completePublishing).toHaveBeenCalledWith('single', { success: true, platformPostId: 'th-1' })
    expect(mocks.completePublishing).toHaveBeenCalledWith('thread', { success: true, platformPostId: 'th-2' })
    expect(summary.published).toBe(2)
  })

  it('publishes LinkedIn posts with the member URN', async () => {
    const creds = { accessToken: 'li-token', personUrn: 'urn:li:person:abc' }
    mocks.claimDuePosts.mockResolvedValue([post({ platform: 'linkedin' })])
    mocks.getValidLinkedInToken.mockResolvedValue(creds)
    mocks.postToLinkedIn.mockResolvedValue({ success: true, postId: 'li-1' })

    await publishDuePosts()

    expect(mocks.getValidLinkedInToken).toHaveBeenCalledWith('user-1', ADMIN)
    expect(mocks.postToLinkedIn).toHaveBeenCalledWith('Hello world', creds)
    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', { success: true, platformPostId: 'li-1' })
  })

  it('fails the post with a reconnect message when there is no valid token', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({})])
    mocks.getValidXToken.mockResolvedValue(null)

    const summary = await publishDuePosts()

    expect(mocks.postSingleTweet).not.toHaveBeenCalled()
    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', {
      success: false,
      error: 'X is not connected or its login has expired. Reconnect it in Settings.',
    })
    expect(summary).toMatchObject({ published: 0, failed: 1 })
  })

  it('records the platform error when posting is rejected', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({})])
    mocks.getValidXToken.mockResolvedValue('x-token')
    mocks.postSingleTweet.mockResolvedValue({ success: false, error: 'Duplicate content' })

    await publishDuePosts()

    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', { success: false, error: 'Duplicate content' })
  })

  it('keeps going after one post throws', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({ id: 'bad' }), post({ id: 'good' })])
    mocks.getValidXToken.mockRejectedValueOnce(new Error('decrypt failed')).mockResolvedValueOnce('x-token')
    mocks.postSingleTweet.mockResolvedValue({ success: true, tweetId: 'tw-2' })

    const summary = await publishDuePosts()

    expect(mocks.completePublishing).toHaveBeenCalledWith('bad', { success: false, error: 'decrypt failed' })
    expect(mocks.completePublishing).toHaveBeenCalledWith('good', { success: true, platformPostId: 'tw-2' })
    expect(summary).toEqual({ processed: 2, published: 1, failed: 1, interrupted: 0 })
  })

  it('keeps going when recording a result fails', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({ id: 'a' }), post({ id: 'b' })])
    mocks.getValidXToken.mockResolvedValue('x-token')
    mocks.postSingleTweet.mockResolvedValue({ success: true, tweetId: 'tw' })
    mocks.completePublishing.mockRejectedValueOnce(new Error('db down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const summary = await publishDuePosts()

    expect(mocks.postSingleTweet).toHaveBeenCalledTimes(2)
    expect(summary.published).toBe(2)
  })

  it('fails posts with no content without calling the platform', async () => {
    mocks.claimDuePosts.mockResolvedValue([post({ content: { tweets: [] } })])

    await publishDuePosts()

    expect(mocks.getValidXToken).not.toHaveBeenCalled()
    expect(mocks.completePublishing).toHaveBeenCalledWith('post-1', { success: false, error: 'Post has no content' })
  })

  it('sweeps interrupted posts before claiming new ones', async () => {
    const order: string[] = []
    mocks.failStalePublishingPosts.mockImplementation(async () => {
      order.push('sweep')
      return 3
    })
    mocks.claimDuePosts.mockImplementation(async () => {
      order.push('claim')
      return []
    })

    const summary = await publishDuePosts()

    expect(order).toEqual(['sweep', 'claim'])
    expect(summary).toEqual({ processed: 0, published: 0, failed: 0, interrupted: 3 })
  })
})
