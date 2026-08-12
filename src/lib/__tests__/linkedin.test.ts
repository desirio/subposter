import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postToLinkedIn } from '../linkedin'

const creds = { accessToken: 'test-token', personUrn: 'urn:li:person:abc123' }

describe('postToLinkedIn', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends correct payload with person URN and returns postId', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', {
        status: 201,
        headers: { 'x-restli-id': 'post-456' },
      })
    )

    const result = await postToLinkedIn('My LinkedIn post', creds)

    expect(result).toEqual({ success: true, postId: 'post-456' })

    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('https://api.linkedin.com/rest/posts')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer test-token')
    expect(opts.headers['Linkedin-Version']).toBe('202601')

    const body = JSON.parse(opts.body)
    expect(body.author).toBe('urn:li:person:abc123')
    expect(body.commentary).toBe('My LinkedIn post')
    expect(body.visibility).toBe('PUBLIC')
    expect(body.lifecycleState).toBe('PUBLISHED')
  })

  it('returns error on API failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 })
    )

    const result = await postToLinkedIn('Hello', creds)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('handles non-JSON error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Server Error', { status: 500 })
    )

    const result = await postToLinkedIn('Hello', creds)

    expect(result.success).toBe(false)
    expect(result.error).toContain('500')
  })

  it('returns "unknown" postId when header is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 201 })
    )

    const result = await postToLinkedIn('Hello', creds)

    expect(result).toEqual({ success: true, postId: 'unknown' })
  })
})
