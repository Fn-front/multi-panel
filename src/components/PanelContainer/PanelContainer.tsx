'use client';

import { useMemo, useCallback } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { VideoPanel } from '@/components/VideoPanel';
import { usePanels } from '@/contexts/PanelsContext';
import panelStyles from '@/components/VideoPanel/VideoPanel.module.scss';
import 'react-grid-layout/css/styles.css';
import styles from './PanelContainer.module.scss';

/**
 * グリッドレイアウトを管理するコンテナコンポーネント
 */
export function PanelContainer() {
  const { state, updateLayout, addPanel } = usePanels();

  const layout: Layout[] = useMemo(
    () =>
      state.panels.map((panel) => ({
        i: panel.id,
        x: panel.layout.x,
        y: panel.layout.y,
        w: panel.layout.w,
        h: panel.layout.h,
        minW: 2,
        minH: 2,
      })),
    [state.panels],
  );

  const handleAddPanel = useCallback(() => {
    addPanel({
      id: crypto.randomUUID(),
      url: '',
      volume: 0.5,
      isMuted: false,
      showChat: false,
      layout: {
        x: 0,
        y: Infinity,
        w: 4,
        h: 3,
      },
    });
  }, [addPanel]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          type='button'
          className={styles.addButton}
          onClick={handleAddPanel}
        >
          ＋ パネルを追加
        </button>
      </div>
      <div className={styles.gridContainer}>
        {state.panels.length === 0 ? (
          <div className={styles.empty}>
            <p>パネルがありません</p>
            <button
              type='button'
              className={styles.addButtonLarge}
              onClick={handleAddPanel}
            >
              ＋ パネルを追加
            </button>
          </div>
        ) : (
          <GridLayout
            className={styles.grid}
            layout={layout}
            cols={12}
            rowHeight={100}
            width={1200}
            onLayoutChange={updateLayout}
            draggableHandle={`.${panelStyles.dragHandle}`}
            compactType='vertical'
            preventCollision={false}
          >
            {state.panels.map((panel) => (
              <div key={panel.id} className={styles.gridItem}>
                <VideoPanel panel={panel} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  );
}
