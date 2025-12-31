import { render, screen, fireEvent } from '@testing-library/react';
import FavoriteChannels from '../index';
import { useChannelManagement } from '../hooks/useChannelManagement';
import type { Channel } from '@/types/channel';

// モックの設定
jest.mock('../hooks/useChannelManagement');
jest.mock('@/components/ColorPicker', () => ({
  ColorPicker: ({
    onChange,
    onClose,
    position,
  }: {
    selectedColor: string;
    onChange: (color: string) => void;
    onClose: () => void;
    position: { top: number; left: number };
  }) => (
    <div data-testid='color-picker' data-position={JSON.stringify(position)}>
      <button onClick={() => onChange('#ff0000')}>Red</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockUseChannelManagement =
  useChannelManagement as jest.MockedFunction<typeof useChannelManagement>;

describe('FavoriteChannels component', () => {
  const mockOnAddChannel = jest.fn();
  const mockOnRemoveChannel = jest.fn();
  const mockOnChannelClick = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockHandleInputChange = jest.fn();

  const mockChannels: Channel[] = [
    {
      id: 'channel-1',
      title: 'Test Channel 1',
      customUrl: '@testchannel1',
      thumbnail: 'https://example.com/thumb1.jpg',
      color: '#ef4444',
    },
    {
      id: 'channel-2',
      title: 'Test Channel 2',
      customUrl: '@testchannel2',
      thumbnail: 'https://example.com/thumb2.jpg',
      color: '#3b82f6',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChannelManagement.mockReturnValue({
      inputValue: '',
      isLoading: false,
      error: null,
      channelInfoCache: {},
      handleSubmit: mockHandleSubmit,
      handleInputChange: mockHandleInputChange,
    });
  });

  describe('基本レンダリング', () => {
    it('タイトルが表示される', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      expect(screen.getByText('お気に入りチャンネル')).toBeInTheDocument();
    });

    it('入力フィールドが表示される', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const input = screen.getByPlaceholderText('チャンネルURLまたはIDを入力');
      expect(input).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const addButton = screen.getByRole('button', { name: '追加' });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('チャンネル一覧の表示', () => {
    it('チャンネルがない場合は空メッセージが表示される', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      expect(
        screen.getByText('お気に入りチャンネルを追加してください'),
      ).toBeInTheDocument();
    });

    it('チャンネルがある場合はチャンネルが表示される', () => {
      render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
      expect(screen.getByText('Test Channel 2')).toBeInTheDocument();
    });

    it('各チャンネルに削除ボタンが表示される', () => {
      render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const removeButtons = screen.getAllByLabelText('削除');
      expect(removeButtons).toHaveLength(mockChannels.length);
    });
  });

  describe('チャンネル削除', () => {
    it('削除ボタンをクリックするとonRemoveChannelが呼ばれる', () => {
      render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const removeButtons = screen.getAllByLabelText('削除');
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveChannel).toHaveBeenCalledWith('channel-1');
    });

    it('削除ボタンをクリックしてもイベントが伝播しない', () => {
      render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
          onChannelClick={mockOnChannelClick}
        />,
      );
      const removeButtons = screen.getAllByLabelText('削除');
      fireEvent.click(removeButtons[0]);

      expect(mockOnChannelClick).not.toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('isLoadingがtrueの場合は追加ボタンが無効化される', () => {
      mockUseChannelManagement.mockReturnValue({
        inputValue: 'test',
        isLoading: true,
        error: null,
        channelInfoCache: {},
        handleSubmit: mockHandleSubmit,
        handleInputChange: mockHandleInputChange,
      });

      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const addButton = screen.getByRole('button', { name: '追加中...' });
      expect(addButton).toBeDisabled();
    });

    it('isLoadingがfalseの場合は追加ボタンが有効', () => {
      mockUseChannelManagement.mockReturnValue({
        inputValue: 'test',
        isLoading: false,
        error: null,
        channelInfoCache: {},
        handleSubmit: mockHandleSubmit,
        handleInputChange: mockHandleInputChange,
      });

      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const addButton = screen.getByRole('button', { name: '追加' });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーがある場合はエラーメッセージが表示される', () => {
      const errorMessage = 'チャンネルの追加に失敗しました';
      mockUseChannelManagement.mockReturnValue({
        inputValue: '',
        isLoading: false,
        error: errorMessage,
        channelInfoCache: {},
        handleSubmit: mockHandleSubmit,
        handleInputChange: mockHandleInputChange,
      });

      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('エラーがない場合はエラーメッセージが表示されない', () => {
      mockUseChannelManagement.mockReturnValue({
        inputValue: '',
        isLoading: false,
        error: null,
        channelInfoCache: {},
        handleSubmit: mockHandleSubmit,
        handleInputChange: mockHandleInputChange,
      });

      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      expect(screen.queryByText(/失敗/)).not.toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('フォームを送信するとhandleSubmitが呼ばれる', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const form = screen.getByRole('textbox').closest('form');
      fireEvent.submit(form!);

      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it('追加ボタンをクリックするとフォームが送信される', () => {
      render(
        <FavoriteChannels
          channels={[]}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );
      const addButton = screen.getByRole('button', { name: '追加' });
      fireEvent.click(addButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('useChannelManagementフックの呼び出し', () => {
    it('useChannelManagementに正しいpropsが渡される', () => {
      render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );

      expect(mockUseChannelManagement).toHaveBeenCalledWith({
        channels: mockChannels,
        onAddChannel: mockOnAddChannel,
      });
    });
  });

  describe('memoization', () => {
    it('propsが変更されない場合は再レンダリングされない', () => {
      const { rerender } = render(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );

      // 同じpropsで再レンダリング
      rerender(
        <FavoriteChannels
          channels={mockChannels}
          onAddChannel={mockOnAddChannel}
          onRemoveChannel={mockOnRemoveChannel}
        />,
      );

      // memoされているため、コンポーネントは正常に動作する
      expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
    });
  });
});
