---
name: brand-voice
description: Analyze the author's writing style, tone, and voice from their Substack articles to ensure generated content matches their natural voice.
triggers:
  - writing style
  - my voice
  - my tone
  - brand voice
  - sound like me
  - match my style
  - voice profile
  - personality
---

# Brand Voice Analysis

## When to Use
The user wants to understand or define their writing voice, or wants to ensure generated content matches their natural style.

## Workflow
1. Fetch 5 most recent articles from the publication
2. Analyze across these dimensions:
   - Sentence length distribution (short/punchy vs long/flowing)
   - Vocabulary complexity (simple/accessible vs technical/academic)
   - Use of humor, sarcasm, or irony
   - Anecdotes vs data — which does the author lean on?
   - Formal vs conversational register
   - Recurring phrases, sentence starters, or stylistic tics
   - How they open articles (story, question, bold claim, statistic?)
   - How they close articles (CTA, reflection, challenge, summary?)
3. Create a voice profile summary

## Output Format
Return a voice profile as JSON in a ```json code block:
```json
{
  "variants": []
}
```

Also provide a conversational summary with these sections:
- **Voice summary**: 2-3 sentences capturing the overall feel
- **Sentence style**: Short/medium/long, simple/complex
- **Tone markers**: List of 4-6 adjectives (e.g., "conversational, data-driven, optimistic, direct")
- **Signature patterns**: Specific phrases or structures the author uses repeatedly
- **Recommended social media voice**: How this voice translates to short-form content

## Quality Rules
- Base analysis on actual content, not assumptions
- Quote specific examples from the articles
- Be honest — if the voice is inconsistent, say so
- Focus on patterns that are actionable for content generation
