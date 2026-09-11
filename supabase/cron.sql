-- Schedules the post publisher. Run once per Supabase project, in the SQL Editor.
-- pg_cron runs inside Supabase, so the app URL must be publicly reachable
-- (a deployed URL, not localhost). See SETUP_SCHEDULING.md.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Secrets (replace both values; CRON_SECRET must match the app's env var)
SELECT vault.create_secret('https://your-app.vercel.app', 'subposter_app_url');
SELECT vault.create_secret('<your CRON_SECRET>', 'subposter_cron_secret');

-- 3. Call the publisher every minute (re-running this updates the existing job)
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'subposter_app_url')
      || '/api/cron/publish-scheduled',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'subposter_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
