'use client';

import { useMemo, useCallback } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { HiPlus } from 'react-icons/hi2';
import { VideoPanel } from '@/components/VideoPanel';
import { Skeleton } from '@/components/Skeleton';
import { usePanels } from '@/contexts/PanelsContext';
import { useWindowSize } from '@/hooks/useWindowSize';
import { GRID_LAYOUT, PANEL_DEFAULTS, UI_TEXT } from '@/constants';
import panelStyles from '@/components/VideoPanel/VideoPanel.module.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import styles from './PanelContainer.module.scss';

/**
 * グリッドレイアウトを管理するコンテナコンポーネント
 */
export function PanelContainer() {
  const { state, isLoading, updateLayout, addPanel } = usePanels();
  const { width: containerWidth, isMobile } = useWindowSize();

  const layout: Layout[] = useMemo(
    () =>
      state.panels.map((panel, index) => {
        if (isMobile) {
          // モバイル: 縦一列に配置
          return {
            i: panel.id,
            x: 0,
            y: index * 4, // 各パネルの高さ分だけY座標をずらす
            w: 1, // 全幅
            h: 4, // 高さ固定
            minW: 1,
            minH: 3,
          };
        }
        // PC: 通常のレイアウト
        return {
          i: panel.id,
          x: panel.layout.x,
          y: panel.layout.y,
          w: panel.layout.w,
          h: panel.layout.h,
          minW: GRID_LAYOUT.MIN_WIDTH,
          minH: GRID_LAYOUT.MIN_HEIGHT,
        };
      }),
    [state.panels, isMobile],
  );

  // グリッドの列数（モバイルは1列、PCは12列）
  const cols = isMobile ? 1 : GRID_LAYOUT.COLS;

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
          aria-label={UI_TEXT.PANEL.ADD}
        >
          <HiPlus />
          <span>{UI_TEXT.PANEL.ADD}</span>
        </button>
      </div>
      <div className={styles.gridContainer}>
        {state.panels.length === 0 ? (
          <div className={styles.empty}>
            <p>{UI_TEXT.PANEL.EMPTY}</p>
            <button
              type='button'
              className={styles.addButtonLarge}
              onClick={handleAddPanel}
              aria-label={UI_TEXT.PANEL.ADD}
            >
              <HiPlus />
              <span>{UI_TEXT.PANEL.ADD}</span>
            </button>
          </div>
        ) : (
          <GridLayout
            className={styles.grid}
            layout={layout}
            cols={cols}
            rowHeight={GRID_LAYOUT.ROW_HEIGHT}
            width={containerWidth}
            onLayoutChange={updateLayout}
            draggableHandle={isMobile ? undefined : `.${panelStyles.dragHandle}`}
            isDraggable={!isMobile}
            isResizable={true}
            resizeHandles={isMobile ? ['s'] : ['se', 'e']}
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
