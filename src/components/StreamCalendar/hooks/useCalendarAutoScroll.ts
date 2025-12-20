import { useEffect } from 'react';

interface UseCalendarAutoScrollProps {
  isLoading: boolean;
  eventsCount: number;
}

/**
 * カレンダーの自動スクロール機能
 * マウント後に現在時刻の位置までスクロール
 */
export function useCalendarAutoScroll({
  isLoading,
  eventsCount,
}: UseCalendarAutoScrollProps) {
  useEffect(() => {
    if (!isLoading && eventsCount > 0) {
      const timer = setTimeout(() => {
        const scrollableElement = document.querySelector(
          '.fc-scroller-liquid-absolute',
        );
        if (scrollableElement) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          // 1時間あたりのピクセル数（FullCalendarのデフォルトは約50px）
          const pixelsPerHour = 50;
          const currentTimePosition =
            (currentHour + currentMinute / 60) * pixelsPerHour;

          // ビューポートの高さの半分を引いて、現在時刻が中央に来るようにする
          const viewportHeight = scrollableElement.clientHeight;
          const scrollPosition = currentTimePosition - viewportHeight / 2;

          scrollableElement.scrollTop = Math.max(0, scrollPosition);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, eventsCount]);
}
