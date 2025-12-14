'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
} from 'react';
import type { Channel, ChannelsState, ChannelsAction } from '@/types/channel';
import { STORAGE_KEYS } from '@/constants';
import { loadFromStorage, saveArrayToStorage } from '@/utils/storage';
import { formatDate, getCurrentMonthRange } from '@/utils/date';
import { callSupabaseFunction } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// DB型からChannel型への変換
const mapDbToChannel = (dbChannel: {
  id: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
}): Channel => ({
  id: dbChannel.id,
  channelId: dbChannel.channel_id,
  name: dbChannel.channel_title,
  thumbnail: dbChannel.channel_thumbnail || undefined,
});

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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // 初期データ読み込み（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    const loadChannels = async () => {
      setIsLoading(true);

      if (user) {
        // ログイン時: Supabaseから読み込み
        try {
          const { data, error } = await supabase
            .from('favorite_channels')
            .select('*')
            .order('added_at', { ascending: true });

          if (error) throw error;

          if (data) {
            const channels = data.map(mapDbToChannel);
            dispatch({ type: 'LOAD_CHANNELS', payload: channels });
          }
        } catch (error) {
          console.error('Failed to load channels from Supabase:', error);
        }
      } else {
        // 未ログイン時: localStorageから読み込み
        const savedChannels = loadFromStorage<Channel[]>(
          STORAGE_KEYS.CHANNELS,
          [],
        );
        if (savedChannels?.length) {
          dispatch({ type: 'LOAD_CHANNELS', payload: savedChannels });
        }
      }

      setIsLoading(false);
    };

    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // データ保存（ログイン時: Supabase, 未ログイン時: localStorage）
  useEffect(() => {
    if (isLoading) return; // 初期ロード中は保存しない

    if (user) {
      // Supabaseへの保存は個別の操作関数内で行う（addChannel, removeChannel等）
      // ここでは何もしない
    } else {
      // 未ログイン時: localStorageへ保存
      saveArrayToStorage(STORAGE_KEYS.CHANNELS, state.channels);
    }
  }, [state.channels, user, isLoading]);

  // ヘルパー関数
  const addChannel = async (channel: Channel) => {
    if (user) {
      // ログイン時: Supabaseに追加
      try {
        const { data, error } = await supabase
          .from('favorite_channels')
          .insert({
            user_id: user.id,
            channel_id: channel.channelId,
            channel_title: channel.name,
            channel_thumbnail: channel.thumbnail || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          dispatch({ type: 'ADD_CHANNEL', payload: mapDbToChannel(data) });
          await fetchCurrentMonthStreams(channel.channelId);
        }
      } catch (error) {
        console.error('Failed to add channel to Supabase:', error);
      }
    } else {
      // 未ログイン時: ローカルのみ
      dispatch({ type: 'ADD_CHANNEL', payload: channel });
    }
  };

  // 現在月の1ヶ月分の配信を取得
  const fetchCurrentMonthStreams = async (channelId: string) => {
    try {
      const { startDate, endDate } = getCurrentMonthRange();

      const result = await callSupabaseFunction('fetch-past-streams', {
        channelId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });

      console.log(
        `[ChannelContext] Fetched current month streams for ${channelId}:`,
        result,
      );
    } catch (error) {
      console.error('Failed to fetch current month streams:', error);
    }
  };

  const removeChannel = async (id: string) => {
    if (user) {
      // ログイン時: Supabaseから削除
      try {
        const { error } = await supabase
          .from('favorite_channels')
          .delete()
          .eq('id', id);

        if (error) throw error;

        dispatch({ type: 'REMOVE_CHANNEL', payload: id });
      } catch (error) {
        console.error('Failed to remove channel from Supabase:', error);
      }
    } else {
      // 未ログイン時: ローカルのみ
      dispatch({ type: 'REMOVE_CHANNEL', payload: id });
    }
  };

  const updateChannel = async (id: string, updates: Partial<Channel>) => {
    if (user) {
      // ログイン時: Supabaseを更新
      try {
        const updateData: Record<string, unknown> = {};
        if (updates.channelId) updateData.channel_id = updates.channelId;
        if (updates.name) updateData.channel_title = updates.name;
        if (updates.thumbnail !== undefined)
          updateData.channel_thumbnail = updates.thumbnail || null;

        const { error } = await supabase
          .from('favorite_channels')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        dispatch({ type: 'UPDATE_CHANNEL', payload: { id, updates } });
      } catch (error) {
        console.error('Failed to update channel in Supabase:', error);
      }
    } else {
      // 未ログイン時: ローカルのみ
      dispatch({ type: 'UPDATE_CHANNEL', payload: { id, updates } });
    }
  };

  const value: ChannelContextType = {
    state,
    dispatch,
    isLoading,
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
