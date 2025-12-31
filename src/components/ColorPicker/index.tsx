'use client';

import { useRef, useEffect, memo } from 'react';
import { COLORS, ACCESSIBILITY } from '@/constants';
import styles from './ColorPicker.module.scss';

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
        {COLORS.PRESET.map((color) => (
          <button
            key={color.hex}
            type='button'
            className={`${styles.colorOption} ${selectedColor === color.hex ? styles.selected : ''}`}
            style={{ backgroundColor: color.hex }}
            onClick={() => {
              onChange(color.hex);
              onClose();
            }}
            aria-label={ACCESSIBILITY.COLOR_PICKER.CHANGE_COLOR_TO(color.name)}
          />
        ))}
      </div>
    </div>
  );
});
