import { useState, useCallback } from 'react';

/**
 * 月表示モーダルの状態を管理するフック
 */
export function useMonthView() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, open, close };
}
