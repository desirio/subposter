---
name: content-ideas
description: Generate content ideas based on what's performed well, audience interests, and content gaps.
triggers:
  - what should I write
  - content ideas
  - topic ideas
  - what to post
  - next article
  - content gaps
  - brainstorm
  - ideas
  - content plan
  - series
---

# Content Ideas

## When to Use
The user wants ideas for what to write or post next.

## Workflow
1. Fetch recent articles and analyze topics covered
2. Identify:
   - High-engagement topics that could be explored further
   - Questions from readers (if visible in article content/comments)
   - Topics the author has expertise in but hasn't covered
   - Trending themes in their niche that they could add perspective on
   - Existing articles that could be turned into a series
3. Generate 5-7 specific, actionable ideas

## Output Format
Provide each idea conversationally with:
- **Working title**: A specific, compelling headline
- **Angle/hook**: What makes this idea interesting
- **Why it would perform well**: Connection to audience interests or proven patterns
- **Suggested format**: Article, thread, note, or combination

Do NOT return generated social content:
```json
{
  "variants": []
}
```

## Quality Rules
- Ideas must be SPECIFIC, not generic ("Why morning routines fail for night owls" not "Write about productivity")
- Each idea should connect to something the author has already demonstrated expertise in
- Include a mix of formats (long-form articles, threads, quick takes)
- At least one idea should be a follow-up or expansion of their best-performing content
- Suggest one contrarian or surprising angle
