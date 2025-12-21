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
import { UI_TEXT, FULL_CALENDAR_CONFIG } from '@/constants';
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
          <h2>{UI_TEXT.CALENDAR.TITLE}</h2>
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
          <h2>{UI_TEXT.CALENDAR.TITLE}</h2>
        </div>
        <div className={styles.error}>
          <div className={styles.errorMessage}>{error}</div>
          {onRefresh && (
            <button onClick={onRefresh}>{UI_TEXT.CALENDAR.RELOAD}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.calendarContainer}>
        <div className={styles.header}>
          <h2>{UI_TEXT.CALENDAR.TITLE}</h2>
          <div className={styles.controls}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                type='button'
                disabled={isLoading}
                aria-label={UI_TEXT.CALENDAR.RELOAD}
              >
                <HiArrowPath />
              </button>
            )}
            <button onClick={open} type='button'>
              {UI_TEXT.CALENDAR.MONTH}
            </button>
          </div>
        </div>
        <div className={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={FULL_CALENDAR_CONFIG.INITIAL_VIEW}
            locale={jaLocale}
            headerToolbar={FULL_CALENDAR_CONFIG.HEADER_TOOLBAR_WEEK}
            buttonText={{
              today: UI_TEXT.CALENDAR.TODAY,
              week: UI_TEXT.CALENDAR.WEEK,
              day: UI_TEXT.CALENDAR.DAY,
            }}
            dayHeaderContent={(args) => {
              const date = args.date;
              const day = date.getDate();
              const weekday = UI_TEXT.WEEKDAYS[date.getDay()];
              return `${day}\n${weekday}`;
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height={FULL_CALENDAR_CONFIG.HEIGHT}
            slotMinTime={FULL_CALENDAR_CONFIG.SLOT_MIN_TIME}
            slotMaxTime={FULL_CALENDAR_CONFIG.SLOT_MAX_TIME}
            allDaySlot={FULL_CALENDAR_CONFIG.ALL_DAY_SLOT}
          />
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title={UI_TEXT.CALENDAR.MONTH_VIEW_TITLE}
      >
        <div className={styles.modalCalendar}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            locale={jaLocale}
            headerToolbar={FULL_CALENDAR_CONFIG.HEADER_TOOLBAR_MONTH}
            buttonText={{
              today: UI_TEXT.CALENDAR.TODAY,
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            eventContent={renderEventContent}
            datesSet={handleDatesSet}
            height={FULL_CALENDAR_CONFIG.HEIGHT}
            dayMaxEventRows={FULL_CALENDAR_CONFIG.DAY_MAX_EVENT_ROWS}
          />
        </div>
      </Modal>
    </>
  );
}
