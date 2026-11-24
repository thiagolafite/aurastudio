-- AuraStudio PostgreSQL Schema (Neon / Vercel Postgres)

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  tone_of_voice TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  brand_kit JSONB NOT NULL,
  accounts JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platforms JSONB NOT NULL,
  placement TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags JSONB NOT NULL,
  first_comment TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  layout_config JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  publish_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  agency_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_client_id ON scheduled_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled_at ON scheduled_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
