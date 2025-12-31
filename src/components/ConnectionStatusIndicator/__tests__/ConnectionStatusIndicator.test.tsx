import { render, screen } from '@testing-library/react';
import { ConnectionStatusIndicator } from '../index';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

// useConnectionStatusフックをモック
jest.mock('@/hooks/useConnectionStatus');

const mockUseConnectionStatus =
  useConnectionStatus as jest.MockedFunction<typeof useConnectionStatus>;

describe('ConnectionStatusIndicator component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期状態とunknown状態', () => {
    it('statusがunknownの場合は何も表示されない', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'unknown',
        lastResponseTime: null,
        isColdStart: false,
        isRetrying: false,
        retryAttempt: 0,
        retryMax: 3,
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('リトライ中の表示', () => {
    it('isRetryingがtrueの場合にリトライ中のメッセージが表示される', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'error',
        lastResponseTime: null,
        isColdStart: false,
        isRetrying: true,
        retryAttempt: 1,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
      expect(screen.getByText('接続を再試行中')).toBeInTheDocument();
      expect(screen.getByText('1/3 回目の試行...')).toBeInTheDocument();
    });

    it('retryAttemptとretryMaxが正しく表示される', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'error',
        lastResponseTime: null,
        isColdStart: false,
        isRetrying: true,
        retryAttempt: 2,
        retryMax: 5,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('2/5 回目の試行...')).toBeInTheDocument();
    });

    it('リトライ中はColdStart表示より優先される', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'error',
        lastResponseTime: 2000,
        isColdStart: true,
        isRetrying: true,
        retryAttempt: 1,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('接続を再試行中')).toBeInTheDocument();
      expect(screen.queryByText('接続プールがスリープ中')).not.toBeInTheDocument();
    });
  });

  describe('コールドスタート状態の表示', () => {
    it('isColdStartがtrueで応答時間がある場合にメッセージが表示される', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'connected',
        lastResponseTime: 3000,
        isColdStart: true,
        isRetrying: false,
        retryAttempt: 0,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('接続プールがスリープ中')).toBeInTheDocument();
      expect(screen.getByText(/次のリクエストに 3.0秒 かかる可能性があります/)).toBeInTheDocument();
    });

    it('lastResponseTimeがnullの場合にデフォルトメッセージが表示される', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'connected',
        lastResponseTime: null,
        isColdStart: true,
        isRetrying: false,
        retryAttempt: 0,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('接続プールがスリープ中')).toBeInTheDocument();
      expect(screen.getByText(/次のリクエストに 1-2秒 かかる可能性があります/)).toBeInTheDocument();
    });

    it('isColdStartがfalseの場合は何も表示されない', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'connected',
        lastResponseTime: 500,
        isColdStart: false,
        isRetrying: false,
        retryAttempt: 0,
        retryMax: 3,
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('アクセシビリティ', () => {
    it('role="status"とaria-live="polite"が設定されている（リトライ中）', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'error',
        lastResponseTime: null,
        isColdStart: false,
        isRetrying: true,
        retryAttempt: 1,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);
      const indicator = screen.getByRole('status');

      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('role="status"とaria-live="polite"が設定されている（コールドスタート）', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'connected',
        lastResponseTime: 2000,
        isColdStart: true,
        isRetrying: false,
        retryAttempt: 0,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);
      const indicator = screen.getByRole('status');

      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('表示の優先順位', () => {
    it('unknown > リトライ中 の優先順位で表示されない', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'unknown',
        lastResponseTime: null,
        isColdStart: false,
        isRetrying: true,
        retryAttempt: 1,
        retryMax: 3,
      });

      const { container } = render(<ConnectionStatusIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('リトライ中 > コールドスタート の優先順位', () => {
      mockUseConnectionStatus.mockReturnValue({
        status: 'error',
        lastResponseTime: 2000,
        isColdStart: true,
        isRetrying: true,
        retryAttempt: 2,
        retryMax: 3,
      });

      render(<ConnectionStatusIndicator />);

      expect(screen.getByText('接続を再試行中')).toBeInTheDocument();
      expect(screen.queryByText('接続プールがスリープ中')).not.toBeInTheDocument();
    });
  });
});
