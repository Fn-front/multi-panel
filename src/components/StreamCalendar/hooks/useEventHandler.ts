import { useCallback } from 'react';
import type { CalendarEvent } from '@/types/youtube';

type UseEventHandlerOptions = {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
};

/**
 * カレンダーイベントクリック処理を管理するフック
 */
export function useEventHandler({ events, onEventClick }: UseEventHandlerOptions) {
  const handleEventClick = useCallback(
    (info: { event: { id: string }; jsEvent: Event }) => {
      info.jsEvent.preventDefault();

      const event = events.find((e) => e.id === info.event.id);
      if (!event) return;

      if (onEventClick) {
        onEventClick(event);
      } else {
        window.open(event.url, '_blank', 'noopener,noreferrer');
      }
    },
    [events, onEventClick],
  );

  return { handleEventClick };
}
