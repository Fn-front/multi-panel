import { useMemo } from 'react';
import type { CalendarEvent } from '@/types/youtube';

/**
 * CalendarEventをFullCalendar形式に変換するフック
 */
export function useCalendarEvents(events: CalendarEvent[]) {
  const calendarEvents = useMemo(
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

  return calendarEvents;
}
