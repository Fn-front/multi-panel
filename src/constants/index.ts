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
  },
  // 曜日表示
  WEEKDAYS: ['日', '月', '火', '水', '木', '金', '土'] as const,
} as const;
