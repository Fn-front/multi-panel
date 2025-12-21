import { useCallback } from 'react';

/**
 * カレンダーイベントのスタイル（色）を管理するフック
 */
export function useEventStyles() {
  const getEventClassNames = useCallback(
    (info: { event: { extendedProps?: { eventType?: string } } }) => {
      const eventType = info.event.extendedProps?.eventType || 'upcoming';
      return [`event-${eventType}`];
    },
    [],
  );

  return { getEventClassNames };
}
