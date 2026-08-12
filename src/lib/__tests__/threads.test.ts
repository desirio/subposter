import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postSingleThreadsPost, postThreadsThread } from '../threads'

const creds = { accessToken: 'test-token', userId: 'user-123' }

describe('postSingleThreadsPost', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a container and publishes it', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'container-1' }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'thread-1' }), { status: 200 })
      )

    const result = await postSingleThreadsPost('Hello Threads', creds)

    expect(result).toEqual({ success: true, threadId: 'thread-1' })
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)

    // Verify container creation call
    const [createUrl, createOpts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(createUrl).toBe('https://graph.threads.net/v1.0/user-123/threads')
    expect(createOpts.method).toBe('POST')

    // Verify publish call
    const [publishUrl] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1]
    expect(publishUrl).toBe('https://graph.threads.net/v1.0/user-123/threads_publish')
  })

  it('returns error when container creation fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Invalid token' } }), { status: 401 })
    )

    const result = await postSingleThreadsPost('Hello', creds)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid token')
  })

  it('returns error when publish fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'container-1' }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Publish error' } }), { status: 500 })
      )

    const result = await postSingleThreadsPost('Hello', creds)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Publish error')
  })
})

describe('postThreadsThread', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('chains replies using previous published IDs', async () => {
    vi.spyOn(globalThis, 'fetch')
      // First post: create + publish
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'c1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'p1' }), { status: 200 }))
      // Second post: create + publish
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'c2' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'p2' }), { status: 200 }))

    const result = await postThreadsThread(['First', 'Second'], creds)

    expect(result).toEqual({ success: true, threadId: 'p1' })
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)

    // Second container creation should include reply_to_id
    const secondCreateBody = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[2][1].body
    expect(secondCreateBody).toContain('reply_to_id=p1')
  })

  it('returns error if any post in thread fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'c1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'p1' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Rate limited' } }), { status: 429 })
      )

    const result = await postThreadsThread(['First', 'Second'], creds)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Rate limited')
  })
})
