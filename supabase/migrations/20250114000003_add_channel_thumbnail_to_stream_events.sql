-- stream_eventsテーブルにchannel_thumbnailカラムを追加
ALTER TABLE stream_events
ADD COLUMN IF NOT EXISTS channel_thumbnail TEXT;

-- コメント追加
COMMENT ON COLUMN stream_events.channel_thumbnail IS 'チャンネルのサムネイルURL';
