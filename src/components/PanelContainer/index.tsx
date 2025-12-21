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
          // モバイル: 縦一列に配置、16:9のアスペクト比を計算
          const gridItemWidth = containerWidth; // モバイルは1列なので全幅
          const targetHeight = (gridItemWidth * 9) / 16;
          const gridHeight = Math.round(targetHeight / GRID_LAYOUT.ROW_HEIGHT);
          const height = Math.max(gridHeight, 3);

          return {
            i: panel.id,
            x: 0,
            y: index * height, // 計算された高さ分だけY座標をずらす
            w: 1, // 全幅
            h: height, // 16:9のアスペクト比に基づく高さ
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
    [state.panels, isMobile, containerWidth],
  );

  // グリッドの列数（モバイルは1列、PCは12列）
  const cols = isMobile ? 1 : GRID_LAYOUT.COLS;

  // SP時のみレイアウト変更時に16:9のアスペクト比を維持
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!isMobile) {
        // PC時は通常通りレイアウトを保存
        updateLayout(newLayout);
        return;
      }

      // SP時: 16:9のアスペクト比を強制
      const adjustedLayout = newLayout.map((item) => {
        const gridItemWidth = containerWidth * item.w; // モバイルは1列なので全幅
        const targetHeight = (gridItemWidth * 9) / 16;
        const gridHeight = Math.round(targetHeight / GRID_LAYOUT.ROW_HEIGHT);

        return {
          ...item,
          h: Math.max(gridHeight, GRID_LAYOUT.MIN_HEIGHT),
        };
      });

      updateLayout(adjustedLayout);
    },
    [containerWidth, isMobile, updateLayout],
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
            onLayoutChange={handleLayoutChange}
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
