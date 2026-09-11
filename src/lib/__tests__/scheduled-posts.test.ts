import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import {
  createScheduledPost,
  getUserScheduledPosts,
  updateScheduledPost,
  deleteScheduledPost,
  claimDuePosts,
  completePublishing,
  failStalePublishingPosts,
} from '@/lib/supabase/scheduled-posts'
import { mockQuery } from '@/test/supabase-query-mock'

describe('createScheduledPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts a post with correct fields', async () => {
    const fakePost = {
      id: 'post-1',
      user_id: 'user-1',
      platform: 'x',
      format: 'single',
      content: { tweets: ['Hello'] },
      status: 'draft',
      scheduled_at: null,
      posted_at: null,
      error_message: null,
      source_article_title: 'My Article',
      source_article_link: 'https://example.com/article',
      skill_used: null,
      platform_post_id: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }

    const chain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: fakePost, error: null }),
      }),
    }
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue(chain) })

    const result = await createScheduledPost('user-1', {
      platform: 'x',
      format: 'single',
      content: { tweets: ['Hello'] },
      sourceArticleTitle: 'My Article',
      sourceArticleLink: 'https://example.com/article',
    })

    expect(result).toEqual(fakePost)
    expect(mockFrom).toHaveBeenCalledWith('scheduled_posts')
  })

  it('throws on database error', async () => {
    const chain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }),
    }
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue(chain) })

    await expect(
      createScheduledPost('user-1', {
        platform: 'x',
        format: 'single',
        content: { tweets: ['Hello'] },
      })
    ).rejects.toThrow()
  })
})

describe('getUserScheduledPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns posts for a user', async () => {
    const posts = [
      { id: '1', platform: 'x', status: 'draft' },
      { id: '2', platform: 'linkedin', status: 'scheduled' },
    ]

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: posts, error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getUserScheduledPosts('user-1')

    expect(result).toEqual(posts)
  })

  it('filters by status when provided', async () => {
    const filteredPosts = [{ id: '1', status: 'draft' }]
    // The flow is: .from().select().eq(user_id).order() → query
    // Then: query.eq(status) → awaited result
    // So .order() must return something with .eq() that resolves
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        // This is what query.eq('status', status) returns (the final awaited value)
        eq: vi.fn().mockResolvedValue({ data: filteredPosts, error: null }),
      }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getUserScheduledPosts('user-1', 'draft')

    expect(result).toEqual(filteredPosts)
  })
})

describe('updateScheduledPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates post status', async () => {
    const updatedPost = { id: 'post-1', status: 'scheduled' }

    const chain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: updatedPost, error: null }),
      }),
    }
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue(chain) })

    const result = await updateScheduledPost('user-1', 'post-1', { status: 'scheduled' })

    expect(result).toEqual(updatedPost)
  })
})

describe('deleteScheduledPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a post without error', async () => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
    }
    // The second .eq() resolves
    let eqCount = 0
    chain.eq = vi.fn().mockImplementation(() => {
      eqCount++
      if (eqCount >= 2) {
        return Promise.resolve({ error: null })
      }
      return chain
    })
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnValue(chain) })

    await expect(deleteScheduledPost('user-1', 'post-1')).resolves.toBeUndefined()
  })
})

describe('claimDuePosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds due scheduled posts, then claims them only if still scheduled', async () => {
    const due = mockQuery({ data: [{ id: 'a' }, { id: 'b' }] })
    const claimed = [{ id: 'a', status: 'publishing' }, { id: 'b', status: 'publishing' }]
    const claim = mockQuery({ data: claimed })
    mockFrom.mockReturnValueOnce(due.builder).mockReturnValueOnce(claim.builder)

    const result = await claimDuePosts()

    expect(result).toEqual(claimed)
    expect(due.argsOf('eq')).toContainEqual(['status', 'scheduled'])
    expect(due.argsOf('lte')[0][0]).toBe('scheduled_at')
    expect(due.argsOf('limit')).toEqual([[25]])

    expect(claim.argsOf('update')[0][0]).toMatchObject({ status: 'publishing' })
    expect(claim.argsOf('in')).toEqual([['id', ['a', 'b']]])
    // The status guard on the UPDATE is what stops two runs claiming the same post
    expect(claim.argsOf('eq')).toContainEqual(['status', 'scheduled'])
  })

  it('returns only the posts this run won when another run claimed some first', async () => {
    const due = mockQuery({ data: [{ id: 'a' }, { id: 'b' }] })
    const claim = mockQuery({ data: [{ id: 'b', status: 'publishing' }] })
    mockFrom.mockReturnValueOnce(due.builder).mockReturnValueOnce(claim.builder)

    const result = await claimDuePosts()

    expect(result.map((p) => p.id)).toEqual(['b'])
  })

  it('does not run an update when nothing is due', async () => {
    mockFrom.mockReturnValueOnce(mockQuery({ data: [] }).builder)

    const result = await claimDuePosts()

    expect(result).toEqual([])
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('throws when the claim fails', async () => {
    mockFrom
      .mockReturnValueOnce(mockQuery({ data: [{ id: 'a' }] }).builder)
      .mockReturnValueOnce(mockQuery({ error: new Error('constraint violation') }).builder)

    await expect(claimDuePosts()).rejects.toThrow('constraint violation')
  })
})

describe('completePublishing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks a successful post as posted with its platform id', async () => {
    const q = mockQuery({})
    mockFrom.mockReturnValue(q.builder)

    await completePublishing('post-1', { success: true, platformPostId: 'tw-9' })

    const update = q.argsOf('update')[0][0] as Record<string, unknown>
    expect(update).toMatchObject({ status: 'posted', platform_post_id: 'tw-9', error_message: null })
    expect(update.posted_at).toEqual(expect.any(String))
    expect(q.argsOf('eq')).toEqual([['id', 'post-1'], ['status', 'publishing']])
  })

  it('marks a failed post as failed with the error', async () => {
    const q = mockQuery({})
    mockFrom.mockReturnValue(q.builder)

    await completePublishing('post-1', { success: false, error: 'Rate limited' })

    expect(q.argsOf('update')[0][0]).toMatchObject({ status: 'failed', error_message: 'Rate limited' })
  })
})

describe('failStalePublishingPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails posts stuck in publishing longer than the cutoff and returns the count', async () => {
    const q = mockQuery({ data: [{ id: 'x' }, { id: 'y' }] })
    mockFrom.mockReturnValue(q.builder)

    const count = await failStalePublishingPosts(10 * 60 * 1000)

    expect(count).toBe(2)
    expect(q.argsOf('update')[0][0]).toMatchObject({ status: 'failed' })
    expect(q.argsOf('eq')).toEqual([['status', 'publishing']])
    const [column, cutoff] = q.argsOf('lt')[0] as [string, string]
    expect(column).toBe('updated_at')
    expect(Date.now() - new Date(cutoff).getTime()).toBeGreaterThanOrEqual(10 * 60 * 1000 - 1000)
  })
})
