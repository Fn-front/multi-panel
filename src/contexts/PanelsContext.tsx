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

// LocalStorage キー
const STORAGE_KEY = 'multi-panel:panels';

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

  // 初期ロード: localStorage からパネル情報を復元
  useEffect(() => {
    const savedPanels = localStorage.getItem(STORAGE_KEY);
    if (savedPanels) {
      try {
        const panels = JSON.parse(savedPanels) as Panel[];
        dispatch({ type: 'LOAD_LAYOUT', payload: panels });
      } catch (error) {
        console.error('Failed to load panels from localStorage:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // パネル状態が変更されたら localStorage に保存
  useEffect(() => {
    if (state.panels.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.panels));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.panels]);

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
