import { ACTION_TYPES } from '@/constants';

/**
 * YouTubeチャンネル情報を表す型
 */
export type Channel = {
  /** 内部管理用の一意識別子 */
  id: string;
  /** YouTube Channel ID */
  channelId: string;
  /** チャンネル名 */
  name: string;
  /** サムネイルURL */
  thumbnail?: string;
  /** カレンダー表示色 */
  color?: string;
};

/**
 * チャンネル一覧の状態
 */
export type ChannelsState = {
  /** チャンネルの配列 */
  channels: Channel[];
};

/**
 * チャンネル操作のアクション型
 */
export type ChannelsAction =
  | { type: typeof ACTION_TYPES.CHANNEL.ADD; payload: Channel }
  | { type: typeof ACTION_TYPES.CHANNEL.REMOVE; payload: string }
  | {
      type: typeof ACTION_TYPES.CHANNEL.UPDATE;
      payload: { id: string; updates: Partial<Channel> };
    }
  | { type: typeof ACTION_TYPES.CHANNEL.LOAD; payload: Channel[] };

/**
 * チャンネル追加時の入力データ
 */
export type AddChannelInput = {
  /** YouTube Channel ID または Channel URL */
  channelIdOrUrl: string;
};
