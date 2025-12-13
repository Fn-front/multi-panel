'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { Channel, ChannelsState, ChannelsAction } from '@/types';

// LocalStorage キー
const STORAGE_KEY = 'multi-panel:channels';

// 初期状態
const initialState: ChannelsState = {
  channels: [],
};

// Reducer
function channelsReducer(
  state: ChannelsState,
  action: ChannelsAction
): ChannelsState {
  switch (action.type) {
    case 'ADD_CHANNEL':
      return {
        ...state,
        channels: [...state.channels, action.payload],
      };

    case 'REMOVE_CHANNEL':
      return {
        ...state,
        channels: state.channels.filter(
          (channel) => channel.id !== action.payload
        ),
      };

    case 'UPDATE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map((channel) =>
          channel.id === action.payload.id
            ? { ...channel, ...action.payload.updates }
            : channel
        ),
      };

    case 'LOAD_CHANNELS':
      return {
        ...state,
        channels: action.payload,
      };

    default:
      return state;
  }
}

// Context の型定義
type ChannelsContextType = {
  state: ChannelsState;
  dispatch: React.Dispatch<ChannelsAction>;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
};

// Context 作成
const ChannelsContext = createContext<ChannelsContextType | undefined>(
  undefined
);

// Provider Props
type ChannelsProviderProps = {
  children: ReactNode;
};

// Provider コンポーネント
export function ChannelsProvider({ children }: ChannelsProviderProps) {
  const [state, dispatch] = useReducer(channelsReducer, initialState);

  // 初期ロード: localStorage からチャンネル情報を復元
  useEffect(() => {
    const savedChannels = localStorage.getItem(STORAGE_KEY);
    if (savedChannels) {
      try {
        const channels = JSON.parse(savedChannels) as Channel[];
        dispatch({ type: 'LOAD_CHANNELS', payload: channels });
      } catch (error) {
        console.error('Failed to load channels from localStorage:', error);
      }
    }
  }, []);

  // チャンネル状態が変更されたら localStorage に保存
  useEffect(() => {
    if (state.channels.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.channels));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.channels]);

  // ヘルパー関数
  const addChannel = (channel: Channel) => {
    dispatch({ type: 'ADD_CHANNEL', payload: channel });
  };

  const removeChannel = (id: string) => {
    dispatch({ type: 'REMOVE_CHANNEL', payload: id });
  };

  const updateChannel = (id: string, updates: Partial<Channel>) => {
    dispatch({ type: 'UPDATE_CHANNEL', payload: { id, updates } });
  };

  const value: ChannelsContextType = {
    state,
    dispatch,
    addChannel,
    removeChannel,
    updateChannel,
  };

  return (
    <ChannelsContext.Provider value={value}>
      {children}
    </ChannelsContext.Provider>
  );
}

// Custom Hook
export function useChannels() {
  const context = useContext(ChannelsContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelsProvider');
  }
  return context;
}
