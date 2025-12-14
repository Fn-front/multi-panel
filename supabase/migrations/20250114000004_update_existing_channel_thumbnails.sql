-- 既存のstream_eventsのchannel_thumbnailをfavorite_channelsから更新
UPDATE stream_events
SET channel_thumbnail = fc.channel_thumbnail
FROM favorite_channels fc
WHERE stream_events.channel_id = fc.channel_id
  AND stream_events.channel_thumbnail IS NULL;
