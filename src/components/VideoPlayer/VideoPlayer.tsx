'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ReactPlayerProps } from 'react-player/types';
import { Skeleton } from '@/components/Skeleton';
import styles from './VideoPlayer.module.scss';

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => (
    <div className={styles.skeleton}>
      <Skeleton width='80%' height='80%' />
    </div>
  ),
}) as unknown as React.FC<ReactPlayerProps>;

const PLAYER_CONFIG = {
  youtube: {
    modestbranding: 1 as 0 | 1,
    rel: 0 as 0 | 1,
  },
};

type VideoPlayerProps = {
  url: string;
  volume: number;
  muted: boolean;
  onReady?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * react-playerのラッパーコンポーネント
 */
export function VideoPlayer({
  url,
  volume,
  muted,
  onReady,
  onError,
}: VideoPlayerProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const handleReady = useCallback(() => {
    setIsPlayerReady(true);
    onReady?.();
  }, [onReady]);

  return (
    <div className={styles.container}>
      {!isPlayerReady && (
        <div className={styles.skeleton}>
          <Skeleton width='80%' height='80%' />
        </div>
      )}
      <div
        style={{ opacity: isPlayerReady ? 1 : 0, transition: 'opacity 0.3s' }}
      >
        <ReactPlayer
          src={url}
          width='100%'
          height='100%'
          volume={volume}
          muted={muted}
          controls
          config={PLAYER_CONFIG}
          onReady={handleReady}
          onError={onError}
          playing={false}
        />
      </div>
    </div>
  );
}
