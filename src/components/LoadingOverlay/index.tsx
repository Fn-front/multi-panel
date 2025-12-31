'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTimeout } from '@/hooks/useTimeout';
import { Spinner } from '@/components/Spinner';
import styles from './LoadingOverlay.module.scss';

/**
 * ローディングオーバーレイコンポーネント
 * 認証処理中にページ全体にオーバーレイを表示
 */
export function LoadingOverlay() {
  const { isLoading } = useAuth();
  const { hasTimeout } = useTimeout();

  if (!isLoading) return null;

  return (
    <div className={styles['loading-overlay']}>
      <Spinner size={50} />
      <div className={styles['loading-overlay__text']}>読み込み中...</div>
      {hasTimeout && (
        <button
          onClick={() => window.location.reload()}
          className={styles['loading-overlay__reload-button']}
        >
          ページをリロード
        </button>
      )}
    </div>
  );
}
