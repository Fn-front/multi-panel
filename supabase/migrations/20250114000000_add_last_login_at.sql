-- ============================================
-- allowed_users テーブルに last_login_at カラムを追加
-- ============================================

-- last_login_at カラムを追加
ALTER TABLE allowed_users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- コメント追加
COMMENT ON COLUMN allowed_users.last_login_at IS '最終ログイン日時（24時間経過でセッション期限切れ）';
