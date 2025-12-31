import { useCallback, useState } from 'react';

interface ColorPickerState {
  channelId: string;
  position: { top: number; left: number };
}

interface UseColorPickerProps {
  onColorChange?: (id: string, color: string) => void;
}

interface UseColorPickerReturn {
  colorPickerState: ColorPickerState | null;
  handleColorClick: (channelId: string, e: React.MouseEvent) => void;
  handleColorChange: (color: string) => void;
  handleColorPickerClose: () => void;
}

/**
 * カラーピッカーの状態管理と操作を提供するカスタムフック
 */
export function useColorPicker({
  onColorChange,
}: UseColorPickerProps): UseColorPickerReturn {
  const [colorPickerState, setColorPickerState] =
    useState<ColorPickerState | null>(null);

  const handleColorClick = useCallback(
    (channelId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      setColorPickerState({
        channelId,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    },
    [],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (colorPickerState && onColorChange) {
        onColorChange(colorPickerState.channelId, color);
      }
    },
    [colorPickerState, onColorChange],
  );

  const handleColorPickerClose = useCallback(() => {
    setColorPickerState(null);
  }, []);

  return {
    colorPickerState,
    handleColorClick,
    handleColorChange,
    handleColorPickerClose,
  };
}
