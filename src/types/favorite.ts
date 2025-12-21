import { ACTION_TYPES } from '@/constants';

/**
 * お気に入りURL情報を表す型
 */
export type Favorite = {
  /** 内部管理用の一意識別子 */
  id: string;
  /** YouTube動画のURL */
  url: string;
  /** 動画タイトル */
  title: string;
  /** チャンネル名 */
  channelName: string;
  /** 登録日時 (Unix timestamp) */
  addedAt: number;
};

/**
 * お気に入り一覧の状態
 */
export type FavoritesState = {
  /** お気に入りの配列 */
  favorites: Favorite[];
};

/**
 * お気に入り操作のアクション型
 */
export type FavoritesAction =
  | { type: typeof ACTION_TYPES.FAVORITE.ADD; payload: Favorite }
  | { type: typeof ACTION_TYPES.FAVORITE.REMOVE; payload: string }
  | {
      type: typeof ACTION_TYPES.FAVORITE.UPDATE;
      payload: { id: string; updates: Partial<Favorite> };
    }
  | { type: typeof ACTION_TYPES.FAVORITE.REORDER; payload: Favorite[] }
  | { type: typeof ACTION_TYPES.FAVORITE.LOAD; payload: Favorite[] };

/**
 * お気に入り追加時の入力データ
 */
export type AddFavoriteInput = {
  /** YouTube動画のURL */
  url: string;
};
