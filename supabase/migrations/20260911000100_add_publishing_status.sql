-- The cron job claims a post by moving it to 'publishing' before posting it, so
-- overlapping runs can't publish the same post twice.
ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_status_check;
ALTER TABLE scheduled_posts ADD CONSTRAINT scheduled_posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'publishing', 'posted', 'failed'));
