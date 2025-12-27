/**
 * YouTube Data API v3 クライアント
 */

import type {
  YouTubeChannelsResponse,
  YouTubeSearchResponse,
  YouTubeVideosResponse,
  YouTubeChannelInfo,
  YouTubeVideo,
} from '@/types/youtube';
import { createYouTubeClient } from '@/lib/http-client';
import type { AxiosInstance } from 'axios';

let youtubeClient: AxiosInstance | null = null;

/**
 * YouTube API クライアントを取得
 */
function getYouTubeClient(): AxiosInstance {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'YouTube API Key is not configured. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in .env.local',
    );
  }

  if (!youtubeClient) {
    youtubeClient = createYouTubeClient(apiKey);
  }

  return youtubeClient;
}

/**
 * チャンネルIDまたはハンドルから詳細情報を取得
 */
export async function getChannelInfo(
  channelIdOrHandle: string,
): Promise<YouTubeChannelInfo | null> {
  const client = getYouTubeClient();

  try {
    let params: Record<string, string>;

    // @で始まる場合はハンドルとして扱う
    if (channelIdOrHandle.startsWith('@')) {
      params = {
        part: 'snippet',
        forHandle: channelIdOrHandle.slice(1), // @を除く
      };
    } else if (channelIdOrHandle.startsWith('UC')) {
      // UCで始まる場合はチャンネルID
      params = {
        part: 'snippet',
        id: channelIdOrHandle,
      };
    } else {
      // それ以外はカスタムURL/ユーザー名として扱う
      params = {
        part: 'snippet',
        forUsername: channelIdOrHandle,
      };
    }

    const response = await client.get<YouTubeChannelsResponse>('/channels', {
      params,
    });

    const data = response.data;
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.high.url,
      customUrl: channel.snippet.customUrl,
    };
  } catch (error) {
    console.error('Failed to fetch channel info:', error);
    throw error;
  }
}

/**
 * チャンネルの配信予定・ライブ配信を取得
 */
export async function getChannelUpcomingStreams(
  channelId: string,
): Promise<YouTubeVideo[]> {
  const client = getYouTubeClient();

  try {
    // Search APIで配信予定・ライブ中の動画を検索
    const searchResponse = await client.get<YouTubeSearchResponse>('/search', {
      params: {
        part: 'snippet',
        channelId,
        eventType: 'upcoming',
        type: 'video',
        maxResults: '50',
        order: 'date',
      },
    });

    const data = searchResponse.data;
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 動画IDを収集
    const videoIds = data.items
      .map((item) => item.id.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    // Videos APIで詳細情報を取得（配信開始時刻を含む）
    const videosResponse = await client.get<YouTubeVideosResponse>('/videos', {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
    });

    const videosData = videosResponse.data;

    return videosData.items.map((video) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelName: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      liveBroadcastContent: 'upcoming',
      scheduledStartTime: video.liveStreamingDetails?.scheduledStartTime,
    }));
  } catch (error) {
    console.error('Failed to fetch upcoming streams:', error);
    throw error;
  }
}

/**
 * チャンネルの現在配信中の動画を取得
 */
export async function getChannelLiveStreams(
  channelId: string,
): Promise<YouTubeVideo[]> {
  const client = getYouTubeClient();

  try {
    const searchResponse = await client.get<YouTubeSearchResponse>('/search', {
      params: {
        part: 'snippet',
        channelId,
        eventType: 'live',
        type: 'video',
        maxResults: '10',
      },
    });

    const data = searchResponse.data;
    if (!data.items || data.items.length === 0) {
      return [];
    }

    const videoIds = data.items
      .map((item) => item.id.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    const videosResponse = await client.get<YouTubeVideosResponse>('/videos', {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
    });

    const videosData = videosResponse.data;

    return videosData.items.map((video) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelName: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      liveBroadcastContent: 'live',
      scheduledStartTime: video.liveStreamingDetails?.actualStartTime,
    }));
  } catch (error) {
    console.error('Failed to fetch live streams:', error);
    throw error;
  }
}

/**
 * チャンネルの過去のライブ配信アーカイブを取得
 */
export async function getChannelPastStreams(
  channelId: string,
): Promise<YouTubeVideo[]> {
  const client = getYouTubeClient();

  try {
    // Search APIで過去の動画を検索
    const searchResponse = await client.get<YouTubeSearchResponse>('/search', {
      params: {
        part: 'snippet',
        channelId,
        eventType: 'completed',
        type: 'video',
        maxResults: '50',
        order: 'date',
      },
    });

    const data = searchResponse.data;
    if (!data.items || data.items.length === 0) {
      return [];
    }

    const videoIds = data.items
      .map((item) => item.id.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    const videosResponse = await client.get<YouTubeVideosResponse>('/videos', {
      params: {
        part: 'snippet,liveStreamingDetails',
        id: videoIds.join(','),
      },
    });

    const videosData = videosResponse.data;

    return videosData.items.map((video) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelName: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      liveBroadcastContent: 'none',
      scheduledStartTime: video.liveStreamingDetails?.actualStartTime,
    }));
  } catch (error) {
    console.error('Failed to fetch past streams:', error);
    throw error;
  }
}

/**
 * 複数チャンネルの配信スケジュールを一括取得
 */
export async function getMultipleChannelsSchedule(
  channelIds: string[],
): Promise<Map<string, YouTubeVideo[]>> {
  const scheduleMap = new Map<string, YouTubeVideo[]>();

  // 並列リクエストで効率化
  const results = await Promise.allSettled(
    channelIds.map(async (channelId) => {
      const [upcoming, live, past] = await Promise.all([
        getChannelUpcomingStreams(channelId),
        getChannelLiveStreams(channelId),
        getChannelPastStreams(channelId),
      ]);
      return { channelId, videos: [...live, ...upcoming, ...past] };
    }),
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      scheduleMap.set(result.value.channelId, result.value.videos);
    } else {
      console.error('Failed to fetch schedule for a channel:', result.reason);
    }
  });

  return scheduleMap;
}
