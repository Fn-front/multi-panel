'use client';

import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { UI_TEXT } from '@/constants';
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
          <strong>{UI_TEXT.CONNECTION.RETRYING}</strong>
          <span className={styles.detail}>
            {UI_TEXT.CONNECTION.RETRY_COUNT(retryAttempt, retryMax)}
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
        <strong>{UI_TEXT.CONNECTION.COLD_START}</strong>
        <span className={styles.detail}>
          {UI_TEXT.CONNECTION.COLD_START_MESSAGE(lastResponseTime)}
        </span>
      </div>
    </div>
  );
}
