'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { PanelsProvider } from './PanelsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ChannelProvider } from './ChannelContext';
import { LoadingOverlay } from '@/components/LoadingOverlay';

type GlobalProviderProps = {
  children: ReactNode;
};

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
