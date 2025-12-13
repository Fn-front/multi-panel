'use client';

import dynamic from 'next/dynamic';
import styles from './VideoPlayer.module.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
}) as any;

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
  const config = {
    youtube: {
      modestbranding: 1 as 0 | 1,
      rel: 0 as 0 | 1,
    },
  };

  return (
    <div className={styles.container}>
      <ReactPlayer
        url={url}
        width='100%'
        height='100%'
        volume={volume}
        muted={muted}
        controls={true}
        config={config}
        onReady={onReady}
        onError={onError}
        playing={false}
      />
    </div>
  );
}
