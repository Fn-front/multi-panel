'use client';

import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import styles from './ConnectionStatusIndicator.module.scss';

/**
 * 接続状態インジケーター
 *
 * Supabase接続プールの状態をユーザーに通知
 */
export function ConnectionStatusIndicator() {
  const {
    status,
    lastResponseTime,
    isColdStart,
    isRetrying,
    retryAttempt,
    retryMax,
  } = useConnectionStatus();

  // 初回読み込み中は表示しない
  if (status === 'unknown') return null;

  // リトライ中の表示を優先
  if (isRetrying) {
    return (
      <div className={styles.indicator} role='status' aria-live='polite'>
        <div className={styles.icon}>🔄</div>
        <div className={styles.message}>
          <strong>接続を再試行中</strong>
          <span className={styles.detail}>
            {retryAttempt}/{retryMax} 回目の試行...
          </span>
        </div>
      </div>
    );
  }

  // 接続が温かい場合は表示しない
  if (!isColdStart) return null;

  return (
    <div className={styles.indicator} role='status' aria-live='polite'>
      <div className={styles.icon}>⏳</div>
      <div className={styles.message}>
        <strong>接続プールがスリープ中</strong>
        <span className={styles.detail}>
          次のリクエストに{' '}
          {lastResponseTime
            ? `${(lastResponseTime / 1000).toFixed(1)}秒`
            : '1-2秒'}{' '}
          かかる可能性があります
        </span>
      </div>
    </div>
  );
}
