'use client';

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

  return (
    <div className={styles.panel}>
      <div className={styles.controlBar}>
        <URLInput
          currentUrl={panel.url}
          onUrlChange={(url) => updatePanel(panel.id, { url })}
        />
        <VolumeControl
          volume={panel.volume}
          muted={panel.isMuted}
          onVolumeChange={(volume) => updatePanel(panel.id, { volume })}
          onMutedChange={(isMuted) => updatePanel(panel.id, { isMuted })}
        />
        <button
          type='button'
          className={styles.removeButton}
          onClick={() => removePanel(panel.id)}
          aria-label='パネルを削除'
        >
          ✕
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
