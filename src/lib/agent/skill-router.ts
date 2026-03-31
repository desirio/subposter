import Anthropic from '@anthropic-ai/sdk';
import { Skill } from '../types';
import { loadSkills } from './skill-loader';

const client = new Anthropic();

function keywordMatch(message: string, skills: Skill[]): Skill | null {
  const lower = message.toLowerCase();
  let bestSkill: Skill | null = null;
  let bestScore = 0;

  for (const skill of skills) {
    const score = skill.triggers.filter((t) => lower.includes(t.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return bestScore > 0 ? bestSkill : null;
}

export async function routeToSkill(message: string): Promise<Skill> {
  const skills = loadSkills();
  if (skills.length === 0) throw new Error('No skills loaded');

  // Stage 1: keyword match
  const keywordResult = keywordMatch(message, skills);
  if (keywordResult) return keywordResult;

  // Stage 2: Claude Haiku classification fallback
  const skillList = skills.map((s) => `- ${s.name}: ${s.description}`).join('\n');
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Classify this user message into exactly one skill. Reply with ONLY the skill name, nothing else.\n\nAvailable skills:\n${skillList}\n\nUser message: "${message}"`,
      },
    ],
  });

  const skillName = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
    .toLowerCase();

  const matched = skills.find((s) => s.name === skillName);
  return matched || skills.find((s) => s.name === 'repurpose-content') || skills[0];
}
