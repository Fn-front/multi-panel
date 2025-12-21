import { useCallback } from 'react';
import type { CalendarEvent } from '@/types/youtube';
import type { Panel } from '@/types/panel';

type UseCalendarEventHandlerOptions = {
  onAddPanel: (panel: Panel) => void;
};

/**
 * カレンダーイベントクリック時の処理を管理するフック
 *
 * イベントをクリックすると新しいパネルを追加
 */
export function useCalendarEventHandler({
  onAddPanel,
}: UseCalendarEventHandlerOptions) {
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      // 新しいパネルを追加
      const newPanel: Panel = {
        id: `panel-${Date.now()}`,
        url: event.url,
        volume: 0.5,
        isMuted: false,
        showChat: true,
        layout: {
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
      };
      onAddPanel(newPanel);
    },
    [onAddPanel],
  );

  return { handleEventClick };
}
