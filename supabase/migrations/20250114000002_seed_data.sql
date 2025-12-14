-- ============================================
-- Seed Data for Development
-- ============================================

-- favorite_channels テーブルにダミーチャンネルを投入
-- 注意: 実際のユーザーIDに置き換える必要があります
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 最初のallowed_userのuser_idを取得
  SELECT user_id INTO v_user_id FROM allowed_users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- テストチャンネルを追加（既存の場合はスキップ）
    INSERT INTO favorite_channels (user_id, channel_id, channel_title, channel_thumbnail)
    VALUES
      (v_user_id, 'UC_test_channel_1', 'テストチャンネル1', 'https://i.ytimg.com/vi/dummy/maxresdefault.jpg'),
      (v_user_id, 'UC_test_channel_2', 'テストチャンネル2', 'https://i.ytimg.com/vi/dummy/maxresdefault.jpg'),
      (v_user_id, 'UC_test_channel_3', 'テストチャンネル3', 'https://i.ytimg.com/vi/dummy/maxresdefault.jpg'),
      (v_user_id, 'UC_test_channel_4', 'テストチャンネル4', 'https://i.ytimg.com/vi/dummy/maxresdefault.jpg')
    ON CONFLICT (user_id, channel_id) DO NOTHING;
  END IF;
END $$;

-- stream_events テーブルにダミーデータを投入
-- テストチャンネル1のダミー配信イベント
INSERT INTO stream_events (
  video_id,
  channel_id,
  title,
  thumbnail,
  channel_title,
  scheduled_start_time,
  actual_start_time,
  actual_end_time,
  live_broadcast_content,
  event_type,
  published_at
) VALUES
  -- 今日の配信（午前）
  (
    'dummy_video_1',
    'UC_test_channel_1',
    '【生配信】朝の雑談配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル1',
    (CURRENT_DATE + INTERVAL '10 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW() - INTERVAL '1 day'
  ),
  -- 今日の配信（午後・ライブ中）
  (
    'dummy_video_2',
    'UC_test_channel_2',
    '【ゲーム実況】新作ゲームをプレイ！',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル2',
    (CURRENT_DATE + INTERVAL '15 hours')::TIMESTAMPTZ,
    (CURRENT_DATE + INTERVAL '15 hours')::TIMESTAMPTZ,
    NULL,
    'live',
    'live',
    NOW() - INTERVAL '2 days'
  ),
  -- 今日の配信（夜）
  (
    'dummy_video_3',
    'UC_test_channel_3',
    '【歌枠】夜の歌配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル3',
    (CURRENT_DATE + INTERVAL '20 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW() - INTERVAL '3 days'
  ),
  -- 明日の配信
  (
    'dummy_video_4',
    'UC_test_channel_1',
    '【雑談】お昼の配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル1',
    (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW() - INTERVAL '1 day'
  ),
  -- 明後日の配信
  (
    'dummy_video_5',
    'UC_test_channel_4',
    '【お絵描き】イラスト配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル4',
    (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW() - INTERVAL '2 days'
  ),
  -- 過去の配信（終了済み）
  (
    'dummy_video_6',
    'UC_test_channel_2',
    '【アーカイブ】昨日の配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル2',
    (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '14 hours')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '14 hours')::TIMESTAMPTZ,
    (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '16 hours')::TIMESTAMPTZ,
    'none',
    'completed',
    NOW() - INTERVAL '3 days'
  ),
  -- 今週末の配信
  (
    'dummy_video_7',
    'UC_test_channel_3',
    '【特別企画】週末スペシャル配信',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル3',
    (CURRENT_DATE + INTERVAL '5 days' + INTERVAL '19 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW()
  ),
  -- 来週の配信
  (
    'dummy_video_8',
    'UC_test_channel_4',
    '【コラボ】特別ゲストと雑談',
    'https://i.ytimg.com/vi/dummy/maxresdefault.jpg',
    'テストチャンネル4',
    (CURRENT_DATE + INTERVAL '7 days' + INTERVAL '21 hours')::TIMESTAMPTZ,
    NULL,
    NULL,
    'upcoming',
    'upcoming',
    NOW()
  )
ON CONFLICT (video_id) DO NOTHING;
