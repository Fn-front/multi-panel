import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UI_TEXT } from '@/constants';
import { formatDate, getCurrentMonthRange } from '@/utils/date';
import { callSupabaseFunction, withTimeout } from '@/utils/supabase';
import type { CalendarEvent } from '@/types/youtube';
import { useTimeout } from '@/hooks/useTimeout';

type UseCalendarEventsOptions = {
  channelIds: string[];
};

export function useCalendarEvents({
  channelIds,
}: UseCalendarEventsOptions) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { setHasTimeout } = useTimeout();

  const fetchSchedule = useCallback(async () => {
    if (!user || channelIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Supabaseからstream_eventsを取得（30秒タイムアウト）
      // fetch-past-streamsで取得済みの過去月データも含めて全て表示
      const { data, error: supabaseError } = await withTimeout(
        supabase
          .from('stream_events')
          .select('*')
          .in('channel_id', channelIds)
          .order('scheduled_start_time', { ascending: true }),
        30000,
        'Stream events fetch timeout',
      ).catch((err) => {
        console.error('stream_events timeout:', err);
        setHasTimeout(true);
        return { data: null, error: err };
      });

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

  // 更新ボタン用: YouTubeから現在月のデータを取得してからfetchScheduleを実行
  const refreshSchedule = useCallback(async () => {
    if (!user || channelIds.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { startDate, endDate } = getCurrentMonthRange();

      await callSupabaseFunction('fetch-past-streams', {
        channelIds,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });

      // データ取得後、Supabaseから最新データを読み込み
      await fetchSchedule();
    } catch (err) {
      console.error('Failed to refresh schedule:', err);
      setError(
        err instanceof Error ? err.message : UI_TEXT.CALENDAR.FETCH_ERROR,
      );
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
