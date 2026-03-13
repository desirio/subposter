import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
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

function normalizeFeedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const { hostname, pathname } = parsed;

    // Already looks like a feed URL
    if (/\/(feed|rss|atom)(\.xml)?$/.test(pathname)) return url;

    // Substack: substack.com/@username → username.substack.com/feed
    if (hostname === 'substack.com') {
      const atMatch = pathname.match(/^\/@([^/]+)/);
      if (atMatch) return `https://${atMatch[1]}.substack.com/feed`;
    }

    // Substack: publication.substack.com → publication.substack.com/feed
    if (hostname.endsWith('.substack.com')) {
      return `${parsed.origin}/feed`;
    }

    // Medium: medium.com/@username (profile, not a single post)
    if (hostname === 'medium.com') {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 1 && parts[0].startsWith('@')) {
        return `https://medium.com/feed/${parts[0]}`;
      }
      // Medium tag/topic feeds
      if (pathname.startsWith('/tag/') || pathname.startsWith('/topic/')) {
        return `https://medium.com/feed${pathname}`;
      }
    }

    // Medium custom publication: pub.medium.com → pub.medium.com/feed
    if (hostname.endsWith('.medium.com')) {
      return `${parsed.origin}/feed`;
    }

    // Generic: try appending /feed
    return `${parsed.origin}${pathname.replace(/\/$/, '')}/feed`;
  } catch {
    return url;
  }
}

async function fetchWithReadability(url: string): Promise<SubstackPost> {
  const cleanUrl = url.split('?')[0];

  const res = await fetch(cleanUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubPoster/1.0)' },
  });
  if (!res.ok) throw new Error(`Failed to fetch page: HTTP ${res.status}`);

  const html = await res.text();
  const dom = new JSDOM(html, { url: cleanUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const $ = cheerio.load(html);
  const title = (
    article?.title ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    'Untitled'
  ).replace(/\s*\|.*$/, '').trim();

  const author =
    article?.byline ||
    $('meta[name="author"]').attr('content') ||
    '';

  const pubDate =
    $('meta[property="article:published_time"]').attr('content') || '';

  const content = article?.content || $('meta[property="og:description"]').attr('content') || '';
  const contentSnippet = (article?.textContent?.trim() || stripHtml(content)).slice(0, 300);

  return {
    id: cleanUrl,
    title,
    link: cleanUrl,
    pubDate,
    contentSnippet,
    content,
    author: author || undefined,
  };
}

export async function fetchSubstackPosts(url: string): Promise<SubstackPost[]> {
  const feedUrl = normalizeFeedUrl(url);

  // Try RSS first
  try {
    const feed = await parser.parseURL(feedUrl);
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
  } catch {
    // RSS failed — treat as a single article URL
  }

  // Fall back to single article extraction
  try {
    const post = await fetchWithReadability(url);
    return [post];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not load content from ${url}. ` +
      `Try a publication feed URL (e.g. example.substack.com or medium.com/@username) ` +
      `or a direct article link. (${msg})`
    );
  }
}
