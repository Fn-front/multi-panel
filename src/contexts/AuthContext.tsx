'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { callSupabaseFunction } from '@/utils/supabase';
import { UI_TEXT, ERROR_MESSAGES } from '@/constants';
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
  const [hasProcessedInitialSignIn, setHasProcessedInitialSignIn] =
    useState(false);

  // セッション有効期限（24時間）
  const SESSION_EXPIRY_HOURS = 24;

  // Keep-alive間隔（10分）
  const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000;

  /**
   * セッション期限切れ時の処理
   */
  const handleSessionExpired = async () => {
    console.log(ERROR_MESSAGES.AUTH.SESSION_EXPIRED);
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
   * ホワイトリストチェック + セッション期限チェック + 最終ログイン更新を1回のクエリで実行
   * 最適化: 3回のクエリ → 1回のクエリに統合してコールドスタート時間を短縮
   * fetch-retryによる自動リトライに任せる（二重リトライを避ける）
   */
  const checkAndUpdateAllowedUser = async (
    userId: string,
    updateLogin = false,
    skipExpiryCheck = false,
  ): Promise<{ isAllowed: boolean; isExpired: boolean }> => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('user_id, last_login_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error(ERROR_MESSAGES.AUTH.WHITELIST_CHECK_ERROR, error);
        return { isAllowed: false, isExpired: true };
      }

      if (!data) {
        return { isAllowed: false, isExpired: true };
      }

      // セッション期限チェック（スキップオプションがある場合はスキップ）
      let isExpired = false;
      if (skipExpiryCheck) {
        isExpired = false;
      } else if (data.last_login_at) {
        const lastLogin = new Date(data.last_login_at);
        const now = new Date();
        const hoursSinceLogin =
          (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
        isExpired = hoursSinceLogin >= SESSION_EXPIRY_HOURS;
      } else {
        isExpired = true;
      }

      // 最終ログイン日時を更新（必要な場合のみ）
      if (updateLogin && !isExpired) {
        const newLoginTime = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('allowed_users')
          .update({ last_login_at: newLoginTime })
          .eq('user_id', userId);

        if (updateError) {
          console.error(ERROR_MESSAGES.AUTH.LAST_LOGIN_UPDATE_ERROR, updateError);
        }
      }

      return { isAllowed: true, isExpired };
    } catch (error) {
      console.error(ERROR_MESSAGES.AUTH.WHITELIST_CHECK_EXCEPTION, error);
      setHasTimeout(true);
      return { isAllowed: false, isExpired: true };
    }
  };

  // ログイン時: 今日〜月末の配信予定を取得
  const fetchStreamsUntilMonthEnd = async () => {
    try {
      await callSupabaseFunction('fetch-channel-streams', {});
    } catch (error) {
      console.error('Failed to fetch streams until month end:', error);
    }
  };

  // Keep-aliveポーリング + セッション期限チェック（10分ごと）
  useEffect(() => {
    if (!user) return;

    // セッション期限チェック
    const checkSessionExpiry = async () => {
      const { isExpired } = await checkAndUpdateAllowedUser(
        user.id,
        true, // 最終ログイン日時を更新（アクティブな操作として記録）
        false, // セッション期限チェックを実行
      );

      if (isExpired) {
        await handleSessionExpired();
      }
    };

    // 初回実行
    keepAlive();

    // 10分ごとに実行（セッション期限チェック含む）
    const intervalId = setInterval(() => {
      keepAlive();
      checkSessionExpiry();
    }, KEEP_ALIVE_INTERVAL);

    // タブがアクティブになったときにセッション期限チェック
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // セッション初期化
  useEffect(() => {
    // fetch-retryによる自動リトライに任せる
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // ページリロード時: ホワイトリストチェック + last_login_at更新
          const { isAllowed } = await checkAndUpdateAllowedUser(
            session.user.id,
            true, // ページリロード時も最終ログイン日時を更新
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
      })
      .catch((error) => {
        console.error('[getSession] Failed:', error);
        setHasTimeout(true);
        setIsLoading(false);
      });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // SIGNED_OUTイベントの場合は早期リターン（無限ループ防止）
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAllowed(false);
        setIsLoading(false);
        setHasProcessedInitialSignIn(false); // フラグをリセット
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // SIGNED_INイベント時のみ配信情報を取得し、セッション期限チェックをスキップ
        // ただし、初回のSIGNED_INのみ処理（重複イベントを無視）
        if (event === 'SIGNED_IN' && !hasProcessedInitialSignIn) {
          setHasProcessedInitialSignIn(true);

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
        // 重複SIGNED_INイベントもスキップ
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
      // 環境変数からリダイレクトURLを取得、未設定の場合は現在のオリジンを使用
      const redirectUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${redirectUrl}/auth/callback`,
        },
      });

      if (error) {
        console.error(ERROR_MESSAGES.AUTH.LOGIN_ERROR, error);
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
        console.error(ERROR_MESSAGES.AUTH.LOGOUT_ERROR, error);
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
