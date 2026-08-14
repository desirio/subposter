-- SubPoster Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Social connections (encrypted OAuth tokens per user per platform)
CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'threads', 'linkedin')),

  -- Encrypted token storage (AES-256-GCM at app layer)
  access_token_encrypted TEXT NOT NULL,
  access_token_iv TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  refresh_token_iv TEXT,

  -- Platform-specific identifiers
  platform_user_id TEXT,
  platform_username TEXT,

  -- Token metadata
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON social_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections"
  ON social_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections"
  ON social_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections"
  ON social_connections FOR DELETE USING (auth.uid() = user_id);


-- 2. Scheduled posts
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN ('x', 'threads', 'linkedin')),
  format TEXT NOT NULL CHECK (format IN ('single', 'thread')),
  content JSONB NOT NULL,  -- { tweets: string[] }

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  error_message TEXT,

  source_article_title TEXT,
  source_article_link TEXT,
  skill_used TEXT,

  platform_post_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts"
  ON scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"
  ON scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON scheduled_posts FOR DELETE USING (auth.uid() = user_id);


-- 3. Agent sessions (replaces in-memory Map)
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON agent_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
  ON agent_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions"
  ON agent_sessions FOR UPDATE USING (auth.uid() = user_id);


-- 4. User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  default_substack_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- 5. Indexes
CREATE INDEX idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status, scheduled_at);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
