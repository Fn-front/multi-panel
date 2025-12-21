import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UI_TEXT } from '@/constants';

/**
 * 認証関連のハンドラを管理するフック
 *
 * - ログインモーダルの開閉
 * - ログアウト処理
 */
export function useAuthHandlers() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(UI_TEXT.AUTH.LOGIN_FAILED, error);
      alert(UI_TEXT.AUTH.LOGIN_FAILED);
    }
  }, [signOut]);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  return {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    handleLogout,
  };
}
