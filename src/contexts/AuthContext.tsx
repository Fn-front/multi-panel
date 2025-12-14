'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { callSupabaseFunction } from '@/utils/supabase';

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

  // セッション有効期限（24時間）
  const SESSION_EXPIRY_HOURS = 24;

  // ホワイトリストチェック
  const checkAllowedUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('user_id, last_login_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('ホワイトリストチェックエラー:', error);
      return false;
    }

    return !!data;
  };

  // 最終ログイン日時をチェックして期限切れか判定
  const checkSessionExpiry = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('allowed_users')
      .select('last_login_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('最終ログイン日時の取得エラー:', error);
      return true; // エラー時は期限切れ扱い
    }

    // last_login_atがnullの場合は初回ログインなので有効
    if (!data.last_login_at) {
      return false;
    }

    // 最終ログインから24時間経過しているかチェック
    const lastLogin = new Date(data.last_login_at);
    const now = new Date();
    const hoursSinceLogin =
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

    return hoursSinceLogin >= SESSION_EXPIRY_HOURS;
  };

  // 最終ログイン日時を更新
  const updateLastLogin = async (userId: string) => {
    const { error } = await supabase
      .from('allowed_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('最終ログイン日時の更新エラー:', error);
    }
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

  // セッション初期化
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const allowed = await checkAllowedUser(session.user.id);
        setIsAllowed(allowed);

        // getSession時は期限チェックせず、常に最終ログイン日時を更新
        // （実際の期限チェックはonAuthStateChangeで行う）
        if (allowed) {
          await updateLastLogin(session.user.id);
          // ログイン時: 今日〜月末の配信予定を取得
          await fetchStreamsUntilMonthEnd();
        }
      }

      setIsLoading(false);
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const allowed = await checkAllowedUser(session.user.id);
        setIsAllowed(allowed);

        // ログイン関連イベント時は必ず最終ログイン日時を更新（期限チェックなし）
        if (
          allowed &&
          (event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'INITIAL_SESSION')
        ) {
          await updateLastLogin(session.user.id);
          // ログイン時: 今日〜月末の配信予定を取得
          if (event === 'SIGNED_IN') {
            await fetchStreamsUntilMonthEnd();
          }
        }
        // その他のイベントではセッション期限チェック
        else if (allowed) {
          const isExpired = await checkSessionExpiry(session.user.id);
          if (isExpired) {
            console.log('セッション期限切れ - 自動ログアウト');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setIsAllowed(false);
          }
        }
      } else {
        setIsAllowed(false);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
        throw error;
      }
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
