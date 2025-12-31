-- ============================================
-- allowed_users テーブルにUPDATEポリシーを追加
-- ユーザーが自分のlast_login_atを更新できるようにする
-- ============================================

-- 既存のUPDATEポリシーがあれば削除
DROP POLICY IF EXISTS "Users can update own last_login_at" ON allowed_users;

-- 新しいUPDATEポリシーを作成
CREATE POLICY "Users can update own last_login_at"
  ON allowed_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- コメント
COMMENT ON POLICY "Users can update own last_login_at" ON allowed_users IS
'ユーザーが自分のlast_login_atを更新できるようにする（セッション管理用）';
