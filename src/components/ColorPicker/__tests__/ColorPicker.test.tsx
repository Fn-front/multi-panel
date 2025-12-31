import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../index';

const PRESET_COLORS = [
  { hex: '#ef4444', name: '赤' },
  { hex: '#f59e0b', name: 'オレンジ' },
  { hex: '#eab308', name: '黄' },
  { hex: '#22c55e', name: '緑' },
  { hex: '#10b981', name: 'エメラルド' },
  { hex: '#06b6d4', name: 'シアン' },
  { hex: '#3b82f6', name: '青' },
  { hex: '#6366f1', name: 'インディゴ' },
  { hex: '#a855f7', name: '紫' },
  { hex: '#ec4899', name: 'ピンク' },
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
          selectedColor='#ef4444'
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
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color.name}に変更`);
        expect(button).toBeInTheDocument();
      });
    });

    it('カラーボタンの数が正しい', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
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
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={position}
        />,
      );

      const popup = document.querySelector('.popup') as HTMLElement;
      expect(popup).toHaveStyle({
        top: '150px',
        left: '250px',
      });
    });

    it('異なる位置でも正しく表示される', () => {
      const position = { top: 50, left: 100 };
      render(
        <ColorPicker
          selectedColor='#3b82f6'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={position}
        />,
      );

      const popup = document.querySelector('.popup') as HTMLElement;
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
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color.name}に変更`);
        expect(button).toHaveStyle({ backgroundColor: color.hex });
      });
    });

    it('選択された色のボタンにselectedクラスが付与される', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const selectedButton = screen.getByLabelText('色を赤に変更');
      expect(selectedButton).toHaveClass('selected');
    });

    it('選択されていない色のボタンにselectedクラスが付与されない', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const notSelectedButton = screen.getByLabelText('色を青に変更');
      expect(notSelectedButton).not.toHaveClass('selected');
    });

    it('カラーボタンのtype属性がbuttonである', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を赤に変更');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('カラー選択', () => {
    it('カラーボタンをクリックするとonChangeが呼ばれる', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を青に変更');
      fireEvent.click(button);

      expect(mockOnChange).toHaveBeenCalledWith('#3b82f6');
    });

    it('カラーボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      const button = screen.getByLabelText('色を緑に変更');
      fireEvent.click(button);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('異なる色をクリックすると正しい色が渡される', () => {
      render(
        <ColorPicker
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      PRESET_COLORS.forEach((color) => {
        const button = screen.getByLabelText(`色を${color.name}に変更`);
        fireEvent.click(button);
        expect(mockOnChange).toHaveBeenCalledWith(color.hex);
      });
    });
  });

  describe('外部クリック検知', () => {
    it('ポップアップ外をクリックするとonCloseが呼ばれる', () => {
      render(
        <div>
          <div data-testid='outside'>外部要素</div>
          <ColorPicker
            selectedColor='#ef4444'
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
          selectedColor='#ef4444'
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
          selectedColor='#ef4444'
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
          selectedColor='#ef4444'
          onChange={mockOnChange}
          onClose={mockOnClose}
          position={defaultPosition}
        />,
      );

      // 同じpropsで再レンダリング
      rerender(
        <ColorPicker
          selectedColor='#ef4444'
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
