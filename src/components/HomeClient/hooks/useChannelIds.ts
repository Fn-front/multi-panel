import { useMemo } from 'react';
import type { Channel } from '@/types/channel';

/**
 * チャンネルIDの配列をメモ化するフック
 */
export function useChannelIds(channels: Channel[]) {
  return useMemo(
    () => channels.map((ch) => ch.channelId),
    [channels],
  );
}
