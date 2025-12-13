'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/youtube';
import { getMultipleChannelsSchedule } from '@/lib/youtube-api';
import styles from './StreamCalendar.module.scss';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// date-fns のローカライザー設定
const locales = {
  ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ja }),
  getDay,
  locales,
});

interface StreamCalendarProps {
  /** お気に入りチャンネルIDのリスト */
  channelIds: string[];
  /** イベントクリック時のコールバック */
  onEventClick?: (event: CalendarEvent) => void;
  /** 自動更新間隔（ミリ秒）デフォルト: 5分 */
  refreshInterval?: number;
}

export default function StreamCalendar({
  channelIds,
  onEventClick,
  refreshInterval = 5 * 60 * 1000,
}: StreamCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(Views.MONTH);

  // スケジュール取得
  const fetchSchedule = useCallback(async () => {
    if (channelIds.length === 0) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const scheduleMap = await getMultipleChannelsSchedule(channelIds);

      const calendarEvents: CalendarEvent[] = [];

      scheduleMap.forEach((videos) => {
        videos.forEach((video) => {
          if (!video.scheduledStartTime) return;

          const startDate = new Date(video.scheduledStartTime);
          // 終了時刻は開始時刻+2時間と仮定（実際の終了時刻がない場合）
          const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

          calendarEvents.push({
            id: video.id,
            title: video.title,
            start: startDate,
            end: endDate,
            eventType:
              video.liveBroadcastContent === 'live'
                ? 'live'
                : video.liveBroadcastContent === 'upcoming'
                  ? 'upcoming'
                  : 'video',
            url: `https://www.youtube.com/watch?v=${video.id}`,
            channelName: video.channelName,
          });
        });
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [channelIds]);

  // 初回読み込みと定期更新
  useEffect(() => {
    fetchSchedule();

    const interval = setInterval(fetchSchedule, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchSchedule, refreshInterval]);

  // イベントスタイルのカスタマイズ
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const className = event.eventType;
    return {
      className,
    };
  }, []);

  // イベント選択時の処理
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onEventClick) {
        onEventClick(event);
      } else {
        // デフォルト動作: 新しいタブで開く
        window.open(event.url, '_blank', 'noopener,noreferrer');
      }
    },
    [onEventClick],
  );

  // メッセージのカスタマイズ
  const messages = useMemo(
    () => ({
      today: '今日',
      previous: '前へ',
      next: '次へ',
      month: '月',
      week: '週',
      day: '日',
      agenda: '予定',
      date: '日付',
      time: '時間',
      event: 'イベント',
      noEventsInRange: 'この期間にイベントはありません',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showMore: (total: any) => `+${total} 件`,
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>配信カレンダー</h2>
        </div>
        <div className={styles.loading}>スケジュールを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>配信カレンダー</h2>
        </div>
        <div className={styles.error}>
          <div className={styles.errorMessage}>{error}</div>
          <button onClick={fetchSchedule}>再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <h2>配信カレンダー</h2>
        <div className={styles.controls}>
          <button
            className={view === Views.MONTH ? styles.active : ''}
            onClick={() => setView(Views.MONTH)}
            type='button'
          >
            月
          </button>
          <button
            className={view === Views.WEEK ? styles.active : ''}
            onClick={() => setView(Views.WEEK)}
            type='button'
          >
            週
          </button>
          <button
            className={view === Views.DAY ? styles.active : ''}
            onClick={() => setView(Views.DAY)}
            type='button'
          >
            日
          </button>
        </div>
      </div>
      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          startAccessor='start'
          endAccessor='end'
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          messages={messages}
          culture='ja'
        />
      </div>
    </div>
  );
}
