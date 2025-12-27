/**
 * HTTP クライアント - axios ベースの共通エラーハンドリング
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * 共通エラーハンドリング用のaxiosインスタンス
 */
export const httpClient: AxiosInstance = axios.create({
  timeout: 30000, // 30秒
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * リクエストインターセプター
 */
httpClient.interceptors.request.use(
  (config) => {
    // リクエスト送信前の処理（必要に応じてログ出力など）
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * レスポンスインターセプター（共通エラーハンドリング）
 */
httpClient.interceptors.response.use(
  (response) => {
    // 成功時はそのまま返す
    return response;
  },
  (error: AxiosError) => {
    // エラーハンドリング
    if (error.response) {
      // サーバーからのエラーレスポンス
      const status = error.response.status;
      const data = error.response.data;

      console.error(`[HTTP Error ${status}]`, {
        url: error.config?.url,
        method: error.config?.method,
        status,
        data,
      });

      // ステータスコード別の処理（必要に応じて拡張）
      if (status === 401) {
        console.error('Unauthorized - 認証エラー');
      } else if (status === 403) {
        console.error('Forbidden - アクセス権限なし');
      } else if (status === 404) {
        console.error('Not Found - リソースが見つかりません');
      } else if (status >= 500) {
        console.error('Server Error - サーバーエラー');
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      console.error('[HTTP Error] No response received', {
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      // リクエスト設定時のエラー
      console.error('[HTTP Error] Request setup failed', error.message);
    }

    return Promise.reject(error);
  },
);

/**
 * Supabase Function呼び出し用のaxiosインスタンス
 */
export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseKey: string,
): AxiosInstance => {
  return axios.create({
    baseURL: `${supabaseUrl}/functions/v1`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
};

/**
 * YouTube API呼び出し用のaxiosインスタンス
 */
export const createYouTubeClient = (apiKey: string): AxiosInstance => {
  const client = axios.create({
    baseURL: 'https://www.googleapis.com/youtube/v3',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // リクエストインターセプター: API Keyをクエリパラメータに追加
  client.interceptors.request.use((config) => {
    config.params = {
      ...config.params,
      key: apiKey,
    };
    return config;
  });

  // レスポンスインターセプター: YouTube API固有のエラーハンドリング
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 403) {
        const data = error.response.data as any;
        if (data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
          console.warn('YouTube API quota exceeded');
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
};

/**
 * Promise にタイムアウトを追加するユーティリティ関数
 * @param promise - タイムアウトを追加する Promise
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @param errorMessage - タイムアウト時のエラーメッセージ
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
}
