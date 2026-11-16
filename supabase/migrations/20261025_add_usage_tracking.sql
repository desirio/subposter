-- Add usage tracking columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS articles_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chat_messages_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_at timestamptz NOT NULL DEFAULT now();

-- Rename 'basic' plan to 'starter' for existing users
UPDATE user_profiles SET selected_plan = 'starter' WHERE selected_plan = 'basic';

-- Atomic increment functions to avoid race conditions
CREATE OR REPLACE FUNCTION increment_articles_used(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET articles_used = articles_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_chat_messages_used(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET chat_messages_used = chat_messages_used + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset usage counters (called by cron)
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE user_profiles
  SET
    articles_used = 0,
    chat_messages_used = 0,
    usage_reset_at = now()
  WHERE usage_reset_at < now() - interval '30 days';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;
