# SubPoster — Testing Guide

## Prerequisites

### Environment Variables

All environments need these set. See `.env.example` for the full list.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `CRON_SECRET` | Any strong random string (`openssl rand -hex 16`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (local) or your production URL |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | developer.x.com |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | linkedin.com/developers |
| `THREADS_APP_ID` / `THREADS_APP_SECRET` | developers.facebook.com |

### Database Migration

Before first use, run the usage tracking migration against your Supabase instance:

```sql
-- Copy contents of supabase/migrations/20261025_add_usage_tracking.sql
-- and run in Supabase SQL Editor (Dashboard > SQL Editor)
```

This adds `articles_used`, `chat_messages_used`, `usage_reset_at` columns and the RPC functions for atomic increments and monthly resets.

### OAuth Redirect URIs

Register these callback URLs in each platform's developer console:

| Platform | Callback URL (localhost) | Callback URL (production) |
|---|---|---|
| X (Twitter) | `http://localhost:3000/api/auth/x/callback` | `https://YOUR_DOMAIN/api/auth/x/callback` |
| LinkedIn | `http://localhost:3000/api/auth/linkedin/callback` | `https://YOUR_DOMAIN/api/auth/linkedin/callback` |
| Threads | `http://localhost:3000/api/auth/threads/callback` | `https://YOUR_DOMAIN/api/auth/threads/callback` |

---

## Part 1: Localhost Testing

### Setup

```bash
cp .env.example .env.local
# Fill in all values in .env.local
# Set NEXT_PUBLIC_APP_URL=http://localhost:3000

npm install
npm run dev
```

### 1. Unit Tests

```bash
npm test
```

All 54 tests should pass. These cover crypto, tweet generation, Substack parsing, and agent routing.

### 2. Health Check

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"healthy","timestamp":"...","checks":{"database":{"status":"healthy","latency_ms":...}}}`

If database is unhealthy, check your Supabase env vars.

### 3. Registration Flow

1. Open `http://localhost:3000/register`
2. Create an account with email + password (or Google OAuth)
3. Check your email for the confirmation link
4. Click the link — you should land on `/login?registered=true`
5. Sign in with your credentials

**Verify:**
- Green "Account created" banner appears on login page
- After sign-in, you are redirected to `/onboarding/profile` (step 1)

### 4. Onboarding Flow

**Step 1 — Profile (`/onboarding/profile`)**
1. Enter a display name
2. Enter your Substack URL (e.g., `https://yourname.substack.com`)
3. Click Continue

**Verify:**
- Progress bar shows step 1 of 4 active
- Redirects to `/onboarding/plan`

**Step 2 — Plan (`/onboarding/plan`)**
1. Toggle between monthly and annual pricing
2. Prices should be: Starter $12.50/$10.25, Plus $28/$22.40, Pro $80/$62
3. Select a plan (Plus is recommended)
4. Click Continue

**Verify:**
- Orange toggle, orange "Recommended" badge on Plus card
- Redirects to `/onboarding/connect`

**Step 3 — Connect (`/onboarding/connect`)**
1. Connect at least one platform (X, Threads, or LinkedIn)
2. Each "Connect" button redirects to the platform's OAuth flow
3. After authorizing, you return to `/settings?connected=<platform>`

**Verify:**
- Connected platforms show a green dot and your username
- Back on the connect page, the button changes to "Connected"

**Step 4 — Complete**
1. Click "Finish setup" (or the final CTA)
2. You should be redirected to the dashboard (`/`)

**Verify:**
- Dashboard loads with the Agent Chat tab active
- Header shows connected platform dots (green for connected)
- The SubPoster logo is orange with the display font

### 5. Core Functionality

**Substack Feed:**
1. Switch to "Feed + Generate" tab
2. Your Substack posts should load automatically
3. If they don't, check `NEXT_PUBLIC_SUBSTACK_DEFAULT_URL` or enter a URL

**Generate Posts:**
1. Select an article from the feed
2. Click "Generate" in the right panel
3. Check the platform checkboxes (X, Threads, LinkedIn)
4. Variants should appear with single tweets and threads

**Verify:**
- Each tweet is 280 characters or fewer
- 3 variants per format by default
- You can edit tweets inline

**Agent Chat:**
1. Switch to "Agent Chat" tab
2. Select an article for context (optional)
3. Type a message like "Create a viral tweet from this article"
4. The agent should respond with content variants

**Verify:**
- Chat messages appear in real-time
- Generated content shows formatted tweet cards
- You can schedule or post directly from the cards

**Post/Schedule:**
1. From a generated variant, click "Post now" or "Schedule"
2. For "Post now" — the post should publish to the connected platform
3. For "Schedule" — pick a date/time, it should appear in Settings > Post History

**Verify:**
- Check the actual platform (X, Threads, LinkedIn) to confirm the post appeared
- Scheduled posts show in Settings with correct status

### 6. Settings Page

