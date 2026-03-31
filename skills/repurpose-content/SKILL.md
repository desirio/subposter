---
name: repurpose-content
description: Transform a Substack article into platform-native short-form content for X, Threads, and LinkedIn.
triggers:
  - repurpose
  - turn into tweets
  - create tweets
  - make a thread
  - tweet this
  - promote this post
  - short version
  - post to X
  - convert
  - thread
  - social media
  - create posts
---

# Repurpose Content

## When to Use
The user wants to create tweets, threads, or short posts from their long-form article content.

## Workflow
1. Ensure full article content is available (it should be in the context)
2. Analyze article structure: key arguments, surprising insights, quotable moments, actionable takeaways
3. Generate content in requested format(s)

## Output Formats

### Single Tweet (280 char max)
Generate 3 variants:
- **Contrarian take** — challenges conventional wisdom from the article
- **Actionable insight** — one concrete thing the reader can do today
- **Question/discussion starter** — provokes replies and engagement

### Thread (3-7 tweets, each 280 chars max)
Generate 2 variants:
- **Key arguments breakdown** — each tweet covers one main point
- **Story arc** — hook, tension, insight, takeaway

### Quote Hook (tweet + link)
Generate 2 variants:
- **Teaser of best insight** — make them click through
- **FOMO angle** — what they're missing if they don't read

## Quality Rules
- NEVER start with "Thread:" or use thread emoji openers
- NEVER use "In today's digital landscape", "Let's dive in", "Here's the thing"
- Sound human, not AI-generated
- Each tweet must stand alone and make sense independently
- Use specific numbers and concrete details over vague claims
- Match the author's natural voice and vocabulary
- Include the article link in single tweets and the first tweet of threads when appropriate

## Response Format
Return generated content as JSON in a ```json code block:
```json
{
  "variants": [
    {
      "format": "single",
      "label": "Contrarian take",
      "tweets": ["The tweet text here"]
    },
    {
      "format": "thread",
      "label": "Key arguments breakdown",
      "tweets": ["Tweet 1 (hook)", "Tweet 2", "Tweet 3", "Tweet 4 (CTA)"]
    }
  ]
}
```
