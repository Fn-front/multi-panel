-- stream_eventsのchannel_thumbnailをfavorite_channelsから更新
UPDATE stream_events se
SET channel_thumbnail = fc.channel_thumbnail
FROM favorite_channels fc
WHERE se.channel_id = fc.channel_id
  AND se.channel_thumbnail IS NULL
  AND fc.channel_thumbnail IS NOT NULL;
