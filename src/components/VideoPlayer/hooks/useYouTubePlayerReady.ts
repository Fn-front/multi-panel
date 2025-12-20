import { useState, useCallback, useEffect, useRef } from 'react';

interface UseYouTubePlayerReadyProps {
  url: string;
  onReady?: () => void;
}

/**
 * YouTube Playerの準備完了状態を管理するフック
 * youtube-video要素のreadyStateをポーリングして準備完了を検知
 */
export function useYouTubePlayerReady({
  url,
  onReady,
}: UseYouTubePlayerReadyProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleReady = useCallback(() => {
    setIsPlayerReady(true);
    onReady?.();
  }, [onReady]);

  // youtube-video-elementが既に準備完了している場合の対応
  useEffect(() => {
    const checkReadyState = () => {
      const youtubeVideo = playerRef.current?.querySelector('youtube-video');
      if (youtubeVideo && (youtubeVideo as HTMLMediaElement).readyState >= 1) {
        // readyState >= 1 (HAVE_METADATA) なら既に準備完了
        handleReady();
        return true;
      }
      return false;
    };

    // ReactPlayerがマウントされるまで繰り返しチェック
    let attempts = 0;
    const maxAttempts = 50; // 最大5秒 (100ms * 50)

    const intervalId = setInterval(() => {
      attempts++;
      if (checkReadyState() || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [url, handleReady]);

  return {
    isPlayerReady,
    playerRef,
    handleReady,
  };
}
