'use client';

import { forwardRef } from 'react';
import ReactPlayer from 'react-player/youtube';
import type { ReactPlayerProps } from 'react-player';
import styles from './VideoPlayer.module.scss';

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
export const VideoPlayer = forwardRef<ReactPlayer, VideoPlayerProps>(
  ({ url, volume, muted, onReady, onError }, ref) => {
    const config: ReactPlayerProps['config'] = {
      youtube: {
        playerVars: {
          modestbranding: 1,
          rel: 0,
        },
      },
    };

    return (
      <div className={styles.container}>
        <ReactPlayer
          ref={ref}
          url={url}
          width='100%'
          height='100%'
          volume={volume}
          muted={muted}
          controls
          config={config}
          onReady={onReady}
          onError={onError}
        />
      </div>
    );
  },
);

VideoPlayer.displayName = 'VideoPlayer';
