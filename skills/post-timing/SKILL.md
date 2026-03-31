---
name: post-timing
description: Determine optimal times to post on X for maximum engagement based on content type and platform patterns.
triggers:
  - when to post
  - best time
  - schedule
  - timing
  - when should I
  - optimal time
  - frequency
  - cadence
---

# Post Timing

## When to Use
The user wants to know when to post their content for maximum engagement.

## Workflow
1. Consider the content type (single tweet, thread, quote hook)
2. Cross-reference with general X engagement research:
   - Weekdays 8-10am EST tend to perform well for professional/B2B content
   - 12-1pm EST is strong for lunch-break scrolling
   - Tuesday-Thursday typically outperform Monday and Friday
   - Threads perform better in the morning when people have time to read
   - Single tweets can work anytime but peak during commute hours
3. Factor in the author's audience (if known from article analysis)
4. Consider posting cadence — not just when, but how often

## Output Format
Provide conversational advice with 3 recommended posting windows. Include:
- Day of week and time range (in EST, note to adjust for audience timezone)
- Why this window works for their content type
- Confidence level (high/medium/low based on how much data we have)

Do NOT return generated tweet content for this skill. Return empty variants:
```json
{
  "variants": []
}
```

## Quality Rules
- Be specific with times, not vague ("Tuesday 8-9am EST" not "morning")
- Acknowledge that timing is one factor among many
- If we don't have engagement data, say so and base advice on general patterns
- Recommend a posting cadence (e.g., "2-3 tweets per week minimum")
- Mention that consistency matters more than perfect timing
