'use client';

import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { PanelsProvider } from './PanelsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ChannelProvider } from './ChannelContext';
import { useTimeout } from '@/hooks/useTimeout';
import { Spinner } from '@/components/Spinner';

type GlobalProviderProps = {
  children: ReactNode;
};

/**
 * ローディングオーバーレイ
 */
function LoadingOverlay() {
  const { isLoading } = useAuth();
  const { hasTimeout } = useTimeout();

  if (!isLoading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 9999,
      }}
    >
      <Spinner size={50} />
      <div style={{ color: '#fff', fontSize: '18px' }}>読み込み中...</div>
      {hasTimeout && (
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          ページをリロード
        </button>
      )}
    </div>
  );
}

/**
 * 全てのContextをまとめたグローバルプロバイダー
 */
export function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <AuthProvider>
      <LoadingOverlay />
      <PanelsProvider>
        <FavoritesProvider>
          <ChannelProvider>{children}</ChannelProvider>
        </FavoritesProvider>
      </PanelsProvider>
    </AuthProvider>
  );
}
