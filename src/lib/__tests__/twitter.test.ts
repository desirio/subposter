import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postSingleTweet, postThread } from '../twitter'

// Mock twitter-api-v2
const mockTweet = vi.fn()

vi.mock('twitter-api-v2', () => {
  return {
    TwitterApi: class MockTwitterApi {
      v2 = { tweet: mockTweet }
    },
  }
})

const creds = { accessToken: 'test-token' }

describe('postSingleTweet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts a tweet and returns success with tweetId', async () => {
    mockTweet.mockResolvedValueOnce({ data: { id: '12345' } })

    const result = await postSingleTweet('Hello world', creds)

    expect(result).toEqual({ success: true, tweetId: '12345' })
    expect(mockTweet).toHaveBeenCalledWith('Hello world')
  })

  it('returns error on API failure', async () => {
    mockTweet.mockRejectedValueOnce(new Error('Rate limit exceeded'))

    const result = await postSingleTweet('Hello', creds)

    expect(result).toEqual({ success: false, error: 'Rate limit exceeded' })
  })

  it('handles non-Error exceptions', async () => {
    mockTweet.mockRejectedValueOnce('string error')

    const result = await postSingleTweet('Hello', creds)

    expect(result).toEqual({ success: false, error: 'Unknown error' })
  })
})

describe('postThread', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts tweets as a thread with reply chaining', async () => {
    mockTweet
      .mockResolvedValueOnce({ data: { id: '100' } })
      .mockResolvedValueOnce({ data: { id: '101' } })
      .mockResolvedValueOnce({ data: { id: '102' } })

    const result = await postThread(['First', 'Second', 'Third'], creds)

    expect(result).toEqual({ success: true, tweetId: '100' })
    expect(mockTweet).toHaveBeenCalledTimes(3)

    // First tweet has no reply (but still passed as object)
    expect(mockTweet).toHaveBeenNthCalledWith(1, { text: 'First' })
    // Second tweet replies to first
    expect(mockTweet).toHaveBeenNthCalledWith(2, {
      text: 'Second',
      reply: { in_reply_to_tweet_id: '100' },
    })
    // Third tweet replies to second
    expect(mockTweet).toHaveBeenNthCalledWith(3, {
      text: 'Third',
      reply: { in_reply_to_tweet_id: '101' },
    })
  })

  it('returns error if any tweet in thread fails', async () => {
    mockTweet
      .mockResolvedValueOnce({ data: { id: '100' } })
      .mockRejectedValueOnce(new Error('Forbidden'))

    const result = await postThread(['First', 'Second'], creds)

    expect(result).toEqual({ success: false, error: 'Forbidden' })
  })
})
