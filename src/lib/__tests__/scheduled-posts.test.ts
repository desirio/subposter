import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase clients
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockInsert = vi.fn(() => ({ select: mockSelect }))
const mockEq = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockOrder = vi.fn()
const mockLte = vi.fn()

function buildQueryChain(data: unknown, error: unknown = null) {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: undefined as unknown,
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
  // For queries that don't call .single() (like getUserScheduledPosts)
  // make the chain itself resolve
  return chain
}

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
  getPostsDueForPublishing,
} from '@/lib/supabase/scheduled-posts'

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

describe('getPostsDueForPublishing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns scheduled posts due for publishing', async () => {
    const posts = [{ id: '1', status: 'scheduled' }]
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: posts, error: null }),
    }
    mockFrom.mockReturnValue(chain)

    const result = await getPostsDueForPublishing()

    expect(result).toEqual(posts)
  })
})
