/**
 * YouTube Data API v3 のレスポンス型定義
 */

/**
 * YouTube動画情報
 */
export type YouTubeVideo = {
  /** 動画ID */
  id: string;
  /** 動画タイトル */
  title: string;
  /** サムネイルURL */
  thumbnail: string;
  /** チャンネルID */
  channelId: string;
  /** チャンネル名 */
  channelName: string;
  /** 公開日時 (ISO 8601形式) */
  publishedAt: string;
  /** ライブ配信ステータス */
  liveBroadcastContent: 'none' | 'upcoming' | 'live';
  /** 開始予定時刻 (ISO 8601形式) - ライブ配信・プレミア公開の場合 */
  scheduledStartTime?: string;
};

/**
 * YouTubeチャンネル情報
 */
export type YouTubeChannelInfo = {
  /** チャンネルID */
  id: string;
  /** チャンネル名 */
  title: string;
  /** チャンネル説明 */
  description: string;
  /** サムネイルURL */
  thumbnail: string;
  /** カスタムURL */
  customUrl?: string;
};

/**
 * YouTube Data API - Videos.list レスポンス
 */
export type YouTubeVideosResponse = {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
    liveStreamingDetails?: {
      scheduledStartTime?: string;
      actualStartTime?: string;
    };
  }>;
};

/**
 * YouTube Data API - Search.list レスポンス
 */
export type YouTubeSearchResponse = {
  items: Array<{
    id: {
      kind: string;
      videoId?: string;
      channelId?: string;
    };
    snippet: {
      title: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      liveBroadcastContent: 'none' | 'upcoming' | 'live';
    };
  }>;
};

/**
 * YouTube Data API - Channels.list レスポンス
 */
export type YouTubeChannelsResponse = {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
    };
  }>;
};

/**
 * YouTube URLのパース結果
 */
export type ParsedYouTubeUrl = {
  /** 動画ID (動画URLの場合) */
  videoId?: string;
  /** チャンネルID (チャンネルURLの場合) */
  channelId?: string;
  /** チャンネルカスタムURL (チャンネルURLの場合) */
  channelHandle?: string;
  /** URLの種類 */
  type: 'video' | 'channel' | 'unknown';
};

/**
 * カレンダーイベント型
 */
export type CalendarEvent = {
  /** イベントID */
  id: string;
  /** タイトル */
  title: string;
  /** 開始日時 */
  start: Date;
  /** 終了日時 */
  end: Date;
  /** イベント種別 */
  eventType: 'video' | 'live' | 'upcoming';
  /** YouTube動画URL */
  url: string;
  /** チャンネルID */
  channelId: string;
  /** チャンネル名 */
  channelName: string;
  /** チャンネルサムネイルURL */
  channelThumbnail?: string;
};
