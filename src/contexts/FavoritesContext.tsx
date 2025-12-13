'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { Favorite, FavoritesState, FavoritesAction } from '@/types';

// LocalStorage キー
const STORAGE_KEY = 'multi-panel:favorites';

// 初期状態
const initialState: FavoritesState = {
  favorites: [],
};

// Reducer
function favoritesReducer(
  state: FavoritesState,
  action: FavoritesAction
): FavoritesState {
  switch (action.type) {
    case 'ADD_FAVORITE':
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };

    case 'REMOVE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.filter(
          (favorite) => favorite.id !== action.payload
        ),
      };

    case 'UPDATE_FAVORITE':
      return {
        ...state,
        favorites: state.favorites.map((favorite) =>
          favorite.id === action.payload.id
            ? { ...favorite, ...action.payload.updates }
            : favorite
        ),
      };

    case 'REORDER_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };

    case 'LOAD_FAVORITES':
      return {
        ...state,
        favorites: action.payload,
      };

    default:
      return state;
  }
}

// Context の型定義
type FavoritesContextType = {
  state: FavoritesState;
  dispatch: React.Dispatch<FavoritesAction>;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (id: string) => void;
  updateFavorite: (id: string, updates: Partial<Favorite>) => void;
  reorderFavorites: (favorites: Favorite[]) => void;
};

// Context 作成
const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

// Provider Props
type FavoritesProviderProps = {
  children: ReactNode;
};

// Provider コンポーネント
export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);

  // 初期ロード: localStorage からお気に入り情報を復元
  useEffect(() => {
    const savedFavorites = localStorage.getItem(STORAGE_KEY);
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites) as Favorite[];
        dispatch({ type: 'LOAD_FAVORITES', payload: favorites });
      } catch (error) {
        console.error('Failed to load favorites from localStorage:', error);
      }
    }
  }, []);

  // お気に入り状態が変更されたら localStorage に保存
  useEffect(() => {
    if (state.favorites.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.favorites]);

  // ヘルパー関数
  const addFavorite = (favorite: Favorite) => {
    dispatch({ type: 'ADD_FAVORITE', payload: favorite });
  };

  const removeFavorite = (id: string) => {
    dispatch({ type: 'REMOVE_FAVORITE', payload: id });
  };

  const updateFavorite = (id: string, updates: Partial<Favorite>) => {
    dispatch({ type: 'UPDATE_FAVORITE', payload: { id, updates } });
  };

  const reorderFavorites = (favorites: Favorite[]) => {
    dispatch({ type: 'REORDER_FAVORITES', payload: favorites });
  };

  const value: FavoritesContextType = {
    state,
    dispatch,
    addFavorite,
    removeFavorite,
    updateFavorite,
    reorderFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom Hook
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