1. Go to `/settings`
2. Verify all connected platforms show with username and token expiry
3. Disconnect a platform, then reconnect it
4. Check Post History section shows scheduled and published posts

### 7. Cron Jobs (manual trigger)

**Publish scheduled posts:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled
```

**Reset monthly usage:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reset-usage
```

**Verify:**
- Without the secret: returns 401 Unauthorized
- With the secret: returns 200 with results

### 8. Usage Limits

1. Check your plan's limits (e.g., Starter = 15 articles, 50 chat messages)
2. Generate posts — each generation counts as 1 article credit
3. Send chat messages — each counts as 1 chat message credit
4. When limits are reached, you should see a 429 response with `"error": "limit_reached"`

To test quickly, temporarily set low limits in `src/lib/usage.ts` (e.g., 1 article, 2 chat messages), generate once, and verify the block.

### 9. Error Handling

- Visit a non-existent page (e.g., `/nonexistent`) — should show the 404 page
- Trigger a server error — the error boundary should show "Something went wrong" with a retry button
- Sign out and try to access `/` — should redirect to `/login`
- Try accessing `/onboarding/profile` after completing onboarding — should redirect to `/`

---

## Part 2: Production Testing (Vercel)

### Pre-deployment Checklist

- [ ] All env variables set in Vercel dashboard (Settings > Environment Variables)
- [ ] `NEXT_PUBLIC_APP_URL` set to your production domain (e.g., `https://subposter.app`)
- [ ] OAuth callback URLs updated in X, LinkedIn, and Threads developer consoles to use the production domain
- [ ] Supabase migration has been run (usage tracking columns + RPC functions)
- [ ] Supabase RLS policies allow the app to read/write `user_profiles` and `social_tokens`
- [ ] cron-job.org configured with the two cron endpoints:
  - `GET https://YOUR_DOMAIN/api/cron/publish-scheduled?secret=YOUR_CRON_SECRET` (every 1-5 min)
  - `GET https://YOUR_DOMAIN/api/cron/reset-usage?secret=YOUR_CRON_SECRET` (once daily)

### 1. Smoke Test (immediately after deploy)

```bash
# Health check
curl https://YOUR_DOMAIN/api/health

# Should return {"status":"healthy",...}
```

```bash
# Cron auth check (should return 401)
curl https://YOUR_DOMAIN/api/cron/publish-scheduled

# Cron with secret (should return 200)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_DOMAIN/api/cron/publish-scheduled
```

```bash
# Public routes load
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/login        # 200
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/register     # 200

# Protected routes redirect to login
curl -s -o /dev/null -w "%{http_code}" -L https://YOUR_DOMAIN/          # 200 (after redirect)
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/settings     # 307 (redirect)
```

### 2. Full User Journey

Run through the same flow as localhost testing (sections 3-8 above), but on the production URL. Pay special attention to:

- **OAuth flows**: These are the most likely to break in production because redirect URIs must match exactly. If you get an error after authorizing, check that the callback URL in the platform's developer console matches `https://YOUR_DOMAIN/api/auth/<platform>/callback` exactly.
- **Token refresh**: After connecting a platform, wait for the token to be close to expiry (or manually set an expired timestamp in Supabase) and try posting. The token refresh should kick in automatically.
- **HTTPS**: All cookies are set with `sameSite: 'lax'` — this works fine over HTTPS. Verify no mixed-content warnings in the browser console.

### 3. Cross-browser

Test the onboarding flow and dashboard in:
- Chrome (desktop)
- Safari (desktop + mobile)
- Firefox (desktop)
- Chrome (Android)

The app is responsive but there's no dedicated mobile layout — verify nothing overflows or breaks on small screens.

### 4. Cron Verification

After enabling cron-job.org:
1. Schedule a post for 2 minutes in the future
2. Wait for the cron to fire
3. Check the platform — the post should be published
4. Check `POST /api/scheduled-posts` — status should be `published`

### 5. Edge Cases to Verify

| Scenario | Expected |
|---|---|
| Disconnect all platforms, try to post | Error message, no crash |
| Enter invalid Substack URL | Graceful error in feed |
| Submit empty chat message | Input validation prevents send |
| Refresh during onboarding | Returns to correct step |
| Open app in two tabs, complete onboarding in one | Other tab redirects on next navigation |
| Expired OAuth token + post attempt | Auto-refresh, post succeeds |
| Hit article limit, try to generate | 429 with upgrade prompt |
| Hit chat limit (non-Pro), send message | 429 with upgrade prompt |

---

## Monitoring

After launch, keep an eye on:

1. **Vercel Logs** (vercel.com > Project > Logs) — watch for 500 errors
2. **Supabase Dashboard** (Database > Table Editor > `user_profiles`) — check users are being created with correct plans and usage counts
3. **cron-job.org dashboard** — check cron executions are succeeding (200 responses)
4. **Anthropic Console** (console.anthropic.com > Usage) — monitor API spend vs. plan revenue
