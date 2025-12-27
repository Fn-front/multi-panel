import { useState, useCallback } from 'react';

/**
 * 設定モーダルの状態管理フック
 */
export function useSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isSettingsModalOpen: isOpen,
    openSettingsModal: openModal,
    closeSettingsModal: closeModal,
  };
}
