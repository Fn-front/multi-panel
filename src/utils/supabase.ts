/**
 * Supabase関連のユーティリティ関数
 */

import { createSupabaseClient } from '@/lib/http-client';
import type { AxiosInstance } from 'axios';

/**
 * Supabase環境変数の設定を取得
 */
export const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Credentials not configured');
    return null;
  }

  return { supabaseUrl, supabaseKey };
};

let supabaseClient: AxiosInstance | null = null;

/**
 * Supabase Axiosクライアントを取得
 */
const getSupabaseClient = (): AxiosInstance => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase credentials not configured');
  }

  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(
      config.supabaseUrl,
      config.supabaseKey,
    );
  }

  return supabaseClient;
};

/**
 * Supabase Functionを呼び出す
 */
export const callSupabaseFunction = async <T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const client = getSupabaseClient();

  try {
    const response = await client.post<T>(`/${functionName}`, body);
    return response.data;
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: string } };
      message?: string;
    };
    const errorMessage =
      err.response?.data?.error || err.message || 'Unknown error';
    console.error(`[Supabase Function Error] ${functionName}:`, errorMessage);
    throw new Error(`Failed to call ${functionName}: ${errorMessage}`);
  }
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

/**
 * リトライ付きでPromiseを実行する
 * @param fn - 実行する関数
 * @param options - リトライオプション
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {},
): Promise<T> {
  const { maxRetries = 2, delayMs = 1000, backoff = true } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最後のリトライでエラーの場合は投げる
      if (attempt === maxRetries) {
        break;
      }

      // 待機時間を計算（バックオフの場合は指数的に増加）
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${delay}ms...`,
        lastError.message,
      );

      // 次のリトライまで待機
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
