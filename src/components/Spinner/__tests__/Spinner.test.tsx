import { render } from '@testing-library/react';
import { Spinner } from '../index';

describe('Spinner component', () => {
  describe('基本レンダリング', () => {
    it('デフォルトのpropsでレンダリングされる', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('spinner');
    });
  });

  describe('サイズのカスタマイズ', () => {
    it('デフォルトサイズ(50px)が適用される', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        width: '50px',
        height: '50px',
      });
    });

    it('カスタムサイズを指定できる', () => {
      const { container } = render(<Spinner size={100} />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        width: '100px',
        height: '100px',
      });
    });

    it('小さいサイズを指定できる', () => {
      const { container } = render(<Spinner size={20} />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        width: '20px',
        height: '20px',
      });
    });
  });

  describe('ボーダー幅の計算', () => {
    it('サイズに応じてボーダー幅が計算される', () => {
      const size = 100;
      const expectedBorderWidth = 10; // size / 10
      const { container } = render(<Spinner size={size} />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        border: `${expectedBorderWidth}px solid rgba(255, 255, 255, 0.3)`,
        borderTopColor: '#fff',
      });
    });

    it('最小ボーダー幅(5px)が適用される', () => {
      const size = 20;
      const expectedBorderWidth = 5; // Math.max(5, size / 10) = Math.max(5, 2) = 5
      const { container } = render(<Spinner size={size} />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        border: `${expectedBorderWidth}px solid rgba(255, 255, 255, 0.3)`,
      });
    });

    it('デフォルトサイズのボーダー幅が正しい', () => {
      const defaultSize = 50;
      const expectedBorderWidth = 5; // Math.max(5, 50 / 10) = Math.max(5, 5) = 5
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        border: `${expectedBorderWidth}px solid rgba(255, 255, 255, 0.3)`,
        borderTopColor: '#fff',
      });
    });
  });

  describe('スタイリング', () => {
    it('正しいボーダーカラーが適用される', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        borderTopColor: '#fff',
      });
    });

    it('すべてのスタイルプロパティが正しく設定される', () => {
      const size = 80;
      const borderWidth = 8; // 80 / 10
      const { container } = render(<Spinner size={size} />);
      const spinner = container.firstChild as HTMLElement;

      expect(spinner).toHaveStyle({
        width: `${size}px`,
        height: `${size}px`,
        border: `${borderWidth}px solid rgba(255, 255, 255, 0.3)`,
        borderTopColor: '#fff',
      });
    });
  });
});
