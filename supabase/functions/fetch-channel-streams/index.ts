// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

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

    // favorite_channelsから全チャンネルIDを取得（重複排除）
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
    const uniqueChannels = Array.from(
      new Map(channels.map((ch) => [ch.channel_id, { channel_title: ch.channel_title, channel_thumbnail: ch.channel_thumbnail }])).entries()
    ).map(([channel_id, { channel_title, channel_thumbnail }]) => ({ channel_id, channel_title, channel_thumbnail }));

    console.log(`Fetching streams for ${uniqueChannels.length} channels`);

    const allVideos: YouTubeVideo[] = [];

    // 各チャンネルの配信情報を取得
    for (const channel of uniqueChannels) {
      try {
        // ライブ配信中の動画を取得
        const liveVideos = await fetchChannelStreams(
          channel.channel_id,
          'live',
          channel.channel_thumbnail
        );
        allVideos.push(...liveVideos);

        // 配信予定の動画を取得
        const upcomingVideos = await fetchChannelStreams(
          channel.channel_id,
          'upcoming',
          channel.channel_thumbnail
        );
        allVideos.push(...upcomingVideos);

        // レート制限対策（100ms待機）
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to fetch streams for channel ${channel.channel_id}:`,
          error
        );
      }
    }

    console.log(`Fetched ${allVideos.length} videos`);

    // 既存のlive/upcoming配信の状態を更新
    const { data: existingEvents, error: existingError } = await supabase
      .from('stream_events')
      .select('video_id')
      .in('live_broadcast_content', ['live', 'upcoming']);

    if (existingError) {
      console.error('Failed to fetch existing events:', existingError);
    } else if (existingEvents && existingEvents.length > 0) {
      const existingVideoIds = existingEvents.map((e) => e.video_id);
      console.log(`Checking ${existingVideoIds.length} existing live/upcoming videos`);

      // 既存配信の最新情報を取得（最大50件ずつ）
      const batchSize = 50;
      for (let i = 0; i < existingVideoIds.length; i += batchSize) {
        const batch = existingVideoIds.slice(i, i + batchSize);
        const updatedVideos = await fetchVideoDetails(batch);
        allVideos.push(...updatedVideos);

        // レート制限対策
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`Updated ${existingVideoIds.length} existing videos`);
    }

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
        live_broadcast_content: video.liveBroadcastContent,
        event_type: video.liveBroadcastContent,
        published_at: video.publishedAt,
      }));

      const { error: upsertError } = await supabase
        .from('stream_events')
        .upsert(streamEvents, { onConflict: 'video_id' });

      if (upsertError) throw upsertError;

      console.log(`Saved ${streamEvents.length} stream events`);
    }

    return new Response(
      JSON.stringify({
        message: 'Successfully fetched and saved stream events',
        channels: uniqueChannels.length,
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

async function fetchVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
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
    channelThumbnail: undefined,
    publishedAt: video.snippet.publishedAt,
    liveBroadcastContent: video.snippet.liveBroadcastContent || 'none',
    scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
    actualStartTime: video.liveStreamingDetails?.actualStartTime,
    actualEndTime: video.liveStreamingDetails?.actualEndTime,
  }));
}

async function fetchChannelStreams(
  channelId: string,
  eventType: 'live' | 'upcoming',
  channelThumbnail?: string | null
): Promise<YouTubeVideo[]> {
  // Search APIで配信を検索
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', eventType);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '50');
  searchUrl.searchParams.set('order', 'date');
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
    channelThumbnail: channelThumbnail || undefined,
    publishedAt: video.snippet.publishedAt,
    liveBroadcastContent: eventType,
    scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
    actualStartTime: video.liveStreamingDetails?.actualStartTime,
    actualEndTime: video.liveStreamingDetails?.actualEndTime,
  }));
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-channel-streams' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json'

*/
