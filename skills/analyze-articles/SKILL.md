---
name: analyze-articles
description: Deep analysis of the author's articles including performance metrics, topic distribution, and posting patterns.
triggers:
  - analyze articles
  - article performance
  - my articles
  - how are my posts doing
  - publication stats
  - breakdown
  - summarize
  - key points
  - takeaways
---

# Analyze Articles

## When to Use
The user wants a detailed analysis of their articles — either a specific article's content or their overall publication patterns.

## Workflow

### For a specific article (when article context is provided):
1. Read the full article content
2. Extract: key arguments, supporting evidence, main insights
3. Identify the strongest quotable moments
4. Note the article structure and what makes it effective (or not)
5. Suggest which parts would translate best to social media

### For overall publication analysis (when no specific article):
1. Fetch last 10-20 articles from the archive
2. Analyze:
   - Posting frequency and consistency
   - Topic distribution (what subjects come up most?)
   - Title patterns (questions, how-tos, lists, bold claims)
   - Average content length
   - Evolution over time (has the focus shifted?)
3. Provide actionable insights

## Output Format
Provide a conversational analysis. If analyzing a specific article for repurposing potential, include the strongest excerpts.

Do NOT return generated social content unless specifically asked:
```json
{
  "variants": []
}
```

## Quality Rules
- Reference specific articles by title
- Use concrete numbers (posting frequency, word counts)
- Be constructive, not just analytical
- If the user asks about a specific article, focus on that — don't analyze the whole publication
