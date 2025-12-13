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
  | { type: 'ADD_FAVORITE'; payload: Favorite }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'UPDATE_FAVORITE'; payload: { id: string; updates: Partial<Favorite> } }
  | { type: 'REORDER_FAVORITES'; payload: Favorite[] }
  | { type: 'LOAD_FAVORITES'; payload: Favorite[] };

/**
 * お気に入り追加時の入力データ
 */
export type AddFavoriteInput = {
  /** YouTube動画のURL */
  url: string;
};
