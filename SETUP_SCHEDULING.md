# Setting Up Scheduled Posting

Scheduled posts are published by `GET /api/cron/publish-scheduled`. Supabase pg_cron calls it every minute. Each run:

1. Marks posts stuck in `publishing` for over 10 minutes as `failed` (a previous run died mid-publish).
2. Claims up to 25 due posts by moving them from `scheduled` to `publishing`, so overlapping runs never post twice.
3. Publishes each one, refreshing expired platform tokens where the platform allows it, and records `posted` or `failed`.

## Steps

### 1. Run the migrations
In Supabase **SQL Editor**, run each file in `supabase/migrations/` that you haven't run yet, oldest first. New projects set up from `supabase-schema.sql` already include them.

### 2. Set the secret in the app
Generate a secret with `openssl rand -hex 32` and set it as `CRON_SECRET` in the app's environment (Vercel project settings, and `.env.local` for local testing). The endpoint refuses to run without it.

### 3. Schedule the job
Edit the two values in `supabase/cron.sql` (your deployed app URL and the same `CRON_SECRET`), then run it in the SQL Editor.

pg_cron runs inside Supabase, so it can't reach `localhost`. To test locally, call the endpoint yourself:
```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled
```
It returns a summary such as `{"processed":1,"published":1,"failed":0,"interrupted":0}`.

## Troubleshooting
- **Recent runs:** `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
- **What the app returned:** `SELECT status_code, content FROM net._http_response ORDER BY created DESC LIMIT 10;`
- **Changing the URL or secret:** update the Vault entries under **Project Settings → Vault**, or delete and recreate them.
- **Stop scheduling:** `SELECT cron.unschedule('publish-scheduled-posts');`
