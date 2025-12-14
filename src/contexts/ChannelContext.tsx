'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import type { Channel, ChannelsState, ChannelsAction } from '@/types/channel';
import { STORAGE_KEYS } from '@/constants';
import { loadFromStorage, saveArrayToStorage } from '@/utils/storage';

// 初期状態
const initialState: ChannelsState = {
  channels: [],
};

// Reducer
function channelsReducer(
  state: ChannelsState,
  action: ChannelsAction,
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
          (channel) => channel.id !== action.payload,
        ),
      };

    case 'UPDATE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map((channel) =>
          channel.id === action.payload.id
            ? { ...channel, ...action.payload.updates }
            : channel,
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

// Context
interface ChannelContextType {
  state: ChannelsState;
  dispatch: React.Dispatch<ChannelsAction>;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  updateChannel: (id: string, updates: Partial<Channel>) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

// Provider
interface ChannelProviderProps {
  children: ReactNode;
}

export function ChannelProvider({ children }: ChannelProviderProps) {
  const [state, dispatch] = useReducer(channelsReducer, initialState);

  // localStorageから読み込み
  useEffect(() => {
    const savedChannels = loadFromStorage<Channel[]>(STORAGE_KEYS.CHANNELS, []);
    if (savedChannels && savedChannels.length > 0) {
      dispatch({ type: 'LOAD_CHANNELS', payload: savedChannels });
    }
  }, []);

  // localStorageへ保存
  useEffect(() => {
    saveArrayToStorage(STORAGE_KEYS.CHANNELS, state.channels);
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

  const value: ChannelContextType = {
    state,
    dispatch,
    addChannel,
    removeChannel,
    updateChannel,
  };

  return (
    <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
  );
}

// Hook
export function useChannels() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
}
