import { useCallback } from 'react';
import type { CalendarEvent } from '@/types/youtube';
import type { Panel } from '@/types/panel';
import { isMobileDevice } from '@/utils/device';

type UseCalendarEventHandlerOptions = {
  onAddPanel: (panel: Panel) => void;
  onCloseSidebar?: () => void;
};

/**
 * カレンダーイベントクリック時の処理を管理するフック
 *
 * イベントをクリックすると新しいパネルを追加
 * モバイルではサイドバーを閉じる
 */
export function useCalendarEventHandler({
  onAddPanel,
  onCloseSidebar,
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

      // モバイルでサイドバーを閉じる
      if (onCloseSidebar && isMobileDevice()) {
        onCloseSidebar();
      }
    },
    [onAddPanel, onCloseSidebar],
  );

  return { handleEventClick };
}
