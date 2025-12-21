import { useCallback } from 'react';
import type { CalendarEvent } from '@/types/youtube';

type UseEventClickOptions = {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
};

/**
 * カレンダーイベントクリック処理を管理するフック
 */
export function useEventClick({ events, onEventClick }: UseEventClickOptions) {
  const handleEventClick = useCallback(
    (info: { event: { id: string }; jsEvent: Event }) => {
      // デフォルトのイベント動作をキャンセル
      info.jsEvent.preventDefault();

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

  return { handleEventClick };
}
