import { useState, useEffect, useRef } from 'react';
import { onRetry, type RetryEvent } from '@/lib/supabase';

/**
 * Supabase接続状態を監視するフック
 *
 * APIレスポンスタイムから接続プールの状態を推測:
 * - 1秒以上: コールドスタート(接続プールがタイムアウトしている)
 * - 500ms以下: ウォーム状態(接続プールが活性化している)
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<'warm' | 'cold' | 'unknown'>('unknown');
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [slowRequestCount, setSlowRequestCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMax, setRetryMax] = useState(0);
  const warmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // リトライイベントのリスナー設定
  useEffect(() => {
    const unsubscribe = onRetry((event: RetryEvent) => {
      setIsRetrying(true);
      setRetryAttempt(event.attempt);
      setRetryMax(event.maxRetries);
      console.log(
        `[ConnectionStatus] Retry attempt ${event.attempt}/${event.maxRetries}`,
      );

      // リトライ表示を3秒間表示してから非表示に
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        setIsRetrying(false);
        setRetryAttempt(0);
        setRetryMax(0);
      }, 3000);
    });

    return () => {
      unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // オリジナルのfetchをラップして計測
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Supabase APIへのリクエストのみ計測
        const url = args[0]?.toString() || '';
        if (url.includes('supabase.co')) {
          setLastResponseTime(duration);

          // レスポンスタイムで状態を判定
          if (duration > 1000) {
            setStatus('cold');
            setSlowRequestCount((prev) => prev + 1);
            console.log(
              `[ConnectionStatus] Cold start detected: ${duration.toFixed(0)}ms`,
            );

            // コールドスタート後、5秒経過したらwarmに自動復帰
            if (warmTimeoutRef.current) {
              clearTimeout(warmTimeoutRef.current);
            }
            warmTimeoutRef.current = setTimeout(() => {
              setStatus('warm');
              setSlowRequestCount(0);
              console.log('[ConnectionStatus] Auto-recovered to warm state');
            }, 5000);
          } else if (duration < 500) {
            setStatus('warm');
            setSlowRequestCount(0);
            // warm状態になったらタイマーをクリア
            if (warmTimeoutRef.current) {
              clearTimeout(warmTimeoutRef.current);
              warmTimeoutRef.current = null;
            }
          }
        }

        return response;
      } catch (error) {
        // エラー時もSupabase APIの場合は状態を更新
        const url = args[0]?.toString() || '';
        if (url.includes('supabase.co')) {
          const duration = performance.now() - startTime;
          setLastResponseTime(duration);

          // エラーでもレスポンスタイムを記録し、5秒後にwarmに復帰
          console.log(
            `[ConnectionStatus] Request failed after ${duration.toFixed(0)}ms`,
          );

          if (warmTimeoutRef.current) {
            clearTimeout(warmTimeoutRef.current);
          }
          warmTimeoutRef.current = setTimeout(() => {
            setStatus('warm');
            setSlowRequestCount(0);
            console.log(
              '[ConnectionStatus] Auto-recovered to warm state after error',
            );
          }, 5000);
        }
        throw error;
      }
    };

    // クリーンアップ
    return () => {
      window.fetch = originalFetch;
      if (warmTimeoutRef.current) {
        clearTimeout(warmTimeoutRef.current);
      }
    };
  }, []);

  return {
    /** 接続状態 */
    status,
    /** 最後のレスポンスタイム(ミリ秒) */
    lastResponseTime,
    /** 連続して遅いリクエストの回数 */
    slowRequestCount,
    /** コールドスタート中かどうか */
    isColdStart: status === 'cold',
    /** リトライ中かどうか */
    isRetrying,
    /** 現在のリトライ試行回数 */
    retryAttempt,
    /** 最大リトライ回数 */
    retryMax,
  };
}
