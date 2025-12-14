// 過去のライブ配信アーカイブを取得する関数
// オンデマンドで実行（ユーザーリクエストまたは手動実行）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  scheduledStartTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  liveBroadcastContent: string;
  publishedAt: string;
}

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
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // リクエストボディからチャンネルIDと期間を取得（オプション）
    const body = await req.json().catch(() => ({}));
    const { channelId, channelIds, startDate, endDate, daysAgo = 7 } = body;

    let channelsToFetch = [];
    let fetchStartDate: string | null = null;
    let fetchEndDate: string | null = null;

    if (channelId) {
      // 特定のチャンネルのみ取得
      channelsToFetch = [{ channel_id: channelId, channel_title: '' }];
    } else if (channelIds && Array.isArray(channelIds)) {
      // 複数チャンネル指定
      channelsToFetch = channelIds.map((id: string) => ({ channel_id: id, channel_title: '' }));
    } else {
      // favorite_channelsから全チャンネルIDを取得
      const { data: channels, error: channelsError } = await supabase
        .from('favorite_channels')
        .select('channel_id, channel_title');

      if (channelsError) throw channelsError;

      if (!channels || channels.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No favorite channels found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // チャンネルIDの重複を排除
      channelsToFetch = Array.from(
        new Map(channels.map((ch) => [ch.channel_id, ch.channel_title])).entries()
      ).map(([channel_id, channel_title]) => ({ channel_id, channel_title }));
    }

    // 日付指定がある場合
    if (startDate && endDate) {
      fetchStartDate = startDate;
      fetchEndDate = endDate;
    }

    console.log(`Fetching past streams for ${channelsToFetch.length} channels (${daysAgo} days)`);

    const allVideos: YouTubeVideo[] = [];

    // 各チャンネルの過去配信を取得
    for (const channel of channelsToFetch) {
      try {
        // fetched_date_rangesから取得済み期間をチェック
        if (fetchStartDate && fetchEndDate) {
          const { data: existingRanges } = await supabase
            .from('fetched_date_ranges')
            .select('*')
            .eq('channel_id', channel.channel_id)
            .gte('end_date', fetchStartDate)
            .lte('start_date', fetchEndDate);

          // すでに取得済みの場合はスキップ
          if (existingRanges && existingRanges.length > 0) {
            console.log(`Skipping ${channel.channel_id}: already fetched for ${fetchStartDate} - ${fetchEndDate}`);
            continue;
          }
        }

        const videos = fetchStartDate && fetchEndDate
          ? await fetchPastStreamsByDateRange(channel.channel_id, fetchStartDate, fetchEndDate)
          : await fetchPastStreams(channel.channel_id, daysAgo);

        allVideos.push(...videos);

        // fetched_date_rangesに記録
        if (fetchStartDate && fetchEndDate) {
          await supabase
            .from('fetched_date_ranges')
            .upsert({
              channel_id: channel.channel_id,
              start_date: fetchStartDate,
              end_date: fetchEndDate,
            }, { onConflict: 'channel_id,start_date,end_date' });
        }

        // レート制限対策（100ms待機）
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to fetch past streams for channel ${channel.channel_id}:`,
          error
        );
      }
    }

    console.log(`Fetched ${allVideos.length} past videos`);

    // stream_eventsテーブルに保存（upsert）
    if (allVideos.length > 0) {
      const streamEvents = allVideos.map((video) => ({
        video_id: video.id,
        channel_id: video.channelId,
        title: video.title,
        thumbnail: video.thumbnail,
        channel_title: video.channelTitle,
        scheduled_start_time: video.scheduledStartTime,
        actual_start_time: video.actualStartTime,
        actual_end_time: video.actualEndTime,
        live_broadcast_content: 'none',
        event_type: 'completed',
        published_at: video.publishedAt,
      }));

      const { error: upsertError } = await supabase
        .from('stream_events')
        .upsert(streamEvents, { onConflict: 'video_id' });

      if (upsertError) throw upsertError;

      console.log(`Saved ${streamEvents.length} past stream events`);
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully fetched and saved past stream events',
        channels: channelsToFetch.length,
        videos: allVideos.length,
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

async function fetchPastStreamsByDateRange(
  channelId: string,
  startDate: string,
  endDate: string
): Promise<YouTubeVideo[]> {
  // Search APIで過去の配信を検索
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', 'completed');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '50');
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('publishedAfter', new Date(startDate).toISOString());
  searchUrl.searchParams.set('publishedBefore', new Date(endDate + 'T23:59:59Z').toISOString());
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY!);

  const searchResponse = await fetch(searchUrl.toString());
  if (!searchResponse.ok) {
    throw new Error(
      `YouTube Search API error: ${searchResponse.status} ${searchResponse.statusText}`
    );
  }

  const searchData = await searchResponse.json();

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // 動画IDを収集
  const videoIds = searchData.items
    .map((item: any) => item.id.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  // Videos APIで詳細情報を取得
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
  videosUrl.searchParams.set('id', videoIds.join(','));
  videosUrl.searchParams.set('key', YOUTUBE_API_KEY!);

  const videosResponse = await fetch(videosUrl.toString());
  if (!videosResponse.ok) {
    throw new Error(
      `YouTube Videos API error: ${videosResponse.status} ${videosResponse.statusText}`
    );
  }

  const videosData = await videosResponse.json();

  return videosData.items.map((video: any) => ({
    id: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    liveBroadcastContent: 'none',
    scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
    actualStartTime: video.liveStreamingDetails?.actualStartTime,
    actualEndTime: video.liveStreamingDetails?.actualEndTime,
  }));
}

async function fetchPastStreams(
  channelId: string,
  daysAgo: number
): Promise<YouTubeVideo[]> {
  // 過去N日前の日時を計算
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysAgo);

  // Search APIで過去の配信を検索
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', 'completed');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '50');
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('publishedAfter', publishedAfter.toISOString());
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY!);

  const searchResponse = await fetch(searchUrl.toString());
  if (!searchResponse.ok) {
    throw new Error(
      `YouTube Search API error: ${searchResponse.status} ${searchResponse.statusText}`
    );
  }

  const searchData = await searchResponse.json();

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // 動画IDを収集
  const videoIds = searchData.items
    .map((item: any) => item.id.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  // Videos APIで詳細情報を取得
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
  videosUrl.searchParams.set('id', videoIds.join(','));
  videosUrl.searchParams.set('key', YOUTUBE_API_KEY!);

  const videosResponse = await fetch(videosUrl.toString());
  if (!videosResponse.ok) {
    throw new Error(
      `YouTube Videos API error: ${videosResponse.status} ${videosResponse.statusText}`
    );
  }

  const videosData = await videosResponse.json();

  return videosData.items.map((video: any) => ({
    id: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    liveBroadcastContent: 'none',
    scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
    actualStartTime: video.liveStreamingDetails?.actualStartTime,
    actualEndTime: video.liveStreamingDetails?.actualEndTime,
  }));
}
