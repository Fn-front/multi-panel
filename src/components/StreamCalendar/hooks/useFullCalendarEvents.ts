import { useMemo } from 'react';
import type { CalendarEvent } from '@/types/youtube';

/**
 * CalendarEventをFullCalendar用のイベントデータに変換するフック
 */
export function useFullCalendarEvents(events: CalendarEvent[]) {
  const fullCalendarEvents = useMemo(
    () =>
      events.map((event) => ({
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
      })),
    [events],
  );

  return fullCalendarEvents;
}
