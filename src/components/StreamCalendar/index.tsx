'use client';

import { useCallback, useState } from 'react';
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
  const [showMonthModal, setShowMonthModal] = useState(false);

  // カレンダーマウント後に現在時刻までスクロール
  useCalendarAutoScroll({
    isLoading,
    eventsCount: events.length,
  });

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
  const getEventClassNames = (info: {
    event: { extendedProps?: { eventType?: string } };
  }) => {
    const event = info.event;
    const eventType = event.extendedProps?.eventType || 'upcoming';
    return [`event-${eventType}`];
  };

  // datesSetイベントのラッパー（初回マウント時はスキップ）
  const handleDatesSet = useInitialMountSkip(onDatesSet);

  // イベントコンテンツのカスタマイズ
  const renderEventContent = useCallback(
    (eventInfo: {
      event: {
        title: string;
        start: Date | null;
        end: Date | null;
        allDay?: boolean;
        extendedProps?: { channelThumbnail?: string };
      };
      timeText: string;
      view: { type: string };
    }) => {
      const isMonthView = eventInfo.view.type === 'dayGridMonth';
      const channelThumbnail = eventInfo.event.extendedProps?.channelThumbnail;
      const isMultiDay =
        eventInfo.event.allDay ||
        (eventInfo.event.start &&
          eventInfo.event.end &&
          new Date(eventInfo.event.start).toDateString() !==
            new Date(eventInfo.event.end).toDateString());

      // 時刻のフォーマット
      const formatTime = (date: Date | null) => {
        if (!date) return '';
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
      };

      // 月表示で日をまたぐイベントの場合は「開始時 〜 終了時」表示
      // それ以外は開始時のみ表示
      const timeDisplay =
        isMonthView && isMultiDay
          ? `${formatTime(eventInfo.event.start)} 〜 ${formatTime(eventInfo.event.end)}`
          : formatTime(eventInfo.event.start);

      return (
        <>
          {channelThumbnail ? (
            <img
              src={channelThumbnail}
              alt='Channel'
              style={
                isMonthView
                  ? {
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: '4px',
                      objectFit: 'cover',
                    }
                  : {
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '-7.5px',
                      left: '-7.5px',
                      zIndex: 10,
                      objectFit: 'cover',
                    }
              }
            />
          ) : (
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
          )}
          {timeDisplay && (
            <div className='fc-event-time'>{timeDisplay}</div>
          )}
          <div className='fc-event-title'>
            <span>{eventInfo.event.title}</span>
          </div>
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
          {onRefresh && <button onClick={onRefresh}>再読み込み</button>}
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
      channelThumbnail: event.channelThumbnail,
    },
  }));

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
            <button onClick={() => setShowMonthModal(true)} type='button'>
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
            events={fullCalendarEvents}
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
            datesSet={handleDatesSet}
            height='100%'
            dayMaxEventRows={false}
          />
        </div>
      </Modal>
    </>
  );
}
