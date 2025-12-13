'use client';

import dynamic from 'next/dynamic';
import type { ReactPlayerProps } from 'react-player/types';
import styles from './VideoPlayer.module.scss';

const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
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
  return (
    <div className={styles.container}>
      <ReactPlayer
        src={url}
        width='100%'
        height='100%'
        volume={volume}
        muted={muted}
        controls
        config={PLAYER_CONFIG}
        onReady={onReady}
        onError={onError}
        playing={false}
      />
    </div>
  );
}
