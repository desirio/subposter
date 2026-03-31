# SubPoster Discovery Summary

## What Exists

### Services (`src/lib/`)
| File | Purpose | Key Exports |
|------|---------|-------------|
| `substack.ts` | RSS feed fetching + single-article Readability extraction | `fetchSubstackPosts(url)` → `SubstackPost[]` |
| `claude.ts` | Anthropic SDK — generates tweet variants via XML prompt/response | `generateTweetVariants(post, formats, tone, includeLink)` → `TweetVariant[]` |
| `twitter.ts` | Twitter API v2 — single tweet + thread posting | `postSingleTweet(text)`, `postThread(tweets)`, `isTwitterConfigured` |
| `threads.ts` | Threads Graph API — single post + thread posting | `postSingleThreadsPost(text)`, `postThreadsThread(tweets)`, `isThreadsConfigured` |
| `linkedin.ts` | LinkedIn REST API — single post only | `postToLinkedIn(text)`, `isLinkedInConfigured` |
| `types.ts` | Shared interfaces | `SubstackPost`, `TweetVariant`, `TweetFormat`, `TweetTone`, request/response types |

### Prompts (`src/prompts/`)
| File | Purpose |
|------|---------|
| `tweet-generation.ts` | System prompt + `buildUserPrompt()` for XML-tagged tweet generation |

### API Routes (`src/app/api/`)
| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/substack` | GET | Fetch posts from URL query param |
| `/api/generate` | POST | Generate tweet variants from a post |
| `/api/post-tweet` | GET, POST | Check X config status / Post to X |
| `/api/post-threads` | GET, POST | Check Threads config status / Post to Threads |
| `/api/post-linkedin` | GET, POST | Check LinkedIn config status / Post to LinkedIn |

### Components (`src/components/`)
| Component | Purpose |
|-----------|---------|
| `SubstackFeed` | URL input + post list. Uses `NEXT_PUBLIC_SUBSTACK_DEFAULT_URL` env var |
| `PostCard` | Clickable article card with title, author, date, snippet |
| `GeneratePanel` | Format/tone controls, generate button, platform tabs, variant rendering |
| `TweetPreview` | Single tweet card with editable textarea, char count bar, copy + post buttons |
| `ThreadPreview` | Connected thread cards, individually editable, expand/collapse, copy all + post |
| `StatusBanner` | Success/error notification with dismiss |

### Page (`src/app/page.tsx`)
Single-page split layout: left = SubstackFeed, right = GeneratePanel. State: `selectedPost`.

### Config
- **Next.js 14** (`next.config.mjs`) with `experimental.serverComponentsExternalPackages: ['twitter-api-v2']`
- **Model**: `claude-haiku-4-5-20251001` in `claude.ts`
- **Docker**: Multi-stage build, standalone output
- **Dependencies**: `@anthropic-ai/sdk`, `rss-parser`, `cheerio`, `@mozilla/readability`, `jsdom`, `twitter-api-v2`, `uuid`

## What Works
- Full feed loading from Substack, Medium, or any blog with RSS
- Single-article extraction via Readability fallback
- Tweet/thread generation via Claude with XML parsing
- Posting to X, Threads, LinkedIn with graceful degradation
- Platform config status checks via GET endpoints
- Inline editing, char count, copy-to-clipboard

## What to Reuse As-Is
- `substack.ts` — `fetchSubstackPosts()` is the data source for the agent
- `twitter.ts` / `threads.ts` / `linkedin.ts` — posting services
- `PostCard`, `StatusBanner` — no changes needed
- All existing API routes — remain functional for the legacy flow
- `types.ts` — existing types stay, new agent types added alongside

## What to Extend
- `types.ts` — add `Skill`, `AgentMessage`, `GeneratedContent`, `ContentVariant`, `XConnectionStatus`
- `TweetPreview` / `ThreadPreview` — add status badges (draft/approved/posted), make usable from agent chat
- `page.tsx` — add tab navigation for Agent Chat view alongside existing flow
- `GeneratePanel` — add "Generate with Agent" shortcut button
- `docker-compose.yml` — add volume mounts for skills/ and data/
- `.env.example` — add `NEXT_PUBLIC_SUBSTACK_DEFAULT_URL` (already in use but missing from .env.example)

## What to Add
- `skills/` directory with 8 skill markdown files
- `src/lib/agent/skill-loader.ts` — parse skill YAML frontmatter
- `src/lib/agent/skill-router.ts` — keyword + Claude fallback routing
- `src/lib/agent/conversation.ts` — multi-turn chat state manager
- `src/lib/agent/core.ts` — agent orchestrator (route → load skill → enrich → call Claude → parse)
- `src/app/api/agent/chat/route.ts` — POST endpoint for agent chat
- `src/components/AgentChat.tsx` — chat UI with inline content previews
- `src/components/ContentQueue.tsx` — approved content queue view
- `gray-matter` npm dependency for skill frontmatter parsing

## Integration Plan
1. **Types first** (Phase 4) — extend `types.ts` with agent types, install `gray-matter`
2. **Skills layer** (Phase 1) — create skill files, loader, router. Isolated, testable.
3. **Agent core** (Phase 2) — build conversation manager + orchestrator + API route. Imports existing `fetchSubstackPosts` and posting services.
4. **Frontend** (Phase 3) — add tabbed layout to `page.tsx`. Agent Chat tab as primary new view. Existing feed+generate flow preserved in its own tab. Extend TweetPreview/ThreadPreview for agent use with status tracking.
5. **Docker/env** (Phase 5) — volume mounts, env updates.
6. **Verify** (Phase 6) — build, lint, manual test flow.

No existing code is deleted or rewritten. The agent layer sits alongside the existing flow.