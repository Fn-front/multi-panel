import { useCallback } from 'react';

type UseEventStylesOptions = {
  channelColorMap: Record<string, string>;
};

/**
 * カレンダーイベントのスタイル（色）を管理するフック
 */
export function useEventStyles({ channelColorMap }: UseEventStylesOptions) {
  const getEventClassNames = useCallback(
    (info: {
      event: { extendedProps?: { channelId?: string; eventType?: string } };
    }) => {
      const channelId = info.event.extendedProps?.channelId;
      const eventType = info.event.extendedProps?.eventType || 'upcoming';

      // チャンネルに色が設定されている場合は、カスタム色クラスを返す
      if (channelId && channelColorMap[channelId]) {
        return ['event-custom-color'];
      }

      // デフォルトの色クラス
      return [`event-${eventType}`];
    },
    [channelColorMap],
  );

  return { getEventClassNames };
}
