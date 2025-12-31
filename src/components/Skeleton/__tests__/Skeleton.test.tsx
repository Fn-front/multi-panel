import { render } from '@testing-library/react';
import { Skeleton } from '../index';

describe('Skeleton component', () => {
  describe('基本レンダリング', () => {
    it('デフォルトのpropsでレンダリングされる', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('skeleton');
      expect(skeleton).toHaveClass('box');
    });

    it('指定したclassNameが適用される', () => {
      const { container } = render(<Skeleton className='custom-class' />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('skeleton');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('サイズのカスタマイズ', () => {
    it('数値で幅と高さを指定できる', () => {
      const { container } = render(<Skeleton width={200} height={100} />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveStyle({
        width: '200px',
        height: '100px',
      });
    });

    it('文字列で幅と高さを指定できる', () => {
      const { container } = render(<Skeleton width='50%' height='2rem' />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveStyle({
        width: '50%',
        height: '2rem',
      });
    });

    it('デフォルトの幅と高さが適用される', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveStyle({
        width: '100%',
        height: '20px',
      });
    });
  });

  describe('バリアント', () => {
    it('box variantが適用される', () => {
      const { container } = render(<Skeleton variant='box' />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('box');
      expect(skeleton).not.toHaveClass('circle');
    });

    it('circle variantが適用される', () => {
      const { container } = render(<Skeleton variant='circle' />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('circle');
      expect(skeleton).not.toHaveClass('box');
    });

    it('text variantはboxクラスが適用される', () => {
      const { container } = render(<Skeleton variant='text' />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('box');
    });

    it('デフォルトはbox variantが適用される', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('box');
    });
  });

  describe('複合パターン', () => {
    it('すべてのpropsを組み合わせて使用できる', () => {
      const { container } = render(
        <Skeleton
          width={150}
          height={150}
          variant='circle'
          className='avatar-skeleton'
        />,
      );
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('skeleton');
      expect(skeleton).toHaveClass('circle');
      expect(skeleton).toHaveClass('avatar-skeleton');
      expect(skeleton).toHaveStyle({
        width: '150px',
        height: '150px',
      });
    });
  });
});
