import { useState, useEffect } from 'react';

/**
 * クライアントサイドでのマウント状態を管理するフック
 *
 * SSR時とクライアント時の不一致を防ぐため、
 * クライアントサイドでマウントされたかを追跡
 */
export function useClientMount() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
