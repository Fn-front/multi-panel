import { useState, useCallback } from 'react';

/**
 * サイドバーの表示状態を管理するフック
 *
 * - Cookie に状態を保存（1年間有効）
 */
export function useSidebar(initialVisible: boolean) {
  const [sidebarVisible, setSidebarVisible] = useState(initialVisible);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => {
      const newState = !prev;
      // Cookieに保存（1年間有効）
      document.cookie = `sidebar-visible=${newState}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return newState;
    });
  }, []);

  return { sidebarVisible, toggleSidebar };
}
