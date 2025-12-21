import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません');
}

// リトライ状態を管理するグローバルイベント
export type RetryEvent = {
  attempt: number;
  maxRetries: number;
  error: Error;
};

const retryListeners: Array<(event: RetryEvent) => void> = [];

export function onRetry(listener: (event: RetryEvent) => void) {
  retryListeners.push(listener);
  return () => {
    const index = retryListeners.indexOf(listener);
    if (index > -1) retryListeners.splice(index, 1);
  };
}

function notifyRetry(event: RetryEvent) {
  retryListeners.forEach((listener) => listener(event));
}

// クライアントサイドでのみfetch-retryを使用
let customFetch: typeof fetch = fetch;

if (typeof window !== 'undefined') {
  // 動的インポートでfetch-retryを読み込み（クライアント専用）
  import('fetch-retry')
    .then((fetchRetryModule) => {
      const fetchRetry = fetchRetryModule.default;
      customFetch = fetchRetry(fetch, {
        retries: 3,
        retryDelay: (attempt) => {
          // exponential backoff: 1s, 2s, 4s
          return Math.pow(2, attempt) * 1000;
        },
        retryOn: (attempt, error, response) => {
          // リトライ条件:
          // 1. ネットワークエラー
          // 2. タイムアウト系のステータスコード
          // 3. サーバーエラー系のステータスコード
          const shouldRetry =
            !response ||
            response.status === 408 || // Request Timeout
            response.status === 503 || // Service Unavailable
            response.status === 504 || // Gateway Timeout
            response.status === 520 || // Cloudflare Unknown Error
            (response.status >= 500 && response.status < 600); // その他のサーバーエラー

          if (shouldRetry && attempt < 3) {
            notifyRetry({
              attempt,
              maxRetries: 3,
              error: error || new Error(`HTTP ${response?.status}`),
            });
          }

          return shouldRetry;
        },
      });
    })
    .catch((error) => {
      console.error('Failed to load fetch-retry:', error);
    });
}

/**
 * Supabaseクライアントの接続設定
 *
 * Transaction Modeを使用するには、環境変数NEXT_PUBLIC_SUPABASE_URLを以下のように設定:
 * - Session Mode (デフォルト): https://xxx.supabase.co
 * - Transaction Mode (推奨): NEXT_PUBLIC_SUPABASE_URL に /rest/v1 エンドポイントを使用し、
 *   データベース接続はSupavisorが自動で Transaction Mode を選択
 *
 * Nano プランでの最適化:
 * - 接続プールの効率化により、コールドスタート時間を短縮
 * - 最大60接続の制限内で効率的に動作
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    fetch: customFetch,
  },
});
