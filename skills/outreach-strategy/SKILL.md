---
name: outreach-strategy
description: Create a complete multi-post promotion campaign for a specific article with timing and sequencing.
triggers:
  - promote
  - outreach plan
  - promotion strategy
  - campaign
  - marketing plan
  - launch plan
  - promotion
  - outreach
---

# Outreach Strategy

## When to Use
The user wants a structured promotion campaign for a specific article, not just a single tweet.

## Workflow
1. Take the specific article as input (from context)
2. Analyze the article for multiple angles and hooks
3. Generate a 4-5 post campaign spread over 1 week:
   - **Launch tweet** (Hour 0): Strong hook, link to article
   - **Thread deep-dive** (Hour 3): Break down key arguments in detail
   - **Engagement question** (Day 2): Ask a question related to the article's theme to drive discussion
   - **Quote callback** (Day 3): Share a specific insight or quote from the article
   - **Reference post** (Week 1): Tie the article to a current event or trending topic
4. Include timing recommendation for each post

## Output Format
Return the campaign as generated content:
```json
{
  "variants": [
    {
      "format": "single",
      "label": "Launch tweet (Post immediately)",
      "tweets": ["Your launch tweet text here"]
    },
    {
      "format": "thread",
      "label": "Deep-dive thread (Post 3 hours later)",
      "tweets": ["Hook tweet", "Point 1", "Point 2", "Point 3", "CTA"]
    },
    {
      "format": "single",
      "label": "Engagement question (Post Day 2, morning)",
      "tweets": ["A thought-provoking question related to the article"]
    },
    {
      "format": "single",
      "label": "Quote callback (Post Day 3)",
      "tweets": ["A powerful quote or insight from the article"]
    },
    {
      "format": "single",
      "label": "Reference post (Post Week 1)",
      "tweets": ["Tie the article to something current or trending"]
    }
  ]
}
```

Also provide a conversational overview explaining the strategy behind each post and why the timing matters.

## Quality Rules
- Each post in the campaign must stand alone — someone seeing only post #3 should still get value
- The campaign should tell a story: build interest, deepen understanding, drive discussion, stay relevant
- Include the article link in the launch tweet and thread
- Don't make every post a hard sell — mix value with promotion
- Each tweet must be 280 characters or fewer
- Timing should account for audience availability patterns
