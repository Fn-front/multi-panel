-- ============================================
-- Multi Panel Database Schema
-- ============================================

-- 1. allowed_users テーブル（ホワイトリスト）
-- ============================================
CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_users_user_id ON allowed_users(user_id);

-- RLS有効化
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Anyone can view allowed users"
  ON allowed_users FOR SELECT
  USING (true);

-- ============================================
-- 2. favorite_channels テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_thumbnail TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorite_channels_user_channel
  ON favorite_channels(user_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_favorite_channels_user_id
  ON favorite_channels(user_id);

-- RLS有効化
ALTER TABLE favorite_channels ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Allowed users can view own channels"
  ON favorite_channels FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can insert own channels"
  ON favorite_channels FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can update own channels"
  ON favorite_channels FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can delete own channels"
  ON favorite_channels FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 3. stream_events テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS stream_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  channel_title TEXT NOT NULL,
  scheduled_start_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  live_broadcast_content TEXT NOT NULL,
  event_type TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_stream_events_video_id
  ON stream_events(video_id);
CREATE INDEX IF NOT EXISTS idx_stream_events_channel_schedule
  ON stream_events(channel_id, scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_stream_events_event_type_schedule
  ON stream_events(event_type, scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_stream_events_fetched_at
  ON stream_events(fetched_at);

-- RLS有効化
ALTER TABLE stream_events ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Anyone can view stream events"
  ON stream_events FOR SELECT
  USING (true);

-- ============================================
-- 4. panel_layouts テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS panel_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_name TEXT NOT NULL,
  grid_cols INTEGER NOT NULL DEFAULT 12,
  grid_row_height INTEGER NOT NULL DEFAULT 100,
  panels JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_panel_layouts_user_layout_name
  ON panel_layouts(user_id, layout_name);
CREATE INDEX IF NOT EXISTS idx_panel_layouts_user_active
  ON panel_layouts(user_id, is_active);

-- RLS有効化
ALTER TABLE panel_layouts ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Allowed users can view own layouts"
  ON panel_layouts FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can insert own layouts"
  ON panel_layouts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can update own layouts"
  ON panel_layouts FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can delete own layouts"
  ON panel_layouts FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. viewing_history テーブル（オプション）
-- ============================================
CREATE TABLE IF NOT EXISTS viewing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  watch_duration INTEGER
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_viewing_history_user_watched
  ON viewing_history(user_id, watched_at);
CREATE INDEX IF NOT EXISTS idx_viewing_history_user_video
  ON viewing_history(user_id, video_id);

-- RLS有効化
ALTER TABLE viewing_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Allowed users can view own history"
  ON viewing_history FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can insert own history"
  ON viewing_history FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allowed users can delete own history"
  ON viewing_history FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. api_quota_log テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS api_quota_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  quota_used INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_quota_log_date
  ON api_quota_log(date);

-- RLS有効化
ALTER TABLE api_quota_log ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Anyone can view quota log"
  ON api_quota_log FOR SELECT
  USING (true);

-- ============================================
-- 7. fetched_date_ranges テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS fetched_date_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_fetched_date_ranges_unique
  ON fetched_date_ranges(channel_id, event_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fetched_date_ranges_channel_type
  ON fetched_date_ranges(channel_id, event_type);

-- RLS有効化
ALTER TABLE fetched_date_ranges ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Anyone can view fetched ranges"
  ON fetched_date_ranges FOR SELECT
  USING (true);

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'データベーススキーマの作成が完了しました！';
  RAISE NOTICE '次のステップ: allowed_usersテーブルにあなたのユーザーIDを追加してください';
END $$;
