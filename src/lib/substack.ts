import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { SubstackPost } from './types';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'dc:creator'],
  },
});

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  return $.text().trim();
}

function isSinglePostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // substack.com/@username/note/c-XXXXX
    if (parsed.hostname === 'substack.com' && /\/@[^/]+\/note\//.test(parsed.pathname)) {
      return true;
    }
    // publication.substack.com/p/post-slug
    if (parsed.hostname.endsWith('.substack.com') && parsed.pathname.startsWith('/p/')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Don't normalize individual post URLs
    if (isSinglePostUrl(url)) return url;
    // Handle substack.com/@username profile URLs → username.substack.com/feed
    if (parsed.hostname === 'substack.com') {
      const atMatch = parsed.pathname.match(/^\/@([^/]+)/);
      if (atMatch) {
        return `https://${atMatch[1]}.substack.com/feed`;
      }
    }
    // Handle publication.substack.com (no /feed suffix)
    if (parsed.hostname.endsWith('.substack.com') && !parsed.pathname.endsWith('/feed')) {
      return `${parsed.origin}/feed`;
    }
    return url;
  } catch {
    return url;
  }
}

async function fetchSinglePost(url: string): Promise<SubstackPost> {
  // Strip tracking params
  const cleanUrl = url.split('?')[0];

  const res = await fetch(cleanUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubPoster/1.0)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch page: HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = ($('meta[property="og:title"]').attr('content') || $('title').text() || 'Untitled')
    .replace(/\s*\|?\s*Substack\s*$/, '')
    .trim();

  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const author = $('meta[name="author"]').attr('content') || '';
  const pubDate = $('meta[property="article:published_time"]').attr('content') || '';

  // Try to get full article body
  const bodyEl = $('.available-content, .post-content, .body.markup, article .body');
  const rawContent = bodyEl.length ? bodyEl.html() || '' : '';
  const contentSnippet = rawContent
    ? stripHtml(rawContent).slice(0, 300)
    : ogDescription.slice(0, 300);

  return {
    id: cleanUrl,
    title,
    link: cleanUrl,
    pubDate,
    contentSnippet,
    content: rawContent || ogDescription,
    author: author || undefined,
  };
}

export async function fetchSubstackPosts(url: string): Promise<SubstackPost[]> {
  // Single post / note URL — return it as a one-item list
  if (isSinglePostUrl(url)) {
    const post = await fetchSinglePost(url);
    return [post];
  }

  const feedUrl = normalizeUrl(url);
  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No RSS feed found at ${feedUrl}. ` +
      `Make sure the URL is a Substack publication (e.g. example.substack.com) or a direct post link. ` +
      `(${msg})`
    );
  }

  return feed.items.slice(0, 10).map((item) => {
    const extItem = item as unknown as Record<string, string>;
    const rawContent = extItem['content:encoded'] || item.content || '';
    const snippet = stripHtml(rawContent).slice(0, 300);

    return {
      id: item.guid || item.link || String(Date.now()),
      title: item.title || 'Untitled',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || '',
      contentSnippet: snippet,
      content: rawContent,
      author: extItem['dc:creator'] || item.creator || undefined,
    };
  });
}