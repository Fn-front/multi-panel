import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginModal } from '../index';
import { useAuth } from '@/contexts/AuthContext';

// モックの設定
jest.mock('@/contexts/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginModal component', () => {
  const mockOnClose = jest.fn();
  const mockSignInWithGitHub = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signInWithGitHub: mockSignInWithGitHub,
    } as ReturnType<typeof useAuth>);
    // window.alertのモック
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    // console.errorのモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (window.alert as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  describe('基本レンダリング', () => {
    it('isOpenがtrueの場合にモーダルが表示される', () => {
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('ログイン')).toBeInTheDocument();
    });

    it('isOpenがfalseの場合にモーダルが表示されない', () => {
      render(<LoginModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
    });

    it('ログインメッセージが表示される', () => {
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);
      expect(
        screen.getByText(
          'Multi Panelを使用するには、GitHubアカウントでログインしてください。',
        ),
      ).toBeInTheDocument();
    });

    it('GitHubログインボタンが表示される', () => {
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);
      expect(
        screen.getByRole('button', { name: /GitHubでログイン/i }),
      ).toBeInTheDocument();
    });

    it('GitHubアイコンが表示される', () => {
      const { container } = render(
        <LoginModal isOpen={true} onClose={mockOnClose} />,
      );
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(svgIcon).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  describe('ログイン処理', () => {
    it('ログインボタンをクリックするとsignInWithGitHubが呼ばれる', async () => {
      mockSignInWithGitHub.mockResolvedValue(undefined);
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      const loginButton = screen.getByRole('button', {
        name: /GitHubでログイン/i,
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithGitHub).toHaveBeenCalledTimes(1);
      });
    });

    it('ログイン成功時にonCloseが呼ばれる', async () => {
      mockSignInWithGitHub.mockResolvedValue(undefined);
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      const loginButton = screen.getByRole('button', {
        name: /GitHubでログイン/i,
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('ログイン失敗時にエラーメッセージが表示される', async () => {
      const error = new Error('Login failed');
      mockSignInWithGitHub.mockRejectedValue(error);

      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      const loginButton = screen.getByRole('button', {
        name: /GitHubでログイン/i,
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'ログインに失敗しました。もう一度お試しください。',
          error,
        );
        expect(window.alert).toHaveBeenCalledWith(
          'ログインに失敗しました。もう一度お試しください。',
        );
      });
    });

    it('ログイン失敗時にonCloseが呼ばれない', async () => {
      const error = new Error('Login failed');
      mockSignInWithGitHub.mockRejectedValue(error);

      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      const loginButton = screen.getByRole('button', {
        name: /GitHubでログイン/i,
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithGitHub).toHaveBeenCalledTimes(1);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modalコンポーネントのprops', () => {
    it('Modalに正しいpropsが渡される', () => {
      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      // タイトルが表示されていることを確認
      expect(screen.getByText('ログイン')).toBeInTheDocument();

      // maxWidthが適用されていることを確認
      const modalContent = screen
        .getByText('GitHubでログイン')
        .closest('.modalContent');
      expect(modalContent).toHaveStyle({ maxWidth: '540px' });
    });
  });

  describe('複数回のログイン試行', () => {
    it('複数回ログインを試行できる', async () => {
      mockSignInWithGitHub
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined);

      render(<LoginModal isOpen={true} onClose={mockOnClose} />);

      const loginButton = screen.getByRole('button', {
        name: /GitHubでログイン/i,
      });

      // 1回目の試行（失敗）
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(mockSignInWithGitHub).toHaveBeenCalledTimes(1);
      });
      expect(mockOnClose).not.toHaveBeenCalled();

      // 2回目の試行（成功）
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(mockSignInWithGitHub).toHaveBeenCalledTimes(2);
      });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
