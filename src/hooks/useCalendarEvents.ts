import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UI_TEXT } from '@/constants';
import { callSupabaseFunction } from '@/utils/supabase';
import type { CalendarEvent } from '@/types/youtube';

type UseCalendarEventsOptions = {
  channelIds: string[];
};

export function useCalendarEvents({ channelIds }: UseCalendarEventsOptions) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSchedule = useCallback(async () => {
    if (!user || channelIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Supabaseからstream_eventsを取得（タイムアウトなし）
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
          const isLive = event.live_broadcast_content === 'live';

          // 終了時刻の決定:
          // - actual_end_timeがあればそれを使用
          // - 配信中(live)の場合は現在時刻
          // - それ以外は開始時刻+2時間
          let endDate: Date;
          if (event.actual_end_time) {
            endDate = new Date(event.actual_end_time);
          } else if (isLive) {
            endDate = new Date(); // 現在時刻
          } else {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
          }

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
            channelId: event.channel_id,
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

  // 更新ボタン用: 配信予定・配信中のみ更新（過去のアーカイブは更新しない）
  const refreshSchedule = useCallback(async () => {
    if (!user || channelIds.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // fetch-channel-streamsで配信予定・配信中を更新
      await callSupabaseFunction('fetch-channel-streams', {});

      // データ取得後、Supabaseから最新データを読み込み
      await fetchSchedule();
    } catch (err) {
      console.error('Failed to refresh schedule:', err);
      setError(
        err instanceof Error ? err.message : UI_TEXT.CALENDAR.FETCH_ERROR,
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, channelIds, fetchSchedule]);

  // 初回読み込みのみ
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    events,
    isLoading,
    error,
    fetchSchedule,
    refreshSchedule,
  };
}
