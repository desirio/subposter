---
name: audience-engagement
description: Analyze what content resonates most with the audience by examining article performance, engagement patterns, and comment themes.
triggers:
  - what works
  - engagement
  - audience
  - what resonates
  - top performing
  - best posts
  - popular
  - viral
  - grow
---

# Audience Engagement Analysis

## When to Use
The user wants to understand what content resonates with their audience and why.

## Workflow
1. Fetch archive posts with available metrics (likes, comments if available)
2. Rank by engagement signals (comments > likes > shares as quality indicators)
3. Identify patterns across top-performing content:
   - Topics that drive response
   - Formats that work (listicles, deep-dives, personal stories, how-tos)
   - Hooks and headlines that attracted attention
   - Length sweet spots
4. Look for content gaps — topics the audience might want but haven't been covered

## Output Format
Provide a conversational analysis covering:
- **Top 3 content themes**: What topics drive the most engagement
- **Best format**: Which article format performs best
- **Engagement drivers**: What specifically makes people comment/share
- **Content gaps**: Opportunities the author hasn't explored
- **Trend direction**: Is engagement growing, stable, or declining?

Do NOT return generated content for this skill:
```json
{
  "variants": []
}
```

## Quality Rules
- Use specific article titles and numbers, not vague generalizations
- Distinguish between "popular" (high views) and "engaging" (high comment/share ratio)
- Be honest if there isn't enough data for strong conclusions
- Make recommendations actionable: "Write more about X" not "Improve engagement"
