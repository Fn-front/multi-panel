'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { callSupabaseFunction, withTimeout } from '@/utils/supabase';
import { UI_TEXT } from '@/constants';
import { useTimeout } from '@/hooks/useTimeout';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAllowed: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const { setHasTimeout } = useTimeout();
  const [, setIsRetrying] = useState(false);

  // セッション有効期限（24時間）
  const SESSION_EXPIRY_HOURS = 24;

  // Keep-alive間隔（10分）
  const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000;

  /**
   * セッション期限切れ時の処理
   */
  const handleSessionExpired = async () => {
    console.log('セッション期限切れ - 自動ログアウト');
    setSession(null);
    setUser(null);
    setIsAllowed(false);
    await supabase.auth.signOut();
  };

  /**
   * Keep-alive用の軽量クエリ
   */
  const keepAlive = async () => {
    try {
      await supabase.from('allowed_users').select('user_id').limit(1);
    } catch (error) {
      console.error('[Keep-alive] Failed:', error);
    }
  };

  /**
   * タイムアウト時のリトライ処理
   */
  const retryWithPolling = async <T,>(
    operation: () => Promise<T>,
    maxRetries = 3,
  ): Promise<T> => {
    setIsRetrying(true);
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // 1秒待機してリトライ
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    setIsRetrying(false);
    setHasTimeout(true);
    throw lastError || new Error('Retry failed');
  };

  /**
   * ホワイトリストチェック + セッション期限チェック + 最終ログイン更新を1回のクエリで実行
   * 最適化: 3回のクエリ → 1回のクエリに統合してコールドスタート時間を短縮
   */
  const checkAndUpdateAllowedUser = async (
    userId: string,
    updateLogin = false,
    skipExpiryCheck = false,
  ): Promise<{ isAllowed: boolean; isExpired: boolean }> => {
    const executeQuery = async () => {
      return await withTimeout(
        Promise.resolve(
          supabase
            .from('allowed_users')
            .select('user_id, last_login_at')
            .eq('user_id', userId)
            .single(),
        ),
        30000,
        'Allowed users check timeout',
      );
    };

    // タイムアウト時は自動リトライ（エラーは表示しない）
    const { data, error } = await executeQuery().catch(async () => {
      return await retryWithPolling(executeQuery);
    });

    if (error) {
      console.error('ホワイトリストチェックエラー:', error);
      return { isAllowed: false, isExpired: true };
    }

    if (!data) {
      return { isAllowed: false, isExpired: true };
    }

    // セッション期限チェック（スキップオプションがある場合はスキップ）
    let isExpired = false;
    if (!skipExpiryCheck && data.last_login_at) {
      const lastLogin = new Date(data.last_login_at);
      const now = new Date();
      const hoursSinceLogin =
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
      isExpired = hoursSinceLogin >= SESSION_EXPIRY_HOURS;
    }

    // 最終ログイン日時を更新（必要な場合のみ）
    if (updateLogin && !isExpired) {
      // 非同期で更新（待たない）- レスポンスタイムを優先
      supabase
        .from('allowed_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', userId)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error('最終ログイン日時の更新エラー:', updateError);
          }
        });
    }

    return { isAllowed: true, isExpired };
  };

  // ログイン時: 今日〜月末の配信予定を取得
  const fetchStreamsUntilMonthEnd = async () => {
    try {
      const result = await callSupabaseFunction('fetch-channel-streams', {});
      console.log('[AuthContext] Fetched streams until month end:', result);
    } catch (error) {
      console.error('Failed to fetch streams until month end:', error);
    }
  };

  // Keep-aliveポーリング（10分ごと）
  useEffect(() => {
    if (!user) return;

    // 初回実行
    keepAlive();

    // 10分ごとに実行
    const intervalId = setInterval(keepAlive, KEEP_ALIVE_INTERVAL);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // セッション初期化
  useEffect(() => {
    const executeGetSession = async () => {
      return await withTimeout(
        supabase.auth.getSession(),
        30000,
        'Auth session timeout',
      );
    };

    // タイムアウト時は自動リトライ
    executeGetSession()
      .catch(async () => {
        return await retryWithPolling(executeGetSession);
      })
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // ページリロード時: ホワイトリストチェックのみ（期限チェックはTOKEN_REFRESHEDで行う）
          const { isAllowed } = await checkAndUpdateAllowedUser(
            session.user.id,
            false, // ページリロード時は最終ログイン日時を更新しない
            true, // セッション期限チェックをスキップ
          );

          if (isAllowed) {
            setIsAllowed(true);
            // 配信情報の取得はSIGNED_INイベント時のみ実行（ページリロード毎には実行しない）
          } else {
            setIsAllowed(false);
            console.log(UI_TEXT.AUTH.NOT_WHITELISTED);
            await supabase.auth.signOut();
          }
        }

        setIsLoading(false);
      });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event);

      // SIGNED_OUTイベントの場合は早期リターン（無限ループ防止）
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAllowed(false);
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // SIGNED_INイベント時のみ配信情報を取得し、セッション期限チェックをスキップ
        if (event === 'SIGNED_IN') {
          const { isAllowed } = await checkAndUpdateAllowedUser(
            session.user.id,
            true, // 最終ログイン日時を更新
            true, // セッション期限チェックをスキップ（新規ログインのため）
          );

          if (isAllowed) {
            setIsAllowed(true);
            await fetchStreamsUntilMonthEnd();
          } else {
            setIsAllowed(false);
            console.log(UI_TEXT.AUTH.NOT_WHITELISTED);
            await supabase.auth.signOut();
          }
        }
        // TOKEN_REFRESHEDイベント時は最終ログイン日時のみ更新
        else if (event === 'TOKEN_REFRESHED') {
          const { isAllowed, isExpired } = await checkAndUpdateAllowedUser(
            session.user.id,
            true, // 最終ログイン日時を更新
            false, // セッション期限チェックを実行
          );

          if (isAllowed && !isExpired) {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
            if (isExpired) {
              await handleSessionExpired();
            }
          }
        }
        // INITIAL_SESSIONは初期化時に既に処理済みのためスキップ
      } else {
        setIsAllowed(false);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GitHub OAuth ログイン
  const signInWithGitHub = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('ログインエラー:', error);
        setIsLoading(false);
        throw error;
      }
      // リダイレクトが発生するため、setIsLoading(false)は不要
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // ログアウト
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('ログアウトエラー:', error);
        // エラーが発生してもローカル状態とストレージをクリア
        setSession(null);
        setUser(null);
        setIsAllowed(false);

        // LocalStorageを手動でクリア
        if (typeof window !== 'undefined') {
          const storageKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]}-auth-token`;
          localStorage.removeItem(storageKey);
        }
        return;
      }

      // 正常にログアウトできた場合もローカル状態をクリア
      setSession(null);
      setUser(null);
      setIsAllowed(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAllowed,
        signInWithGitHub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
