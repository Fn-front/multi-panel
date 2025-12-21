import { useState, useCallback } from 'react';

/**
 * 月表示モーダルの開閉を管理するフック
 */
export function useMonthModal() {
  const [showMonthModal, setShowMonthModal] = useState(false);

  const openMonthModal = useCallback(() => {
    setShowMonthModal(true);
  }, []);

  const closeMonthModal = useCallback(() => {
    setShowMonthModal(false);
  }, []);

  return {
    showMonthModal,
    openMonthModal,
    closeMonthModal,
  };
}
