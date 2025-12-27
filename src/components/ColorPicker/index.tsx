'use client';

import { useRef, useEffect, memo } from 'react';
import styles from './ColorPicker.module.scss';

const PRESET_COLORS = [
  '#ef4444', // 赤
  '#f59e0b', // オレンジ
  '#eab308', // 黄
  '#22c55e', // 緑
  '#10b981', // エメラルド
  '#06b6d4', // シアン
  '#3b82f6', // 青
  '#6366f1', // インディゴ
  '#a855f7', // 紫
  '#ec4899', // ピンク
];

interface ColorPickerProps {
  /** 現在選択されている色 */
  selectedColor: string;
  /** 色変更時のコールバック */
  onChange: (color: string) => void;
  /** 閉じる時のコールバック */
  onClose: () => void;
  /** ポップアップの位置 */
  position: { top: number; left: number };
}

export const ColorPicker = memo(function ColorPicker({
  selectedColor,
  onChange,
  onClose,
  position,
}: ColorPickerProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className={styles.popup}
      style={{ top: position.top, left: position.left }}
    >
      <div className={styles.colorGrid}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type='button'
            className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onChange(color);
              onClose();
            }}
            aria-label={`色を${color}に変更`}
          />
        ))}
      </div>
    </div>
  );
});
