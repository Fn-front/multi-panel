'use client';

import { useCallback, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import type { CalendarEvent } from '@/types/youtube';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from './StreamCalendar.module.scss';
import './fullcalendar-custom.css';

interface StreamCalendarProps {
  /** お気に入りチャンネルIDのリスト */
  channelIds: string[];
  /** イベントクリック時のコールバック */
  onEventClick?: (event: CalendarEvent) => void;
  /** 自動更新間隔（ミリ秒）デフォルト: 5分 */
  refreshInterval?: number;
}

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

export default function StreamCalendar({
  channelIds,
  onEventClick,
  refreshInterval = 5 * 60 * 1000,
}: StreamCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const { user } = useAuth();

  // スケジュール取得
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
      const { data, error: supabaseError } = await supabase
        .from('stream_events')
        .select('*')
        .in('channel_id', channelIds)
        .gte(
          'scheduled_start_time',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ) // 過去7日間
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
          });
        });
      }

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch schedule from Supabase:', err);
      setError(
        err instanceof Error ? err.message : 'スケジュールの取得に失敗しました',
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

  // カレンダーマウント後に現在時刻までスクロール
  useEffect(() => {
    if (!isLoading && events.length > 0) {
      const timer = setTimeout(() => {
        const scrollableElement = document.querySelector(
          '.fc-scroller-liquid-absolute',
        );
        if (scrollableElement) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          // 1時間あたりのピクセル数（FullCalendarのデフォルトは約50px）
          const pixelsPerHour = 50;
          const currentTimePosition =
            (currentHour + currentMinute / 60) * pixelsPerHour;

          // ビューポートの高さの半分を引いて、現在時刻が中央に来るようにする
          const viewportHeight = scrollableElement.clientHeight;
          const scrollPosition = currentTimePosition - viewportHeight / 2;

          scrollableElement.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, events]);

  // イベントクリック時の処理
  const handleEventClick = useCallback(
    (info: { event: { id: string } }) => {
      const event = events.find((e) => e.id === info.event.id);
      if (!event) return;

      if (onEventClick) {
        onEventClick(event);
      } else {
        // デフォルト動作: 新しいタブで開く
        window.open(event.url, '_blank', 'noopener,noreferrer');
      }
    },
    [events, onEventClick],
  );

  // イベントの色設定
  const getEventClassNames = useCallback(
    (info: { event: { extendedProps?: { eventType?: string } } }) => {
      const event = info.event;
      const eventType = event.extendedProps?.eventType || 'upcoming';
      return [`event-${eventType}`];
    },
    [],
  );

  // イベントコンテンツのカスタマイズ
  const renderEventContent = useCallback(
    (eventInfo: { event: { title: string }; view: { type: string } }) => {
      const isMonthView = eventInfo.view.type === 'dayGridMonth';

      return (
        <>
          <svg
            width='15'
            height='15'
            viewBox='0 0 12 12'
            style={
              isMonthView
                ? {
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    marginRight: '4px',
                  }
                : {
                    position: 'absolute',
                    top: '-7.5px',
                    left: '-7.5px',
                    zIndex: 10,
                  }
            }
          >
            <circle cx='6' cy='6' r='6' fill='#FF0000' />
            <path d='M5 3.5L5 8.5L8.5 6z' fill='white' />
          </svg>
          <div className='fc-event-time'>{eventInfo.timeText}</div>
          <div className='fc-event-title'>{eventInfo.event.title}</div>
        </>
      );
    },
    [],
  );

  if (isLoading) {
    return (
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>配信カレンダー</h2>
        </div>
        <div className={styles.loading}>
          <Skeleton height={36} />
          <Skeleton height={350} />
        </div>
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

  // FullCalendar用のイベントデータに変換
  const fullCalendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    extendedProps: {
      eventType: event.eventType,
      url: event.url,
      channelName: event.channelName,
    },
  }));

  return (
    <>
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>配信カレンダー</h2>
          <div className={styles.controls}>
            <button onClick={() => setShowMonthModal(true)} type='button'>
              月表示
            </button>
          </div>
        </div>
        <div className={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView='timeGridWeek'
            locale={jaLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            buttonText={{
              today: '今日',
              week: '週',
              day: '日',
            }}
            dayHeaderContent={(args) => {
              const date = args.date;
              const day = date.getDate();
              const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
              const weekday = weekdays[date.getDay()];
              return `${day}\n${weekday}`;
            }}
            events={fullCalendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            height='100%'
            slotMinTime='00:00:00'
            slotMaxTime='24:00:00'
            allDaySlot={false}
          />
        </div>
      </div>

      <Modal
        isOpen={showMonthModal}
        onClose={() => setShowMonthModal(false)}
        title='配信カレンダー（月表示）'
      >
        <div className={styles.modalCalendar}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            locale={jaLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            buttonText={{
              today: '今日',
            }}
            events={fullCalendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            height='100%'
            dayMaxEventRows={false}
          />
        </div>
      </Modal>
    </>
  );
}
