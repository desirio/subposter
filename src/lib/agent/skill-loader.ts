import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Skill } from '../types';

let skillCache: Skill[] | null = null;

export function loadSkills(): Skill[] {
  if (skillCache) return skillCache;

  const skillsDir = path.join(process.cwd(), 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: Skill[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    skills.push({
      name: data.name || entry.name,
      description: data.description || '',
      triggers: Array.isArray(data.triggers) ? data.triggers : [],
      body: content.trim(),
    });
  }

  skillCache = skills;
  return skills;
}

export function getSkillByName(name: string): Skill | undefined {
  return loadSkills().find((s) => s.name === name);
}

export function clearSkillCache(): void {
  skillCache = null;
}
