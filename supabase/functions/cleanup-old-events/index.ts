// 古い配信イベントを削除する関数
// 定期的にCronで実行（例: 毎日1回）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// デフォルト: 30日より古いイベントを削除
const DEFAULT_RETENTION_DAYS = 30;

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // リクエストボディから保持日数を取得（オプション）
    const body = await req.json().catch(() => ({}));
    const { retentionDays = DEFAULT_RETENTION_DAYS } = body;

    // N日前の日時を計算
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Deleting events older than ${cutoffDate.toISOString()}`);

    // scheduled_start_timeがN日より古いイベントを削除
    const { data, error } = await supabase
      .from('stream_events')
      .delete()
      .lt('scheduled_start_time', cutoffDate.toISOString())
      .select('video_id');

    if (error) throw error;

    const deletedCount = data?.length || 0;
    console.log(`Deleted ${deletedCount} old events`);

    return new Response(
      JSON.stringify({
        message: 'Successfully cleaned up old events',
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
