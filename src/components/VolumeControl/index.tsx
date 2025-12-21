'use client';

import { useCallback, useMemo } from 'react';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { UI_TEXT } from '@/constants';
import { usePopoverControl } from './hooks/usePopoverControl';
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
  const { isOpen, containerRef, togglePopover } = usePopoverControl();

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

  const volumePercent = useMemo(() => Math.round(volume * 100), [volume]);

  const VolumeIcon = useMemo(() => {
    if (muted || volumePercent === 0) return HiSpeakerXMark;
    return HiSpeakerWave;
  }, [muted, volumePercent]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type='button'
        className={styles.volumeButton}
        onClick={togglePopover}
        aria-label={UI_TEXT.PANEL.VOLUME_CONTROL}
      >
        <VolumeIcon />
      </button>
      {isOpen && (
        <div className={styles.popover}>
          <input
            type='range'
            className={styles.slider}
            min='0'
            max='1'
            step='0.01'
            value={volume ?? 0}
            onChange={handleVolumeChange}
            aria-label={UI_TEXT.PANEL.VOLUME}
          />
          <button
            type='button'
            className={styles.muteButton}
            onClick={toggleMute}
            aria-label={muted ? UI_TEXT.PANEL.UNMUTE : UI_TEXT.PANEL.MUTE}
          >
            <VolumeIcon />
          </button>
        </div>
      )}
    </div>
  );
}
