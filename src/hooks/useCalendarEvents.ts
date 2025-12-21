import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UI_TEXT } from '@/constants';
import type { CalendarEvent } from '@/types/youtube';

// モックデータ生成（開発用）
const generateMockEvents = (): CalendarEvent[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      id: 'mock-1',
      title: '【生配信】朝の雑談配信',
      start: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
      end: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
      eventType: 'upcoming',
      url: 'https://www.youtube.com/watch?v=mock1',
      channelName: 'テストチャンネル1',
    },
    {
      id: 'mock-2',
      title: '【ゲーム実況】新作ゲームをプレイ！',
      start: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 15:00
      end: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17:00
      eventType: 'live',
      url: 'https://www.youtube.com/watch?v=mock2',
      channelName: 'テストチャンネル2',
    },
    {
      id: 'mock-3',
      title: '【歌枠】夜の歌配信',
      start: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 20:00
      end: new Date(today.getTime() + 22 * 60 * 60 * 1000), // 22:00
      eventType: 'upcoming',
      url: 'https://www.youtube.com/watch?v=mock3',
      channelName: 'テストチャンネル3',
    },
    {
      id: 'mock-4',
      title: '【雑談】お昼の配信',
      start: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00
      end: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 13:00
      eventType: 'upcoming',
      url: 'https://www.youtube.com/watch?v=mock4',
      channelName: 'テストチャンネル4',
    },
    {
      id: 'mock-5',
      title: '【お絵描き】イラスト配信',
      start: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18:00
      end: new Date(today.getTime() + 20 * 60 * 60 * 1000), // 20:00
      eventType: 'live',
      url: 'https://www.youtube.com/watch?v=mock5',
      channelName: 'テストチャンネル5',
    },
  ];
};

type UseCalendarEventsOptions = {
  channelIds: string[];
  refreshInterval?: number;
};

export function useCalendarEvents({
  channelIds,
  refreshInterval = 5 * 60 * 1000,
}: UseCalendarEventsOptions) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSchedule = useCallback(async () => {
    if (!user) {
      // 未ログイン時: モックデータを表示
      setEvents(generateMockEvents());
      setIsLoading(false);
      return;
    }

    if (channelIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Supabaseからstream_eventsを取得
      // fetch-past-streamsで取得済みの過去月データも含めて全て表示
      const { data, error: supabaseError } = await supabase
        .from('stream_events')
        .select('*')
        .in('channel_id', channelIds)
        .order('scheduled_start_time', { ascending: true });

      if (supabaseError) throw supabaseError;

      const calendarEvents: CalendarEvent[] = [];

      if (data) {
        data.forEach((event) => {
          if (!event.scheduled_start_time) return;

          const startDate = new Date(event.scheduled_start_time);
          // 終了時刻: actual_end_time があればそれを使用、なければ開始時刻+2時間
          const endDate = event.actual_end_time
            ? new Date(event.actual_end_time)
            : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

          calendarEvents.push({
            id: event.video_id,
            title: event.title,
            start: startDate,
            end: endDate,
            eventType:
              event.live_broadcast_content === 'live'
                ? 'live'
                : event.live_broadcast_content === 'upcoming'
                  ? 'upcoming'
                  : 'video',
            url: `https://www.youtube.com/watch?v=${event.video_id}`,
            channelName: event.channel_title,
            channelThumbnail: event.channel_thumbnail || undefined,
          });
        });
      }

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch schedule from Supabase:', err);
      setError(
        err instanceof Error ? err.message : UI_TEXT.CALENDAR.FETCH_ERROR,
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelIds, user]);

  // 初回読み込みと定期更新
  useEffect(() => {
    fetchSchedule();

    const interval = setInterval(fetchSchedule, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchSchedule, refreshInterval]);

  return {
    events,
    isLoading,
    error,
    fetchSchedule,
  };
}
