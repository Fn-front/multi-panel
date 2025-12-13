'use client';

import { type ReactNode } from 'react';
import { PanelsProvider } from './PanelsContext';
import { ChannelsProvider } from './ChannelsContext';
import { FavoritesProvider } from './FavoritesContext';

type GlobalProviderProps = {
  children: ReactNode;
};

/**
 * 全てのContextをまとめたグローバルプロバイダー
 */
export function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <PanelsProvider>
      <ChannelsProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </ChannelsProvider>
    </PanelsProvider>
  );
}
