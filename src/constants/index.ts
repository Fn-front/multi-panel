/**
 * アプリケーション全体で使用する定数
 */

// ========================================
// localStorage キー
// ========================================
export const STORAGE_KEYS = {
  PANELS: 'multi-panel:panels',
  CHANNELS: 'multi-panel:channels',
  FAVORITES: 'multi-panel:favorites',
} as const;

// ========================================
// グリッドレイアウト設定
// ========================================
export const GRID_LAYOUT = {
  /** グリッドの列数 */
  COLS: 12,
  /** 各行の高さ（px） */
  ROW_HEIGHT: 100,
  /** グリッドの幅（px） */
  WIDTH: 1200,
  /** パネルの最小幅（グリッド単位） */
  MIN_WIDTH: 2,
  /** パネルの最小高さ（グリッド単位） */
  MIN_HEIGHT: 2,
} as const;

// ========================================
// パネルのデフォルト値
// ========================================
export const PANEL_DEFAULTS = {
  /** デフォルト音量（0.0 - 1.0） */
  VOLUME: 0.5,
  /** デフォルトミュート状態 */
  IS_MUTED: false,
  /** デフォルトチャット表示状態 */
  SHOW_CHAT: false,
  /** デフォルトレイアウト */
  LAYOUT: {
    x: 0,
    y: Infinity, // 最下部に配置
    w: 4,
    h: 3,
  },
} as const;

// ========================================
// スタイル定数
// ========================================
export const STYLES = {
  /** ボタンのボーダー半径 */
  BUTTON_BORDER_RADIUS: '4px',
  /** ポップオーバーのボーダー半径 */
  POPOVER_BORDER_RADIUS: '8px',
  /** 小さいアイコンサイズ */
  ICON_SIZE_SM: '16px',
  /** 中サイズアイコンサイズ */
  ICON_SIZE_MD: '20px',
  /** 大きいアイコンサイズ */
  ICON_SIZE_LG: '24px',
} as const;

// ========================================
// Action Types
// ========================================
export const ACTION_TYPES = {
  // Channel actions
  CHANNEL: {
    ADD: 'ADD_CHANNEL',
    REMOVE: 'REMOVE_CHANNEL',
    UPDATE: 'UPDATE_CHANNEL',
    LOAD: 'LOAD_CHANNELS',
  },
  // Panel actions
  PANEL: {
    ADD: 'ADD_PANEL',
    REMOVE: 'REMOVE_PANEL',
    UPDATE: 'UPDATE_PANEL',
    UPDATE_LAYOUT: 'UPDATE_LAYOUT',
    LOAD_LAYOUT: 'LOAD_LAYOUT',
  },
  // Favorite actions
  FAVORITE: {
    ADD: 'ADD_FAVORITE',
    REMOVE: 'REMOVE_FAVORITE',
    UPDATE: 'UPDATE_FAVORITE',
    REORDER: 'REORDER_FAVORITES',
    LOAD: 'LOAD_FAVORITES',
  },
} as const;

// ========================================
// UIテキスト
// ========================================
export const UI_TEXT = {
  // カレンダー関連
  CALENDAR: {
    TITLE: '配信カレンダー',
    MONTH_VIEW_TITLE: '配信カレンダー（月表示）',
    TODAY: '今日',
    WEEK: '週',
    DAY: '日',
    MONTH: '月',
    RELOAD: '再読み込み',
    FETCH_ERROR: 'スケジュールの取得に失敗しました',
  },
  // 曜日表示
  WEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'] as const,
  // パネル関連
  PANEL: {
    ADD: 'パネルを追加',
    EMPTY: 'パネルがありません',
    VOLUME_CONTROL: '音量調整',
    VOLUME: '音量',
    MUTE: 'ミュート',
    UNMUTE: 'ミュート解除',
    LOAD_VIDEO: '動画を読み込み',
    URL_PLACEHOLDER: 'YouTube動画URLを入力',
    URL_INPUT_MESSAGE: 'YouTube動画URLを入力してください',
    INVALID_URL: '有効なYouTube動画URLを入力してください',
    URL_TOO_LONG: (maxLength: number) => `URLが長すぎます（最大${maxLength}文字）`,
    REMOVE: 'パネルを削除',
  },
  // チャンネル関連
  CHANNEL: {
    TITLE: 'お気に入りチャンネル',
    ADD: '追加',
    ADDING: '追加中...',
    PLACEHOLDER: 'チャンネルURLまたはIDを入力',
    EMPTY: 'お気に入りチャンネルを追加してください',
    REMOVE: '削除',
    ALREADY_REGISTERED: 'このチャンネルは既に登録されています',
    NOT_FOUND: 'チャンネルが見つかりませんでした',
    ADD_FAILED: 'チャンネルの追加に失敗しました',
    INVALID_VIDEO_URL: '動画URLからチャンネルを追加することはできません。チャンネルURLを入力してください。',
    INPUT_REQUIRED: 'チャンネルIDまたはURLを入力してください',
    INVALID_INPUT: '有効なチャンネルIDまたはURLを入力してください',
  },
  // 認証関連
  AUTH: {
    LOGIN: 'ログイン',
    LOGOUT: 'ログアウト',
    LOGIN_WITH_GITHUB: 'GitHubでログイン',
    LOGIN_FAILED: 'ログアウトに失敗しました。',
    LOGIN_ERROR: 'ログインに失敗しました。もう一度お試しください。',
    LOGIN_MESSAGE: 'Multi Panelを使用するには、GitHubアカウントでログインしてください。',
    NOT_WHITELISTED: 'ホワイトリストに登録されていません',
  },
  // 通知関連
  NOTIFICATION: {
    TITLE: '配信通知',
    ENABLE: '通知を有効にする',
    ENABLED: '通知有効',
    DENIED: '通知が拒否されています',
    PERMISSION_REQUIRED: 'ブラウザの通知許可が必要です',
    COUNT: (count: number) => `${count}件通知済み`,
    NOT_SUPPORTED: 'このブラウザは通知をサポートしていません',
    STREAMING_LIVE: '配信中',
    STREAMING_START: '配信開始',
  },
  // サイドバー関連
  SIDEBAR: {
    OPEN: 'サイドバーを開く',
    CLOSE: 'サイドバーを閉じる',
  },
  // 接続状態関連
  CONNECTION: {
    RETRYING: '接続を再試行中',
    RETRY_COUNT: (attempt: number, max: number) => `${attempt}/${max} 回目の試行...`,
    COLD_START: '接続プールがスリープ中',
    COLD_START_MESSAGE: (time: number | null) =>
      `次のリクエストに ${time ? `${(time / 1000).toFixed(1)}秒` : '1-2秒'} かかる可能性があります`,
  },
} as const;

// ========================================
// FullCalendar設定
// ========================================
export const FULL_CALENDAR_CONFIG = {
  // 初期表示ビュー
  INITIAL_VIEW: 'timeGridWeek',
  // 時間範囲
  SLOT_MIN_TIME: '00:00:00',
  SLOT_MAX_TIME: '24:00:00',
  // 全日イベント表示
  ALL_DAY_SLOT: false,
  // 高さ設定
  HEIGHT: '100%',
  // 日表示制限（月表示）
  DAY_MAX_EVENT_ROWS: false,
  // ヘッダーツールバー（週表示）
  HEADER_TOOLBAR_WEEK: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridWeek,timeGridDay',
  },
  // ヘッダーツールバー（月表示）
  HEADER_TOOLBAR_MONTH: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
} as const;
