import { SubstackPost, TweetFormat, TweetTone } from '../lib/types';

export const SYSTEM_PROMPT = `You are an expert social media copywriter specializing in converting long-form content into engaging tweets. You write in a conversational, authentic voice that resonates with readers. Always stay true to the original content while making it punchy and shareable.`;

const TONE_DESCRIPTIONS: Record<TweetTone, string> = {
  casual: 'friendly, conversational, and relaxed — like texting a friend',
  professional: 'authoritative, clear, and polished — like a trusted expert',
  witty: 'clever, humorous, and memorable — makes people smile and share',
  inspirational: 'motivating, uplifting, and thought-provoking — sparks reflection',
};

export function buildUserPrompt(
  post: SubstackPost,
  format: TweetFormat,
  tone: TweetTone,
  includeLink: boolean
): string {
  const toneDesc = TONE_DESCRIPTIONS[tone];
  const linkInstruction = includeLink
    ? `\n\nInclude this URL at the end of the tweet (or the first tweet in a thread): ${post.link}`
    : '';

  const contentSection = `
Article Title: ${post.title}
${post.author ? `Author: ${post.author}` : ''}

Content:
${post.contentSnippet}`;

  if (format === 'single') {
    return `Convert the following article into 3 different single tweet variants.

Tone: ${tone} — ${toneDesc}
Each tweet must be 280 characters or less.
Create 3 distinct variants with different angles or hooks.${linkInstruction}

${contentSection}

Respond ONLY with XML in this exact format:
<variants>
  <variant>
    <label>Variant 1: [brief description of angle]</label>
    <tweet>Your tweet text here (≤280 chars)</tweet>
  </variant>
  <variant>
    <label>Variant 2: [brief description of angle]</label>
    <tweet>Your tweet text here (≤280 chars)</tweet>
  </variant>
  <variant>
    <label>Variant 3: [brief description of angle]</label>
    <tweet>Your tweet text here (≤280 chars)</tweet>
  </variant>
</variants>`;
  } else {
    return `Convert the following article into 3 different tweet thread variants.

Tone: ${tone} — ${toneDesc}
Each thread should be 3-7 tweets long.
Each individual tweet must be 280 characters or less.
Create 3 distinct threads with different structures or angles.${linkInstruction}

${contentSection}

Respond ONLY with XML in this exact format:
<variants>
  <variant>
    <label>Thread 1: [brief description of angle]</label>
    <thread>
      <tweet>First tweet (hook) — ideally includes the link if requested</tweet>
      <tweet>Second tweet continues the story</tweet>
      <tweet>Third tweet adds more detail</tweet>
      <tweet>Final tweet with call to action</tweet>
    </thread>
  </variant>
  <variant>
    <label>Thread 2: [brief description of angle]</label>
    <thread>
      <tweet>First tweet</tweet>
      <tweet>Second tweet</tweet>
      <tweet>Third tweet</tweet>
    </thread>
  </variant>
  <variant>
    <label>Thread 3: [brief description of angle]</label>
    <thread>
      <tweet>First tweet</tweet>
      <tweet>Second tweet</tweet>
      <tweet>Third tweet</tweet>
    </thread>
  </variant>
</variants>`;
  }
}
