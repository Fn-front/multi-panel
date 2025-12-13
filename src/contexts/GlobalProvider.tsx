'use client';

import { type ReactNode } from 'react';
import { PanelsProvider } from './PanelsContext';
import { ChannelsProvider as OldChannelsProvider } from './ChannelsContext';
import { FavoritesProvider } from './FavoritesContext';
import { ChannelProvider } from './ChannelContext';

type GlobalProviderProps = {
  children: ReactNode;
};

/**
 * 全てのContextをまとめたグローバルプロバイダー
 */
export function GlobalProvider({ children }: GlobalProviderProps) {
  return (
    <PanelsProvider>
      <OldChannelsProvider>
        <FavoritesProvider>
          <ChannelProvider>{children}</ChannelProvider>
        </FavoritesProvider>
      </OldChannelsProvider>
    </PanelsProvider>
  );
}
