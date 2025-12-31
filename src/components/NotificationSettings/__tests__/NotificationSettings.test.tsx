import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationSettings } from '../index';

describe('NotificationSettings component', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('タイトルが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText('配信通知')).toBeInTheDocument();
    });

    it('セクション要素が表示される', () => {
      const { container } = render(
        <NotificationSettings
          isMounted={true}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('マウント前の表示', () => {
    it('isMountedがfalseの場合は無効化されたボタンが表示される', () => {
      render(
        <NotificationSettings
          isMounted={false}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toBeDisabled();
    });

    it('isMountedがfalseの場合はラベルが"通知を有効にする"になる', () => {
      render(
        <NotificationSettings
          isMounted={false}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText('通知を有効にする')).toBeInTheDocument();
    });
  });

  describe('通知が無効な場合', () => {
    it('isEnabledがfalseの場合はONボタンが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByRole('button', { name: 'ON' })).toBeInTheDocument();
    });

    it('isEnabledがfalseの場合はラベルが"通知を有効にする"になる', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText('通知を有効にする')).toBeInTheDocument();
    });

    it('ONボタンがクリック可能', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).not.toBeDisabled();
    });
  });

  describe('通知が有効な場合', () => {
    it('isEnabledがtrueの場合はOFFボタンが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={true}
          notifiedCount={5}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByRole('button', { name: 'OFF' })).toBeInTheDocument();
    });

    it('通知カウントが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={true}
          notifiedCount={10}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText(/通知有効 \(10件通知済み\)/)).toBeInTheDocument();
    });

    it('異なる通知カウントが正しく表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={true}
          notifiedCount={3}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText(/通知有効 \(3件通知済み\)/)).toBeInTheDocument();
    });
  });

  describe('通知許可状態', () => {
    it('permissionがdefaultの場合は許可が必要なメッセージが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='default'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(
        screen.getByText('ブラウザの通知許可が必要です'),
      ).toBeInTheDocument();
    });

    it('permissionがgrantedの場合は許可が必要なメッセージが表示されない', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(
        screen.queryByText('ブラウザの通知許可が必要です'),
      ).not.toBeInTheDocument();
    });

    it('permissionがdeniedの場合は拒否メッセージが表示される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='denied'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      expect(screen.getByText('通知が拒否されています')).toBeInTheDocument();
    });

    it('permissionがdeniedの場合はボタンが無効化される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='denied'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toBeDisabled();
    });

    it('permissionがdeniedの場合はdisabledクラスが付与される', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='denied'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toHaveClass('disabled');
    });
  });

  describe('トグルボタンのクリック', () => {
    it('ONボタンをクリックするとonToggleが呼ばれる', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('OFFボタンをクリックするとonToggleが呼ばれる', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={true}
          notifiedCount={5}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'OFF' });
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('permissionがdeniedの場合はonToggleが呼ばれない', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='denied'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      fireEvent.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('ボタンの属性', () => {
    it('ボタンのtype属性がbuttonである', () => {
      render(
        <NotificationSettings
          isMounted={true}
          permission='granted'
          isEnabled={false}
          notifiedCount={0}
          onToggle={mockOnToggle}
        />,
      );

      const button = screen.getByRole('button', { name: 'ON' });
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
