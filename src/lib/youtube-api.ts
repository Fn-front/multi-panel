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

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * APIキーの取得と存在チェック
 */
function validateApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'YouTube API Key is not configured. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in .env.local',
    );
  }
  return apiKey;
}

/**
 * YouTube Data API エラーハンドリング
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: {
        code: response.status,
        message: response.statusText,
      },
    }));

    throw new Error(
      `YouTube API Error: ${error.error?.message || 'Unknown error'} (${error.error?.code || response.status})`,
    );
  }

  return response.json();
}

/**
 * チャンネルIDから詳細情報を取得
 */
export async function getChannelInfo(channelId: string): Promise<YouTubeChannelInfo | null> {
  const apiKey = validateApiKey();

  const url = new URL(`${API_BASE_URL}/channels`);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await handleApiResponse<YouTubeChannelsResponse>(response);

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
export async function getChannelUpcomingStreams(channelId: string): Promise<YouTubeVideo[]> {
  const apiKey = validateApiKey();

  // Search APIで配信予定・ライブ中の動画を検索
  const searchUrl = new URL(`${API_BASE_URL}/search`);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', 'upcoming');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '50');
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('key', apiKey);

  try {
    const response = await fetch(searchUrl.toString());
    const data = await handleApiResponse<YouTubeSearchResponse>(response);

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // 動画IDを収集
    const videoIds = data.items.map((item) => item.id.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    // Videos APIで詳細情報を取得（配信開始時刻を含む）
    const videosUrl = new URL(`${API_BASE_URL}/videos`);
    videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));
    videosUrl.searchParams.set('key', apiKey);

    const videosResponse = await fetch(videosUrl.toString());
    const videosData = await handleApiResponse<YouTubeVideosResponse>(videosResponse);

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
export async function getChannelLiveStreams(channelId: string): Promise<YouTubeVideo[]> {
  const apiKey = validateApiKey();

  const searchUrl = new URL(`${API_BASE_URL}/search`);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('eventType', 'live');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('maxResults', '10');
  searchUrl.searchParams.set('key', apiKey);

  try {
    const response = await fetch(searchUrl.toString());
    const data = await handleApiResponse<YouTubeSearchResponse>(response);

    if (!data.items || data.items.length === 0) {
      return [];
    }

    const videoIds = data.items.map((item) => item.id.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return [];
    }

    const videosUrl = new URL(`${API_BASE_URL}/videos`);
    videosUrl.searchParams.set('part', 'snippet,liveStreamingDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));
    videosUrl.searchParams.set('key', apiKey);

    const videosResponse = await fetch(videosUrl.toString());
    const videosData = await handleApiResponse<YouTubeVideosResponse>(videosResponse);

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
 * 複数チャンネルの配信スケジュールを一括取得
 */
export async function getMultipleChannelsSchedule(
  channelIds: string[],
): Promise<Map<string, YouTubeVideo[]>> {
  const scheduleMap = new Map<string, YouTubeVideo[]>();

  // 並列リクエストで効率化
  const results = await Promise.allSettled(
    channelIds.map(async (channelId) => {
      const [upcoming, live] = await Promise.all([
        getChannelUpcomingStreams(channelId),
        getChannelLiveStreams(channelId),
      ]);
      return { channelId, videos: [...live, ...upcoming] };
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
