---
name: analyze-notes
description: Analyze Substack notes performance — compare formats, identify engagement drivers.
triggers:
  - analyze notes
  - note performance
  - my notes
  - how are my notes doing
  - substack notes
  - short form
---

# Analyze Notes

## When to Use
The user wants to analyze their Substack Notes performance or understand how their short-form content is doing.

## Workflow
1. Attempt to analyze notes data if available in the feed
2. If notes data is available:
   - Rank by engagement
   - Compare formats (text-only vs image vs link shares)
   - Identify what drives comments vs likes
   - Note posting frequency
3. If notes data is NOT available:
   - Explain that Substack Notes data requires authentication and isn't available via RSS
   - Offer to analyze article patterns instead and suggest how those insights could apply to notes
   - Recommend general best practices for Substack Notes based on the author's writing style

## Output Format
Provide conversational analysis with specific recommendations.

Do NOT return generated content:
```json
{
  "variants": []
}
```

## Quality Rules
- Be upfront if notes data isn't accessible — don't pretend to have data you don't
- If falling back to article analysis, make the connection clear ("Based on your articles, your notes should...")
- Include actionable tips for improving notes performance
- Mention that notes and articles serve different purposes (discovery vs depth)
