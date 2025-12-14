'use client';

import { useMemo, useCallback } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { HiPlus } from 'react-icons/hi2';
import { VideoPanel } from '@/components/VideoPanel';
import { Skeleton } from '@/components/Skeleton';
import { usePanels } from '@/contexts/PanelsContext';
import { GRID_LAYOUT, PANEL_DEFAULTS } from '@/constants';
import panelStyles from '@/components/VideoPanel/VideoPanel.module.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './PanelContainer.module.scss';

type PanelContainerProps = {
  sidebarWidth?: number;
};

/**
 * グリッドレイアウトを管理するコンテナコンポーネント
 */
export function PanelContainer({ sidebarWidth = 0 }: PanelContainerProps) {
  const { state, isLoading, updateLayout, addPanel } = usePanels();

  const layout: Layout[] = useMemo(
    () =>
      state.panels.map((panel) => ({
        i: panel.id,
        x: panel.layout.x,
        y: panel.layout.y,
        w: panel.layout.w,
        h: panel.layout.h,
        minW: GRID_LAYOUT.MIN_WIDTH,
        minH: GRID_LAYOUT.MIN_HEIGHT,
      })),
    [state.panels],
  );

  const handleAddPanel = useCallback(() => {
    addPanel({
      id: crypto.randomUUID(),
      url: '',
      volume: PANEL_DEFAULTS.VOLUME,
      isMuted: PANEL_DEFAULTS.IS_MUTED,
      showChat: PANEL_DEFAULTS.SHOW_CHAT,
      layout: PANEL_DEFAULTS.LAYOUT,
    });
  }, [addPanel]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Skeleton width={120} height={36} />
        </div>
        <div className={styles.gridContainer}>
          <div className={styles.loadingSkeleton}>
            <Skeleton width='100%' height='100%' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          type='button'
          className={styles.addButton}
          onClick={handleAddPanel}
          aria-label='パネルを追加'
        >
          <HiPlus />
          <span>パネルを追加</span>
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
              aria-label='パネルを追加'
            >
              <HiPlus />
              <span>パネルを追加</span>
            </button>
          </div>
        ) : (
          <GridLayout
            className={styles.grid}
            layout={layout}
            cols={GRID_LAYOUT.COLS}
            rowHeight={GRID_LAYOUT.ROW_HEIGHT}
            width={GRID_LAYOUT.WIDTH}
            onLayoutChange={updateLayout}
            draggableHandle={`.${panelStyles.dragHandle}`}
            resizeHandles={['se', 'e']}
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
