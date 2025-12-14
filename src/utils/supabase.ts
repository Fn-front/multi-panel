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
    throw new Error(`Failed to call ${functionName}: ${response.statusText}`);
  }

  return response.json();
};
