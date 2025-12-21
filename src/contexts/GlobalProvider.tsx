'use client';

import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { PanelsProvider } from './PanelsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ChannelProvider } from './ChannelContext';

type GlobalProviderProps = {
  children: ReactNode;
};

/**
 * ローディングオーバーレイ
 */
function LoadingOverlay() {
  const { isLoading } = useAuth();

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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
