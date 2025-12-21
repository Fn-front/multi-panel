import { Layout } from 'react-grid-layout';
import { ACTION_TYPES } from '@/constants';

/**
 * パネルの状態を表す型
 */
export type Panel = {
  /** パネルの一意識別子 */
  id: string;
  /** YouTube動画のURL */
  url: string;
  /** 音量 (0.0 ~ 1.0) */
  volume: number;
  /** ミュート状態 */
  isMuted: boolean;
  /** ライブチャット表示フラグ */
  showChat: boolean;
  /** グリッドレイアウト上の位置・サイズ */
  layout: {
    /** X座標 (グリッド単位) */
    x: number;
    /** Y座標 (グリッド単位) */
    y: number;
    /** 幅 (グリッド単位) */
    w: number;
    /** 高さ (グリッド単位) */
    h: number;
  };
};

/**
 * パネル一覧の状態
 */
export type PanelsState = {
  /** パネルの配列 */
  panels: Panel[];
};

/**
 * パネル操作のアクション型
 */
export type PanelsAction =
  | { type: typeof ACTION_TYPES.PANEL.ADD; payload: Panel }
  | { type: typeof ACTION_TYPES.PANEL.REMOVE; payload: string }
  | { type: typeof ACTION_TYPES.PANEL.UPDATE; payload: { id: string; updates: Partial<Panel> } }
  | { type: typeof ACTION_TYPES.PANEL.UPDATE_LAYOUT; payload: Layout[] }
  | { type: typeof ACTION_TYPES.PANEL.LOAD_LAYOUT; payload: Panel[] };

/**
 * パネル作成時の初期値オプション
 */
export type CreatePanelOptions = {
  url?: string;
  volume?: number;
  isMuted?: boolean;
  showChat?: boolean;
  layout?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
};
