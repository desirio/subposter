import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isArticleUrl, normalizeFeedUrl, fetchSubstackPosts } from '../substack'

describe('isArticleUrl', () => {
  it('detects Substack article URLs', () => {
    expect(isArticleUrl('https://author.substack.com/p/my-article')).toBe(true)
    expect(isArticleUrl('https://newsletter.substack.com/p/some-long-slug-here')).toBe(true)
  })

  it('rejects Substack homepage/feed URLs', () => {
    expect(isArticleUrl('https://author.substack.com')).toBe(false)
    expect(isArticleUrl('https://author.substack.com/')).toBe(false)
    expect(isArticleUrl('https://author.substack.com/feed')).toBe(false)
    expect(isArticleUrl('https://author.substack.com/archive')).toBe(false)
  })

  it('detects Medium article URLs', () => {
    expect(isArticleUrl('https://medium.com/@user/my-article-title-abc123def456')).toBe(true)
    expect(isArticleUrl('https://medium.com/@user/something-1234567890abcdef')).toBe(true)
  })

  it('rejects Medium profile URLs', () => {
    expect(isArticleUrl('https://medium.com/@user')).toBe(false)
    expect(isArticleUrl('https://medium.com/tag/javascript')).toBe(false)
  })

  it('detects generic blog article patterns', () => {
    expect(isArticleUrl('https://example.com/blog/my-post')).toBe(true)
    expect(isArticleUrl('https://example.com/posts/my-post')).toBe(true)
    expect(isArticleUrl('https://example.com/article/my-post')).toBe(true)
    expect(isArticleUrl('https://example.com/articles/my-post')).toBe(true)
  })

  it('detects date-based article paths', () => {
    expect(isArticleUrl('https://example.com/2024/01/my-post')).toBe(true)
    expect(isArticleUrl('https://example.com/2024/01/15/my-post')).toBe(true)
  })

  it('rejects generic homepage URLs', () => {
    expect(isArticleUrl('https://example.com')).toBe(false)
    expect(isArticleUrl('https://example.com/')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isArticleUrl('not-a-url')).toBe(false)
  })
})

describe('normalizeFeedUrl', () => {
  it('returns feed URLs unchanged', () => {
    expect(normalizeFeedUrl('https://author.substack.com/feed')).toBe('https://author.substack.com/feed')
    expect(normalizeFeedUrl('https://example.com/rss')).toBe('https://example.com/rss')
    expect(normalizeFeedUrl('https://example.com/atom.xml')).toBe('https://example.com/atom.xml')
  })

  it('converts Substack homepage to feed URL', () => {
    expect(normalizeFeedUrl('https://author.substack.com')).toBe('https://author.substack.com/feed')
    expect(normalizeFeedUrl('https://author.substack.com/')).toBe('https://author.substack.com/feed')
  })

  it('converts substack.com/@username to subdomain feed', () => {
    expect(normalizeFeedUrl('https://substack.com/@author')).toBe('https://author.substack.com/feed')
  })

  it('converts Medium profile to feed URL', () => {
    expect(normalizeFeedUrl('https://medium.com/@username')).toBe('https://medium.com/feed/@username')
  })

  it('converts Medium tag to feed URL', () => {
    expect(normalizeFeedUrl('https://medium.com/tag/javascript')).toBe('https://medium.com/feed/tag/javascript')
  })

  it('converts Medium custom domain to feed', () => {
    expect(normalizeFeedUrl('https://pub.medium.com')).toBe('https://pub.medium.com/feed')
  })

  it('appends /feed for generic URLs', () => {
    expect(normalizeFeedUrl('https://example.com/myblog')).toBe('https://example.com/myblog/feed')
  })

  it('returns input for invalid URLs', () => {
    expect(normalizeFeedUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('fetchSubstackPosts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses Readability directly for article URLs', async () => {
    const htmlContent = `
      <html>
        <head>
          <title>Test Article | Author</title>
          <meta property="og:title" content="Test Article" />
          <meta name="author" content="Test Author" />
          <meta property="article:published_time" content="2024-01-01" />
        </head>
        <body>
          <article><p>This is the article body content for testing.</p></article>
        </body>
      </html>
    `
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(htmlContent, { status: 200 })
    )

    const posts = await fetchSubstackPosts('https://author.substack.com/p/my-article')

    expect(posts).toHaveLength(1)
    expect(posts[0].link).toBe('https://author.substack.com/p/my-article')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('uses RSS for feed/homepage URLs', async () => {
    // Mock rss-parser — we need to mock the module
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>Test Blog</title>
          <item>
            <title>Post 1</title>
            <link>https://author.substack.com/p/post-1</link>
            <guid>1</guid>
            <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            <content:encoded><![CDATA[<p>Content 1</p>]]></content:encoded>
          </item>
          <item>
            <title>Post 2</title>
            <link>https://author.substack.com/p/post-2</link>
            <guid>2</guid>
            <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
            <content:encoded><![CDATA[<p>Content 2</p>]]></content:encoded>
          </item>
        </channel>
      </rss>
    `
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(rssXml, {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
      })
    )

    const posts = await fetchSubstackPosts('https://author.substack.com')

    expect(posts.length).toBeGreaterThanOrEqual(1)
  })

  it('throws on failed article fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not found', { status: 404 })
    )

    await expect(
      fetchSubstackPosts('https://author.substack.com/p/nonexistent')
    ).rejects.toThrow('Could not load article')
  })
})
