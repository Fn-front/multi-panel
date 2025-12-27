-- お気に入りチャンネルにcolor カラムを追加
ALTER TABLE favorite_channels
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- 既存のレコードにデフォルト色を設定
UPDATE favorite_channels
SET color = '#3b82f6'
WHERE color IS NULL;
