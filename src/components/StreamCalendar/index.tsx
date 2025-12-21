'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import { HiArrowPath } from 'react-icons/hi2';
import type { CalendarEvent } from '@/types/youtube';
import { Modal } from '@/components/Modal';
import { Skeleton } from '@/components/Skeleton';
import { useCalendarAutoScroll } from './hooks/useCalendarAutoScroll';
import { useInitialMountSkip } from './hooks/useInitialMountSkip';
import { useEventHandler } from './hooks/useEventHandler';
import { useEventStyles } from './hooks/useEventStyles';
import { useEventRenderer } from './hooks/useEventRenderer';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useMonthView } from './hooks/useMonthView';
import styles from './StreamCalendar.module.scss';
import './fullcalendar-custom.css';

interface StreamCalendarProps {
  /** イベントクリック時のコールバック */
  onEventClick?: (event: CalendarEvent) => void;
  /** カレンダーイベント（外部から渡される） */
  events: CalendarEvent[];
  /** ローディング状態（外部から渡される） */
  isLoading: boolean;
  /** エラーメッセージ（外部から渡される） */
  error: string | null;
  /** 再読み込み用コールバック */
  onRefresh?: () => void;
  /** カレンダー月変更時のコールバック */
  onDatesSet?: (dateInfo: {
    start: Date;
    end: Date;
    view: { type: string };
  }) => void;
}

export default function StreamCalendar({
  onEventClick,
  events,
  isLoading,
  error,
  onRefresh,
  onDatesSet,
}: StreamCalendarProps) {
  // カレンダーマウント後に現在時刻までスクロール
  useCalendarAutoScroll({
    isLoading,
    eventsCount: events.length,
  });

  // イベントクリック処理
  const { handleEventClick } = useEventHandler({ events, onEventClick });

  // イベントスタイル（色）設定
  const { getEventClassNames } = useEventStyles();

  // イベント表示内容のレンダリング
  const { renderEventContent } = useEventRenderer();

  // FullCalendar形式のイベントデータ
  const calendarEvents = useCalendarEvents(events);

  // 月表示モーダル管理
  const { isOpen, open, close } = useMonthView();

  // datesSetイベントのラッパー（初回マウント時はスキップ）
  const handleDatesSet = useInitialMountSkip(onDatesSet);

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
          {onRefresh && <button onClick={onRefresh}>再読み込み</button>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>配信カレンダー</h2>
          <div className={styles.controls}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                type='button'
                disabled={isLoading}
                aria-label='更新'
              >
                <HiArrowPath />
              </button>
            )}
            <button onClick={open} type='button'>
              月
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
            events={calendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height='100%'
            slotMinTime='00:00:00'
            slotMaxTime='24:00:00'
            allDaySlot={false}
          />
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={close}
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
            events={calendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height='100%'
            dayMaxEventRows={false}
          />
        </div>
      </Modal>
    </>
  );
}
