'use client';

import { useCallback } from 'react';
import { HiXMark, HiEllipsisVertical } from 'react-icons/hi2';
import { VideoPlayer } from '@/components/VideoPlayer';
import { URLInput } from '@/components/URLInput';
import { VolumeControl } from '@/components/VolumeControl';
import { usePanels } from '@/contexts/PanelsContext';
import type { Panel } from '@/types';
import styles from './VideoPanel.module.scss';

type VideoPanelProps = {
  panel: Panel;
};

/**
 * 動画パネルコンポーネント
 */
export function VideoPanel({ panel }: VideoPanelProps) {
  const { updatePanel, removePanel } = usePanels();

  const handleUrlChange = useCallback(
    (url: string) => updatePanel(panel.id, { url }),
    [panel.id, updatePanel],
  );

  const handleVolumeChange = useCallback(
    (volume: number) => updatePanel(panel.id, { volume }),
    [panel.id, updatePanel],
  );

  const handleMutedChange = useCallback(
    (isMuted: boolean) => updatePanel(panel.id, { isMuted }),
    [panel.id, updatePanel],
  );

  const handleRemove = useCallback(
    () => removePanel(panel.id),
    [panel.id, removePanel],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.controlBar}>
        <div className={styles.dragHandle}>
          <HiEllipsisVertical />
          <HiEllipsisVertical />
        </div>
        <URLInput currentUrl={panel.url} onUrlChange={handleUrlChange} />
        <VolumeControl
          volume={panel.volume}
          muted={panel.isMuted}
          onVolumeChange={handleVolumeChange}
          onMutedChange={handleMutedChange}
        />
        <button
          type='button'
          className={styles.removeButton}
          onClick={handleRemove}
          aria-label='パネルを削除'
        >
          <HiXMark />
        </button>
      </div>
      <div className={styles.videoContainer}>
        {panel.url ? (
          <VideoPlayer
            url={panel.url}
            volume={panel.volume}
            muted={panel.isMuted}
          />
        ) : (
          <div className={styles.placeholder}>
            <p>YouTube動画URLを入力してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
