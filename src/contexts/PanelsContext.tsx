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
  const { user } = useAuth();

  // 初期データ読み込み（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    const loadPanels = async () => {
      setIsLoading(true);

      if (user) {
        // ログイン時: Supabaseから読み込み
        try {
          const { data, error } = await supabase
            .from('panel_layouts')
            .select('*')
            .eq('is_active', true)
            .eq('layout_name', DEFAULT_LAYOUT_NAME)
            .single();

          if (error) {
            // レイアウトが存在しない場合はエラーではなく空配列とする
            if (error.code === 'PGRST116') {
              dispatch({ type: 'LOAD_LAYOUT', payload: [] });
            } else {
              throw error;
            }
          } else if (data && data.panels) {
            const panels = data.panels as Panel[];
            dispatch({ type: 'LOAD_LAYOUT', payload: panels });
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
            dispatch({ type: 'LOAD_LAYOUT', payload: panels });
          } catch (error) {
            console.error('Failed to load panels from localStorage:', error);
          }
        }
      }

      setIsLoading(false);
    };

    loadPanels();
  }, [user?.id]);

  // データ保存（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    if (isLoading) return; // 初期ロード中は保存しない

    const savePanels = async () => {
      if (user) {
        // ログイン時: Supabaseへ保存
        try {
          // 既存のレイアウトを確認
          const { data: existingLayout } = await supabase
            .from('panel_layouts')
            .select('id')
            .eq('layout_name', DEFAULT_LAYOUT_NAME)
            .single();

          if (existingLayout) {
            // 更新
            const { error } = await supabase
              .from('panel_layouts')
              .update({
                panels: state.panels,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingLayout.id);

            if (error) {
              console.error('Update error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
              throw error;
            }
          } else {
            // 新規作成
            const { error } = await supabase.from('panel_layouts').insert({
              user_id: user.id,
              layout_name: DEFAULT_LAYOUT_NAME,
              panels: state.panels,
              is_active: true,
            });

            if (error) {
              console.error('Insert error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
              throw error;
            }
          }
        } catch (error) {
          console.error('Failed to save panels to Supabase:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
          }
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
  }, [state.panels, user, isLoading]);

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
