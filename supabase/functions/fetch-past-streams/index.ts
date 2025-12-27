// 過去のライブ配信アーカイブを取得する関数
// オンデマンドで実行（ユーザーリクエストまたは手動実行）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import axios from 'https://deno.land/x/axiod@0.26.2/mod.ts';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// YouTube API用のaxiosインスタンス
const youtubeApi = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  timeout: 30000,
  params: {
    key: YOUTUBE_API_KEY,
  },
});

// レスポンスインターセプター: YouTube API固有のエラーハンドリング
youtubeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        console.warn('YouTube API quota exceeded');
      }
    }
    return Promise.reject(error);
  },
);

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
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
      // favorite_channelsからchannel_thumbnailを取得
      const { data: channelData } = await supabase
        .from('favorite_channels')
        .select('channel_id, channel_title, channel_thumbnail')
        .eq('channel_id', channelId)
        .limit(1)
        .single();

      channelsToFetch = channelData
        ? [channelData]
        : [{ channel_id: channelId, channel_title: '', channel_thumbnail: null }];
    } else if (channelIds && Array.isArray(channelIds)) {
      // 複数チャンネル指定
      const { data: channelsData } = await supabase
        .from('favorite_channels')
        .select('channel_id, channel_title, channel_thumbnail')
        .in('channel_id', channelIds);

      channelsToFetch = channelsData || channelIds.map((id: string) => ({
        channel_id: id,
        channel_title: '',
        channel_thumbnail: null
      }));
    } else {
      // favorite_channelsから全チャンネルIDを取得
      const { data: channels, error: channelsError } = await supabase
        .from('favorite_channels')
        .select('channel_id, channel_title, channel_thumbnail');

      if (channelsError) throw channelsError;

      if (!channels || channels.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No favorite channels found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // チャンネルIDの重複を排除
      channelsToFetch = Array.from(
        new Map(channels.map((ch) => [ch.channel_id, { channel_title: ch.channel_title, channel_thumbnail: ch.channel_thumbnail }])).entries()
      ).map(([channel_id, { channel_title, channel_thumbnail }]) => ({ channel_id, channel_title, channel_thumbnail }));
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
          ? await fetchPastStreamsByDateRange(channel.channel_id, fetchStartDate, fetchEndDate, channel.channel_thumbnail)
          : await fetchPastStreams(channel.channel_id, daysAgo, channel.channel_thumbnail);

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
        channel_thumbnail: video.channelThumbnail,
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
  endDate: string,
  channelThumbnail?: string | null
): Promise<YouTubeVideo[]> {
  try {
    // Search APIで過去の配信を検索
    const searchResponse = await youtubeApi.get('/search', {
      params: {
        part: 'snippet',
        channelId,
        eventType: 'completed',
        type: 'video',
        maxResults: '50',
        order: 'date',
        publishedAfter: new Date(startDate).toISOString(),
        publishedBefore: new Date(endDate + 'T23:59:59Z').toISOString(),
      },
    });

    const searchData = searchResponse.data;

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
    const videosResponse = await youtubeApi.get('/videos', {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
    });

    const videosData = videosResponse.data;

    return videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      channelThumbnail: channelThumbnail || undefined,
      publishedAt: video.snippet.publishedAt,
      liveBroadcastContent: 'none',
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
      actualStartTime: video.liveStreamingDetails?.actualStartTime,
      actualEndTime: video.liveStreamingDetails?.actualEndTime,
    }));
  } catch (error: any) {
    throw new Error(
      `YouTube API error: ${error.response?.status} ${error.message}`
    );
  }
}

async function fetchPastStreams(
  channelId: string,
  daysAgo: number,
  channelThumbnail?: string | null
): Promise<YouTubeVideo[]> {
  // 過去N日前の日時を計算
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysAgo);

  try {
    // Search APIで過去の配信を検索
    const searchResponse = await youtubeApi.get('/search', {
      params: {
        part: 'snippet',
        channelId,
        eventType: 'completed',
        type: 'video',
        maxResults: '50',
        order: 'date',
        publishedAfter: publishedAfter.toISOString(),
      },
    });

    const searchData = searchResponse.data;

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
    const videosResponse = await youtubeApi.get('/videos', {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
    });

    const videosData = videosResponse.data;

    return videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      channelThumbnail: channelThumbnail || undefined,
      publishedAt: video.snippet.publishedAt,
      liveBroadcastContent: 'none',
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
      actualStartTime: video.liveStreamingDetails?.actualStartTime,
      actualEndTime: video.liveStreamingDetails?.actualEndTime,
    }));
  } catch (error: any) {
    throw new Error(
      `YouTube API error: ${error.response?.status} ${error.message}`
    );
  }
}
