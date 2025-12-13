/**
 * YouTubeチャンネル情報を表す型
 */
export type Channel = {
  /** 内部管理用の一意識別子 */
  id: string;
  /** YouTube Channel ID */
  channelId: string;
  /** チャンネル名 */
  channelName: string;
  /** 登録日時 (Unix timestamp) */
  addedAt: number;
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
  | { type: 'ADD_CHANNEL'; payload: Channel }
  | { type: 'REMOVE_CHANNEL'; payload: string }
  | {
      type: 'UPDATE_CHANNEL';
      payload: { id: string; updates: Partial<Channel> };
    }
  | { type: 'LOAD_CHANNELS'; payload: Channel[] };

/**
 * チャンネル追加時の入力データ
 */
export type AddChannelInput = {
  /** YouTube Channel ID または Channel URL */
  channelIdOrUrl: string;
};
