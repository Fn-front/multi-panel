'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import styles from './VolumeControl.module.scss';

type VolumeControlProps = {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
};

/**
 * 音量調整コンポーネント
 */
export function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onMutedChange,
}: VolumeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      onVolumeChange(newVolume);
      if (muted && newVolume > 0) {
        onMutedChange(false);
      }
    },
    [muted, onVolumeChange, onMutedChange],
  );

  const toggleMute = useCallback(() => {
    onMutedChange(!muted);
  }, [muted, onMutedChange]);

  const togglePopover = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const volumePercent = useMemo(() => Math.round(volume * 100), [volume]);

  // 外側クリックでポップオーバーを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type='button'
        className={styles.volumeButton}
        onClick={togglePopover}
        aria-label='音量調整'
      >
        {muted
          ? '🔇'
          : volumePercent === 0
            ? '🔇'
            : volumePercent < 50
              ? '🔉'
              : '🔊'}
      </button>
      {isOpen && (
        <div className={styles.popover}>
          <input
            type='range'
            className={styles.slider}
            min='0'
            max='1'
            step='0.01'
            value={volume}
            onChange={handleVolumeChange}
            aria-label='音量'
            orient='vertical'
          />
          <div className={styles.controls}>
            <span className={styles.volumeLabel}>{volumePercent}%</span>
            <button
              type='button'
              className={styles.muteButton}
              onClick={toggleMute}
              aria-label={muted ? 'ミュート解除' : 'ミュート'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
