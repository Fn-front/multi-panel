import { useState, useEffect, useCallback } from 'react';

/**
 * タイムアウト状態を管理するフック
 * グローバルに共有するためにシングルトンパターンを使用
 */
let hasTimeoutGlobal = false;
const listeners = new Set<(value: boolean) => void>();

export function useTimeout() {
  const [hasTimeout, setHasTimeoutLocal] = useState(hasTimeoutGlobal);

  const setHasTimeout = useCallback((value: boolean) => {
    hasTimeoutGlobal = value;
    listeners.forEach((listener) => listener(value));
  }, []);

  // リスナーの登録・解除
  useEffect(() => {
    const updateState = (value: boolean) => {
      setHasTimeoutLocal(value);
    };
    listeners.add(updateState);
    return () => {
      listeners.delete(updateState);
    };
  }, []);

  return { hasTimeout, setHasTimeout };
}
