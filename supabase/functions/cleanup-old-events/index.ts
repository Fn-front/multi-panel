// 古い配信イベントと不要なデータを削除する関数
// 定期的にCronで実行（毎日1回、深夜3時）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// デフォルト: 365日（1年）より古いデータを削除
const DEFAULT_RETENTION_DAYS = 365;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // リクエストボディから保持日数を取得（オプション）
    const body = await req.json().catch(() => ({}));
    const { retentionDays = DEFAULT_RETENTION_DAYS } = body;

    // N日前の日時を計算
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Cleaning up data older than ${cutoffDate.toISOString()}`);

    let totalDeleted = 0;

    // 1. 365日以上前の過去配信イベント（event_type='completed'）を削除
    const { data: deletedEvents, error: eventsError } = await supabase
      .from('stream_events')
      .delete()
      .eq('event_type', 'completed')
      .lt('scheduled_start_time', cutoffDate.toISOString())
      .select('video_id');

    if (eventsError) throw eventsError;

    const deletedEventsCount = deletedEvents?.length || 0;
    totalDeleted += deletedEventsCount;
    console.log(`Deleted ${deletedEventsCount} old completed events`);

    // 2. お気に入りから削除されたチャンネルのイベントを削除
    // まず、favorite_channelsにある全チャンネルIDを取得
    const { data: favoriteChannels, error: favoritesError } = await supabase
      .from('favorite_channels')
      .select('channel_id');

    if (favoritesError) throw favoritesError;

    const favoriteChannelIds = new Set(
      favoriteChannels?.map((ch) => ch.channel_id) || []
    );

    // stream_eventsから全チャンネルIDを取得
    const { data: eventChannels, error: eventChannelsError } = await supabase
      .from('stream_events')
      .select('channel_id');

    if (eventChannelsError) throw eventChannelsError;

    // お気に入りに存在しないチャンネルIDを抽出
    const orphanedChannelIds = Array.from(
      new Set(
        eventChannels
          ?.map((e) => e.channel_id)
          .filter((id) => !favoriteChannelIds.has(id)) || []
      )
    );

    if (orphanedChannelIds.length > 0) {
      console.log(`Deleting events from ${orphanedChannelIds.length} orphaned channels`);

      for (const channelId of orphanedChannelIds) {
        const { data: deletedOrphaned, error: orphanedError } = await supabase
          .from('stream_events')
          .delete()
          .eq('channel_id', channelId)
          .select('video_id');

        if (orphanedError) {
          console.error(`Failed to delete events for channel ${channelId}:`, orphanedError);
        } else {
          const count = deletedOrphaned?.length || 0;
          totalDeleted += count;
          console.log(`Deleted ${count} events from orphaned channel ${channelId}`);
        }
      }
    }

    // 3. 365日以上前のfetched_date_rangesレコードを削除（テーブルが存在する場合）
    const { data: deletedRanges, error: rangesError } = await supabase
      .from('fetched_date_ranges')
      .delete()
      .lt('start_date', cutoffDate.toISOString().split('T')[0])
      .select('id');

    if (!rangesError) {
      const deletedRangesCount = deletedRanges?.length || 0;
      totalDeleted += deletedRangesCount;
      console.log(`Deleted ${deletedRangesCount} old fetched_date_ranges`);
    } else {
      console.log('fetched_date_ranges table does not exist or error:', rangesError);
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully cleaned up old data',
        totalDeleted,
        deletedEvents: deletedEventsCount,
        orphanedChannels: orphanedChannelIds.length,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
