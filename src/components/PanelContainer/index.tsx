'use client';

import { useMemo, useCallback, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import { HiPlus, HiRectangleStack, HiSquares2X2 } from 'react-icons/hi2';
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
  const [mobileColumns, setMobileColumns] = useState(1);

  const layout: Layout[] = useMemo(
    () =>
      state.panels.map((panel, index) => {
        if (isMobile) {
          const gap = 8;
          const gridItemWidth =
            mobileColumns === 2
              ? (containerWidth - gap) / 2
              : containerWidth - 2;
          const videoHeight = (gridItemWidth * 9) / 16;
          const controlBarHeight = 56;
          const borderHeight = 2;
          const totalHeight = Math.ceil(
            videoHeight + controlBarHeight + borderHeight,
          );

          // rowHeight=1のため、x, y, h は全てピクセル単位
          // 2カラム時: cols=containerWidthにして、1グリッド単位=1px
          // これによりwもピクセル単位で指定可能
          const x =
            mobileColumns === 2 ? (index % 2) * (gridItemWidth + gap) : 0;
          const y =
            mobileColumns === 2
              ? Math.floor(index / 2) * (totalHeight + gap)
              : index * (totalHeight + gap);
          const w = mobileColumns === 2 ? gridItemWidth : 2;

          return {
            i: panel.id,
            x,
            y,
            w,
            h: totalHeight,
            minW: w,
            minH: totalHeight,
            static: false,
          };
        }

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
    [state.panels, isMobile, containerWidth, mobileColumns],
  );

  // グリッドの列数（モバイル2カラム時は隙間を考慮して調整）
  const cols =
    isMobile && mobileColumns === 2
      ? containerWidth
      : isMobile
        ? 2
        : GRID_LAYOUT.COLS;

  // レイアウト変更時の処理
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // PC時のみレイアウトを保存
      // モバイル時はuseMemoで計算されたレイアウトを使用するため、保存しない
      if (!isMobile) {
        updateLayout(newLayout);
      }
    },
    [isMobile, updateLayout],
  );

  const toggleMobileColumns = useCallback(() => {
    setMobileColumns((prev) => (prev === 1 ? 2 : 1));
  }, []);

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
      {isMobile && (
        <div className={styles.columnToggle}>
          <button
            type='button'
            className={styles.columnButton}
            onClick={toggleMobileColumns}
            aria-label={`${mobileColumns}カラム表示`}
          >
            {mobileColumns === 1 ? <HiRectangleStack /> : <HiSquares2X2 />}
          </button>
        </div>
      )}
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
            key={isMobile ? `mobile-${mobileColumns}` : 'desktop'}
            className={styles.grid}
            layout={layout}
            cols={cols}
            rowHeight={isMobile ? 1 : GRID_LAYOUT.ROW_HEIGHT}
            width={containerWidth}
            margin={isMobile ? [0, 0] : [10, 10]}
            onLayoutChange={handleLayoutChange}
            draggableHandle={
              isMobile ? undefined : `.${panelStyles.dragHandle}`
            }
            isDraggable={!isMobile}
            isResizable={!isMobile}
            resizeHandles={isMobile ? [] : ['se', 'e']}
            compactType={isMobile ? null : 'vertical'}
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
