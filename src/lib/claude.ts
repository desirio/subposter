import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import { SubstackPost, TweetFormat, TweetTone, TweetVariant } from './types';
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/tweet-generation';

const client = new Anthropic();

function parseXmlVariants(xmlText: string, format: TweetFormat): TweetVariant[] {
  const variantsMatch = xmlText.match(/<variants>([\s\S]*?)<\/variants>/);
  if (!variantsMatch) return [];

  const variantsContent = variantsMatch[1];
  const variantBlocks = variantsContent.match(/<variant>([\s\S]*?)<\/variant>/g) || [];

  return variantBlocks.map((block) => {
    const labelMatch = block.match(/<label>([\s\S]*?)<\/label>/);
    const label = labelMatch ? labelMatch[1].trim() : 'Variant';

    let tweets: string[] = [];

    if (format === 'single') {
      const tweetMatch = block.match(/<tweet>([\s\S]*?)<\/tweet>/);
      if (tweetMatch) {
        tweets = [tweetMatch[1].trim()];
      }
    } else {
      const threadMatch = block.match(/<thread>([\s\S]*?)<\/thread>/);
      if (threadMatch) {
        const tweetMatches = threadMatch[1].match(/<tweet>([\s\S]*?)<\/tweet>/g) || [];
        tweets = tweetMatches.map((t) => {
          const m = t.match(/<tweet>([\s\S]*?)<\/tweet>/);
          return m ? m[1].trim() : '';
        }).filter(Boolean);
      }
    }

    return {
      id: uuid(),
      format,
      label,
      tweets,
    };
  });
}

function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Unknown error';
  // Anthropic SDK errors look like: "400 {"type":"error","error":{"message":"..."}}"
  const match = err.message.match(/"message"\s*:\s*"([^"]+)"/);
  if (match) return match[1];
  return err.message;
}

export async function generateTweetVariants(
  post: SubstackPost,
  formats: TweetFormat[],
  tone: TweetTone,
  includeLink: boolean
): Promise<TweetVariant[]> {
  const allVariants: TweetVariant[] = [];

  for (const format of formats) {
    const userPrompt = buildUserPrompt(post, format, tone, includeLink);

    let message;
    try {
      message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const variants = parseXmlVariants(responseText, format);
    allVariants.push(...variants);
  }

  return allVariants;
}
