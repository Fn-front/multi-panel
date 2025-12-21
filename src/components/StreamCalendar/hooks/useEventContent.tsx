import { useCallback } from 'react';
import Image from 'next/image';

/**
 * カレンダーイベントコンテンツのレンダリングを管理するフック
 */
export function useEventContent() {
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
            <Image
              src={channelThumbnail}
              alt='Channel'
              width={15}
              height={15}
              unoptimized
              style={
                isMonthView
                  ? {
                      borderRadius: '50%',
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      marginRight: '4px',
                      objectFit: 'cover',
                    }
                  : {
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
          {timeDisplay && <div className='fc-event-time'>{timeDisplay}</div>}
          <div className='fc-event-title'>
            <span>{eventInfo.event.title}</span>
          </div>
        </>
      );
    },
    [],
  );

  return { renderEventContent };
}
