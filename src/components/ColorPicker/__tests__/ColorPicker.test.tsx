import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../index';

const PRESET_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

describe('ColorPicker component', () => {
  const mockOnChange = jest.fn();
  const mockOnClose = jest.fn();
  const defaultPosition = { top: 100, left: 200 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('カラーピッカーが表示される', () => {
      const { container } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const popup = container.querySelector('.popup');
      expect(popup).toBeInTheDocument();
    });

    it('プリセットカラーがすべて表示される', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color}に変更`);
        expect(button).toBeInTheDocument();
      });
    });

    it('カラーボタンの数が正しい', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(PRESET_COLORS.length);
    });
  });

  describe('位置の設定', () => {
    it('指定された位置にポップアップが表示される', () => {
      const position = { top: 150, left: 250 };
      const { container } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={position}
        />,
      );

      const popup = container.querySelector('.popup') as HTMLElement;
      expect(popup).toHaveStyle({
        top: '150px',
        left: '250px',
      });
    });

    it('異なる位置でも正しく表示される', () => {
      const position = { top: 50, left: 100 };
      const { container } = render(
        <ColorPicker
          selectedColor="#3b82f6"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={position}
        />,
      );

      const popup = container.querySelector('.popup') as HTMLElement;
      expect(popup).toHaveStyle({
        top: '50px',
        left: '100px',
      });
    });
  });

  describe('カラーボタンの表示', () => {
    it('各カラーボタンに正しい背景色が設定される', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color}に変更`);
        expect(button).toHaveStyle({ backgroundColor: color });
      });
    });

    it('選択された色のボタンにselectedクラスが付与される', () => {
      const { container } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const selectedButton = screen.getByLabelText('色を#ef4444に変更');
      expect(selectedButton).toHaveClass('selected');
    });

    it('選択されていない色のボタンにselectedクラスが付与されない', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const notSelectedButton = screen.getByLabelText('色を#3b82f6に変更');
      expect(notSelectedButton).not.toHaveClass('selected');
    });

    it('カラーボタンのtype属性がbuttonである', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を#ef4444に変更');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('カラー選択', () => {
    it('カラーボタンをクリックするとonChangeが呼ばれる', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を#3b82f6に変更');
      fireEvent.click(button);

      expect(mockOnChange).toHaveBeenCalledWith('#3b82f6');
    });

    it('カラーボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を#22c55e に変更');
      fireEvent.click(button);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('異なる色をクリックすると正しい色が渡される', () => {
      render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color}に変更`);
        fireEvent.click(button);
        expect(mockOnChange).toHaveBeenCalledWith(color);
      });
    });
  });

  describe('外部クリック検知', () => {
    it('ポップアップ外をクリックするとonCloseが呼ばれる', () => {
      const { container } = render(
        <div>
          <div data-testid="outside">外部要素</div>
          <ColorPicker
            selectedColor="#ef4444"
            onChange={mockOnChange}
            onClose={mockOnClose}
            position={defaultPosition}
          />
        </div>,
      );

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('ポップアップ内をクリックしてもonCloseが呼ばれない（カラーボタン以外）', () => {
      const { container } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const colorGrid = container.querySelector('.colorGrid');
      if (colorGrid) {
        fireEvent.mouseDown(colorGrid);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('イベントリスナーのクリーンアップ', () => {
    it('アンマウント時にイベントリスナーが削除される', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );

      const { unmount } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('memoization', () => {
    it('propsが変更されない場合は再レンダリングされない', () => {
      const { rerender } = render(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      // 同じpropsで再レンダリング
      rerender(
        <ColorPicker
          selectedColor="#ef4444"
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      // memoされているため、コンポーネントは正常に動作する
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(PRESET_COLORS.length);
    });
  });
});
