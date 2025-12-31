import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeout } from '@/hooks/useTimeout';

// モックの設定
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/useTimeout');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTimeout = useTimeout as jest.MockedFunction<typeof useTimeout>;

describe('LoadingOverlay component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // window.location.reload のモック
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true,
    });
  });

  describe('基本レンダリング', () => {
    it('isLoadingがfalseの場合は何も表示されない', () => {
      mockUseAuth.mockReturnValue({
        isLoading: false,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      const { container } = render(<LoadingOverlay />);
      expect(container.firstChild).toBeNull();
    });

    it('isLoadingがtrueの場合にオーバーレイが表示される', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('Spinnerコンポーネントが表示される', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      const { container } = render(<LoadingOverlay />);
      const spinner = container.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('タイムアウト状態', () => {
    it('hasTimeoutがfalseの場合はリロードボタンが表示されない', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      expect(
        screen.queryByRole('button', { name: 'ページをリロード' }),
      ).not.toBeInTheDocument();
    });

    it('hasTimeoutがtrueの場合はリロードボタンが表示される', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: true,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      expect(
        screen.getByRole('button', { name: 'ページをリロード' }),
      ).toBeInTheDocument();
    });

    it('リロードボタンをクリックするとページがリロードされる', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: true,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      const reloadButton = screen.getByRole('button', {
        name: 'ページをリロード',
      });
      fireEvent.click(reloadButton);

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('表示の組み合わせ', () => {
    it('ローディング中かつタイムアウト時は両方の要素が表示される', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: true,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ページをリロード' }),
      ).toBeInTheDocument();
    });

    it('ローディング中でもタイムアウトしていない場合はリロードボタンが表示されない', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      render(<LoadingOverlay />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'ページをリロード' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Spinnerのprops', () => {
    it('Spinnerに正しいsizeが渡される', () => {
      mockUseAuth.mockReturnValue({
        isLoading: true,
      } as ReturnType<typeof useAuth>);
      mockUseTimeout.mockReturnValue({
        hasTimeout: false,
      } as ReturnType<typeof useTimeout>);

      const { container } = render(<LoadingOverlay />);
      const spinner = container.querySelector('.spinner') as HTMLElement;

      expect(spinner).toHaveStyle({
        width: '50px',
        height: '50px',
      });
    });
  });
});
