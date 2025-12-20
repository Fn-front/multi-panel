'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Layout } from 'react-grid-layout';
import type { Panel, PanelsState, PanelsAction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// LocalStorage キー
const STORAGE_KEY = 'multi-panel:panels';
const DEFAULT_LAYOUT_NAME = 'default';

// 初期状態
const initialState: PanelsState = {
  panels: [],
};

// Reducer
function panelsReducer(state: PanelsState, action: PanelsAction): PanelsState {
  switch (action.type) {
    case 'ADD_PANEL':
      return {
        ...state,
        panels: [...state.panels, action.payload],
      };

    case 'REMOVE_PANEL':
      return {
        ...state,
        panels: state.panels.filter((panel) => panel.id !== action.payload),
      };

    case 'UPDATE_PANEL':
      return {
        ...state,
        panels: state.panels.map((panel) =>
          panel.id === action.payload.id
            ? { ...panel, ...action.payload.updates }
            : panel,
        ),
      };

    case 'UPDATE_LAYOUT':
      return {
        ...state,
        panels: state.panels.map((panel) => {
          const layoutItem = action.payload.find((item) => item.i === panel.id);
          if (layoutItem) {
            return {
              ...panel,
              layout: {
                x: layoutItem.x,
                y: layoutItem.y,
                w: layoutItem.w,
                h: layoutItem.h,
              },
            };
          }
          return panel;
        }),
      };

    case 'LOAD_LAYOUT':
      return {
        ...state,
        panels: action.payload,
      };

    default:
      return state;
  }
}

// Context の型定義
type PanelsContextType = {
  state: PanelsState;
  dispatch: React.Dispatch<PanelsAction>;
  isLoading: boolean;
  addPanel: (panel: Panel) => void;
  removePanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  updateLayout: (layout: Layout[]) => void;
};

// Context 作成
const PanelsContext = createContext<PanelsContextType | undefined>(undefined);

// Provider Props
type PanelsProviderProps = {
  children: ReactNode;
};

// Provider コンポーネント
export function PanelsProvider({ children }: PanelsProviderProps) {
  const [state, dispatch] = useReducer(panelsReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAllowed } = useAuth();

  // 初期データ読み込み（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const loadPanels = async () => {
      if (isCancelled) return;
      if (user) {
        // ログイン時: Supabaseから読み込み
        try {
          const { data, error } = await supabase
            .from('panel_layouts')
            .select('*')
            .eq('is_active', true)
            .eq('layout_name', DEFAULT_LAYOUT_NAME)
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (data && data.panels) {
            const panels = data.panels as Panel[];
            if (!isCancelled) {
              dispatch({ type: 'LOAD_LAYOUT', payload: panels });
            }
          } else {
            // データが存在しない場合は空配列
            if (!isCancelled) {
              dispatch({ type: 'LOAD_LAYOUT', payload: [] });
            }
          }
        } catch (error) {
          console.error('Failed to load panels from Supabase:', error);
        }
      } else {
        // 未ログイン時: localStorageから読み込み
        const savedPanels = localStorage.getItem(STORAGE_KEY);
        if (savedPanels) {
          try {
            const panels = JSON.parse(savedPanels) as Panel[];
            if (!isCancelled) {
              dispatch({ type: 'LOAD_LAYOUT', payload: panels });
            }
          } catch (error) {
            console.error('Failed to load panels from localStorage:', error);
          }
        }
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    loadPanels();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // データ保存（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    if (isLoading) return; // 初期ロード中は保存しない

    const savePanels = async () => {
      if (user && isAllowed) {
        // ログイン時かつ許可されたユーザー: Supabaseへ保存
        try {
          // 既存のレイアウトを確認
          const { data: existingLayout, error: selectError } = await supabase
            .from('panel_layouts')
            .select('id')
            .eq('layout_name', DEFAULT_LAYOUT_NAME)
            .maybeSingle();

          if (selectError) throw selectError;

          if (existingLayout) {
            // 更新
            const { error } = await supabase
              .from('panel_layouts')
              .update({
                panels: state.panels,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingLayout.id);

            if (error) throw error;
          } else {
            // 新規作成
            const { error } = await supabase.from('panel_layouts').insert({
              user_id: user.id,
              layout_name: DEFAULT_LAYOUT_NAME,
              panels: state.panels,
              is_active: true,
            });

            if (error) throw error;
          }
        } catch (error) {
          console.error('Failed to save panels to Supabase:', error);
        }
      } else {
        // 未ログイン時: localStorageへ保存
        if (state.panels.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state.panels));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    savePanels();
  }, [state.panels, user, isAllowed, isLoading]);

  // ヘルパー関数
  const addPanel = (panel: Panel) => {
    dispatch({ type: 'ADD_PANEL', payload: panel });
  };

  const removePanel = (id: string) => {
    dispatch({ type: 'REMOVE_PANEL', payload: id });
  };

  const updatePanel = (id: string, updates: Partial<Panel>) => {
    dispatch({ type: 'UPDATE_PANEL', payload: { id, updates } });
  };

  const updateLayout = (layout: Layout[]) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  };

  const value: PanelsContextType = {
    state,
    dispatch,
    isLoading,
    addPanel,
    removePanel,
    updatePanel,
    updateLayout,
  };

  return (
    <PanelsContext.Provider value={value}>{children}</PanelsContext.Provider>
  );
}

// Custom Hook
export function usePanels() {
  const context = useContext(PanelsContext);
  if (context === undefined) {
    throw new Error('usePanels must be used within a PanelsProvider');
  }
  return context;
}
