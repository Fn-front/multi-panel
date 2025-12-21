import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません');
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
  },
});
