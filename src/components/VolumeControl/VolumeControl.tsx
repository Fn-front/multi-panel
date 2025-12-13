'use client';

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
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    if (muted && newVolume > 0) {
      onMutedChange(false);
    }
  };

  const toggleMute = () => {
    onMutedChange(!muted);
  };

  const volumePercent = Math.round(volume * 100);

  return (
    <div className={styles.container}>
      <button
        type='button'
        className={styles.muteButton}
        onClick={toggleMute}
        aria-label={muted ? 'ミュート解除' : 'ミュート'}
      >
        {muted ? '🔇' : volumePercent === 0 ? '🔇' : volumePercent < 50 ? '🔉' : '🔊'}
      </button>
      <input
        type='range'
        className={styles.slider}
        min='0'
        max='1'
        step='0.01'
        value={volume}
        onChange={handleVolumeChange}
        aria-label='音量'
      />
      <span className={styles.volumeLabel}>{volumePercent}%</span>
    </div>
  );
}
