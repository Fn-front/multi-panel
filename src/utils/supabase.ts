/**
 * Supabase関連のユーティリティ関数
 */

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

/**
 * Supabase Functionを呼び出す
 */
export const callSupabaseFunction = async <T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase credentials not configured');
  }

  const response = await fetch(
    `${config.supabaseUrl}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.supabaseKey}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Supabase Function Error] ${functionName}:`, errorText);
    throw new Error(
      `Failed to call ${functionName}: ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
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
