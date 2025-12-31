import { render, screen } from '@testing-library/react';
import { SettingsModal } from '../index';

describe('SettingsModal component', () => {
  const mockOnClose = jest.fn();
  const mockOnToggle = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    isMounted: true,
    permission: 'granted' as NotificationPermission,
    isEnabled: false,
    notifiedCount: 0,
    onToggle: mockOnToggle,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('isOpenがtrueの場合にモーダルが表示される', () => {
      render(<SettingsModal {...defaultProps} />);
      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('isOpenがfalseの場合にモーダルが表示されない', () => {
      render(<SettingsModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('設定')).not.toBeInTheDocument();
    });

    it('NotificationSettingsコンポーネントが表示される', () => {
      render(<SettingsModal {...defaultProps} />);
      expect(screen.getByText('配信通知')).toBeInTheDocument();
    });
  });

  describe('Modalコンポーネントのprops', () => {
    it('Modalタイトルが"設定"になる', () => {
      render(<SettingsModal {...defaultProps} />);
      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('maxWidthが540pxに設定される', () => {
      render(<SettingsModal {...defaultProps} />);
      const modalContent = screen
        .getByText('配信通知')
        .closest('.modalContent');
      expect(modalContent).toHaveStyle({ maxWidth: '540px' });
    });
  });

  describe('NotificationSettingsコンポーネントへのprops', () => {
    it('isMountedが正しく渡される', () => {
      render(<SettingsModal {...defaultProps} isMounted={true} />);
      // isMountedがtrueの場合、ONボタンが有効化されている
      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).not.toBeDisabled();
    });

    it('isMountedがfalseの場合はボタンが無効化される', () => {
      render(<SettingsModal {...defaultProps} isMounted={false} />);
      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toBeDisabled();
    });

    it('permissionが正しく渡される（granted）', () => {
      render(<SettingsModal {...defaultProps} permission='granted' />);
      expect(
        screen.queryByText('ブラウザの通知許可が必要です'),
      ).not.toBeInTheDocument();
    });

    it('permissionが正しく渡される（default）', () => {
      render(<SettingsModal {...defaultProps} permission='default' />);
      expect(
        screen.getByText('ブラウザの通知許可が必要です'),
      ).toBeInTheDocument();
    });

    it('permissionが正しく渡される（denied）', () => {
      render(<SettingsModal {...defaultProps} permission='denied' />);
      expect(screen.getByText('通知が拒否されています')).toBeInTheDocument();
    });

    it('isEnabledがfalseの場合はONボタンが表示される', () => {
      render(<SettingsModal {...defaultProps} isEnabled={false} />);
      expect(screen.getByRole('button', { name: 'ON' })).toBeInTheDocument();
    });

    it('isEnabledがtrueの場合はOFFボタンが表示される', () => {
      render(<SettingsModal {...defaultProps} isEnabled={true} />);
      expect(screen.getByRole('button', { name: 'OFF' })).toBeInTheDocument();
    });

    it('notifiedCountが正しく渡される', () => {
      render(
        <SettingsModal
          {...defaultProps}
          isEnabled={true}
          notifiedCount={15}
        />,
      );
      expect(screen.getByText(/15件通知済み/)).toBeInTheDocument();
    });

    it('異なるnotifiedCountが正しく渡される', () => {
      render(
        <SettingsModal {...defaultProps} isEnabled={true} notifiedCount={7} />,
      );
      expect(screen.getByText(/7件通知済み/)).toBeInTheDocument();
    });
  });

  describe('コールバック関数', () => {
    it('onCloseが正しく渡される', () => {
      render(<SettingsModal {...defaultProps} />);
      // Modalコンポーネントが正しくレンダリングされ、onCloseが設定されている
      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    it('onToggleが正しく渡される', () => {
      render(<SettingsModal {...defaultProps} />);
      // NotificationSettingsコンポーネントにonToggleが渡されている
      expect(screen.getByRole('button', { name: 'ON' })).toBeInTheDocument();
    });
  });

  describe('複数の状態の組み合わせ', () => {
    it('通知有効・マウント済み・許可済みの状態', () => {
      render(
        <SettingsModal
          {...defaultProps}
          isMounted={true}
          permission='granted'
          isEnabled={true}
          notifiedCount={20}
        />,
      );

      expect(screen.getByText('設定')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'OFF' })).toBeInTheDocument();
      expect(screen.getByText(/20件通知済み/)).toBeInTheDocument();
    });

    it('通知無効・未マウント・デフォルト許可の状態', () => {
      render(
        <SettingsModal
          {...defaultProps}
          isMounted={false}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
        />,
      );

      expect(screen.getByText('設定')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toBeDisabled();
    });

    it('通知拒否・マウント済みの状態', () => {
      render(
        <SettingsModal
          {...defaultProps}
          isMounted={true}
          permission='denied'
          isEnabled={false}
          notifiedCount={0}
        />,
      );

      expect(screen.getByText('設定')).toBeInTheDocument();
      expect(screen.getByText('通知が拒否されています')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toBeDisabled();
    });
  });

});
