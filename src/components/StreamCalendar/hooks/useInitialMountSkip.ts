import { useCallback, useRef } from 'react';

/**
 * 初回マウント時のイベントをスキップするフック
 * FullCalendarのdatesSetイベントが初回マウント時に発火するのを防ぐ
 */
export function useInitialMountSkip<
  T extends (...args: never[]) => unknown = (...args: never[]) => void,
>(callback?: T) {
  const isInitialMountRef = useRef(true);

  const wrappedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
      }

      if (callback) {
        return callback(...args);
      }
    },
    [callback],
  );

  return wrappedCallback;
}
