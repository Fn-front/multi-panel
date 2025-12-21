import { useCallback } from 'react';

/**
 * カレンダーイベントの色設定を管理するフック
 */
export function useEventClassNames() {
  const getEventClassNames = useCallback(
    (info: { event: { extendedProps?: { eventType?: string } } }) => {
      const event = info.event;
      const eventType = event.extendedProps?.eventType || 'upcoming';
      return [`event-${eventType}`];
    },
    [],
  );

  return { getEventClassNames };
}
