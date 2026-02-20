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

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('.substack.com') && !parsed.pathname.endsWith('/feed')) {
      return `${parsed.origin}/feed`;
    }
    return url;
  } catch {
    return url;
  }
}

export async function fetchSubstackPosts(url: string): Promise<SubstackPost[]> {
  const feedUrl = normalizeUrl(url);
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
}
