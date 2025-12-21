import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
      console.error('ログアウトに失敗しました:', error);
      alert('ログアウトに失敗しました。');
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
