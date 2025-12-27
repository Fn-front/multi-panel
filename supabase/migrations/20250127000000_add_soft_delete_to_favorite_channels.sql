-- ============================================
-- お気に入りチャンネルの論理削除対応
-- ============================================

-- favorite_channels テーブルに deleted_at カラムを追加
ALTER TABLE favorite_channels
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- deleted_at にインデックスを追加（論理削除されていないレコードの高速検索用）
CREATE INDEX IF NOT EXISTS idx_favorite_channels_deleted_at
  ON favorite_channels(user_id, deleted_at)
  WHERE deleted_at IS NULL;

-- RLSポリシーを更新：削除済みレコードは非表示
DROP POLICY IF EXISTS "Allowed users can view own channels" ON favorite_channels;
CREATE POLICY "Allowed users can view own channels"
  ON favorite_channels FOR SELECT
  USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM allowed_users WHERE user_id = auth.uid()
    )
  );

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'favorite_channelsテーブルに論理削除機能を追加しました';
END $$;
