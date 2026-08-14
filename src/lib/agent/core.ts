import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import {
  SubstackPost,
  AgentMessage,
  GeneratedContent,
  ContentVariant,
  AgentChatRequest,
} from '../types';
import { routeToSkill } from './skill-router';
import { addMessage, toClaudeMessages, getOrCreateSession } from './conversation';
import { fetchSubstackPosts } from '../substack';

const client = new Anthropic();

function buildSystemPrompt(
  skillBody: string,
  context?: { selectedPost?: SubstackPost }
): string {
  let prompt = `You are SubPoster's AI assistant. You help users create engaging social media content from their articles and newsletters.

You are conversational, concise, and strategic. You're a content strategist, not a lecturer.

## Active Skill Instructions
${skillBody}

## Response Format
- Always respond conversationally first — explain what you're doing and why
- When generating social media content, include a JSON code block with language tag "json"
- The JSON must follow this schema: { "variants": [{ "format": "single"|"thread", "label": "string", "tweets": ["string"] }] }
- Every single tweet MUST be 280 characters or fewer — this is a hard limit
- Generate 3 variants unless the user specifies otherwise
- If no content generation is needed for this skill, return { "variants": [] }`;

  if (context?.selectedPost) {
    prompt += `

## Current Article Context
Title: ${context.selectedPost.title}
Link: ${context.selectedPost.link}
Author: ${context.selectedPost.author || 'Unknown'}
Published: ${context.selectedPost.pubDate || 'Unknown'}

Full Content:
${context.selectedPost.content}`;
  }

  return prompt;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGeneratedContent(text: string, skillName: string, article?: { title: string; link: string }): GeneratedContent[] {
  const jsonBlocks = text.match(/```json\s*([\s\S]*?)```/g);
  if (!jsonBlocks) return [];

  const results: GeneratedContent[] = [];
  for (const block of jsonBlocks) {
    const jsonStr = block.replace(/```json\s*/, '').replace(/```$/, '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.variants && Array.isArray(parsed.variants) && parsed.variants.length > 0) {
        // Filter out empty variant arrays (analysis skills return { variants: [] })
        const variants: ContentVariant[] = parsed.variants.map(
          (v: { format?: string; label?: string; tweets?: string[] }) => ({
            id: uuid(),
            format: v.format === 'thread' ? 'thread' : 'single',
            label: v.label || 'Variant',
            tweets: v.tweets || [],
            status: 'draft' as const,
          })
        );
        if (variants.length > 0) {
          results.push({
            id: uuid(),
            variants,
            sourceArticle: article,
            skill: skillName,
          });
        }
      }
    } catch {
      // Skip malformed JSON blocks
    }
  }
  return results;
}

function extractConversationalText(text: string): string {
  return text.replace(/```json\s*[\s\S]*?```/g, '').trim();
}

export async function handleAgentMessage(
  request: AgentChatRequest,
  userId: string
): Promise<{ message: AgentMessage; sessionId: string }> {
  const sessionId = request.sessionId || uuid();
  await getOrCreateSession(sessionId, userId);

  // Add user message
  const userMsg: AgentMessage = {
    id: uuid(),
    role: 'user',
    text: request.message,
    timestamp: Date.now(),
  };
  await addMessage(sessionId, userId, userMsg);

  // Route to skill
  const skill = await routeToSkill(request.message);

  // If user provided a substack URL but no selected post, try fetching
  let selectedPost = request.context?.selectedPost;
  if (!selectedPost && request.context?.substackUrl) {
    try {
      const posts = await fetchSubstackPosts(request.context.substackUrl);
      if (posts.length > 0) selectedPost = posts[0];
    } catch {
      // ignore fetch failures — agent will respond without article context
    }
  }

  // Build system prompt with skill content
  const systemPrompt = buildSystemPrompt(skill.body, { selectedPost });

  // Build conversation history for Claude
  const conversationMessages = await toClaudeMessages(sessionId, userId);
  // Remove the last message (we just added it) — it'll be the current user turn
  const history = conversationMessages.slice(0, -1);
  const messages = [...history, { role: 'user' as const, content: request.message }];

  // Call Claude Sonnet
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  const responseText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  // Parse response
  const conversationalText = extractConversationalText(responseText);
  const generatedContent = parseGeneratedContent(
    responseText,
    skill.name,
    selectedPost ? { title: selectedPost.title, link: selectedPost.link } : undefined
  );

  const assistantMsg: AgentMessage = {
    id: uuid(),
    role: 'assistant',
    text: conversationalText,
    generatedContent: generatedContent.length > 0 ? generatedContent : undefined,
    timestamp: Date.now(),
  };
  await addMessage(sessionId, userId, assistantMsg);

  return { message: assistantMsg, sessionId };
}
