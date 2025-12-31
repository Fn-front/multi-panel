import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPanel } from '../index';
import { usePanels } from '@/contexts/PanelsContext';
import type { Panel } from '@/types';

// モックの設定
jest.mock('@/contexts/PanelsContext');
jest.mock('@/components/VideoPlayer', () => ({
  VideoPlayer: ({ url }: { url: string }) => (
    <div data-testid='video-player'>{url}</div>
  ),
}));
jest.mock('@/components/URLInput', () => ({
  URLInput: ({
    currentUrl,
    onUrlChange,
  }: {
    currentUrl: string;
    onUrlChange: (url: string) => void;
  }) => (
    <input
      data-testid='url-input'
      value={currentUrl}
      onChange={(e) => onUrlChange(e.target.value)}
    />
  ),
}));
jest.mock('@/components/VolumeControl', () => ({
  VolumeControl: ({
    volume,
    muted,
    onVolumeChange,
    onMutedChange,
  }: {
    volume: number;
    muted: boolean;
    onVolumeChange: (volume: number) => void;
    onMutedChange: (muted: boolean) => void;
  }) => (
    <div data-testid='volume-control'>
      <input
        data-testid='volume-slider'
        type='range'
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
      />
      <button data-testid='mute-button' onClick={() => onMutedChange(!muted)}>
        {muted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  ),
}));

const mockUsePanels = usePanels as jest.MockedFunction<typeof usePanels>;

describe('VideoPanel component', () => {
  const mockUpdatePanel = jest.fn();
  const mockRemovePanel = jest.fn();

  const mockPanel: Panel = {
    id: 'panel-1',
    url: 'https://www.youtube.com/watch?v=test123',
    volume: 0.5,
    isMuted: false,
    showChat: false,
    layout: { x: 0, y: 0, w: 4, h: 3 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePanels.mockReturnValue({
      updatePanel: mockUpdatePanel,
      removePanel: mockRemovePanel,
    } as ReturnType<typeof usePanels>);
  });

  describe('基本レンダリング', () => {
    it('パネルが表示される', () => {
      const { container } = render(<VideoPanel panel={mockPanel} />);
      const panel = container.querySelector('.panel');
      expect(panel).toBeInTheDocument();
    });

    it('コントロールバーが表示される', () => {
      const { container } = render(<VideoPanel panel={mockPanel} />);
      const controlBar = container.querySelector('.controlBar');
      expect(controlBar).toBeInTheDocument();
    });

    it('ドラッグハンドルが表示される', () => {
      const { container } = render(<VideoPanel panel={mockPanel} />);
      const dragHandle = container.querySelector('.dragHandle');
      expect(dragHandle).toBeInTheDocument();
    });

    it('URLInputが表示される', () => {
      render(<VideoPanel panel={mockPanel} />);
      expect(screen.getByTestId('url-input')).toBeInTheDocument();
    });

    it('VolumeControlが表示される', () => {
      render(<VideoPanel panel={mockPanel} />);
      expect(screen.getByTestId('volume-control')).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(<VideoPanel panel={mockPanel} />);
      const removeButton = screen.getByLabelText('パネルを削除');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('VideoPlayerの表示', () => {
    it('URLがある場合はVideoPlayerが表示される', () => {
      render(<VideoPanel panel={mockPanel} />);
      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    it('URLがある場合はVideoPlayerに正しいpropsが渡される', () => {
      render(<VideoPanel panel={mockPanel} />);
      const videoPlayer = screen.getByTestId('video-player');
      expect(videoPlayer).toHaveTextContent(mockPanel.url);
    });

    it('URLがない場合はプレースホルダーが表示される', () => {
      const emptyPanel = { ...mockPanel, url: '' };
      render(<VideoPanel panel={emptyPanel} />);
      expect(
        screen.getByText('YouTube動画URLを入力してください'),
      ).toBeInTheDocument();
    });

    it('URLがない場合はVideoPlayerが表示されない', () => {
      const emptyPanel = { ...mockPanel, url: '' };
      render(<VideoPanel panel={emptyPanel} />);
      expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
    });
  });

  describe('URL変更', () => {
    it('URLを変更するとupdatePanelが呼ばれる', () => {
      render(<VideoPanel panel={mockPanel} />);
      const urlInput = screen.getByTestId('url-input');
      fireEvent.change(urlInput, {
        target: { value: 'https://www.youtube.com/watch?v=new-url' },
      });

      expect(mockUpdatePanel).toHaveBeenCalledWith(mockPanel.id, {
        url: 'https://www.youtube.com/watch?v=new-url',
      });
    });

    it('URLInputに現在のURLが渡される', () => {
      render(<VideoPanel panel={mockPanel} />);
      const urlInput = screen.getByTestId('url-input') as HTMLInputElement;
      expect(urlInput.value).toBe(mockPanel.url);
    });
  });

  describe('音量変更', () => {
    it('音量を変更するとupdatePanelが呼ばれる', () => {
      render(<VideoPanel panel={mockPanel} />);
      const volumeSlider = screen.getByTestId('volume-slider');
      fireEvent.change(volumeSlider, { target: { value: '0.8' } });

      expect(mockUpdatePanel).toHaveBeenCalledWith(mockPanel.id, {
        volume: 0.8,
      });
    });

    it('VolumeControlに正しいpropsが渡される', () => {
      render(<VideoPanel panel={mockPanel} />);
      const volumeSlider = screen.getByTestId(
        'volume-slider',
      ) as HTMLInputElement;
      expect(volumeSlider.value).toBe(mockPanel.volume.toString());
    });
  });

  describe('ミュート変更', () => {
    it('ミュートボタンをクリックするとupdatePanelが呼ばれる', () => {
      render(<VideoPanel panel={mockPanel} />);
      const muteButton = screen.getByTestId('mute-button');
      fireEvent.click(muteButton);

      expect(mockUpdatePanel).toHaveBeenCalledWith(mockPanel.id, {
        isMuted: true,
      });
    });

    it('ミュート状態からクリックするとミュート解除される', () => {
      const mutedPanel = { ...mockPanel, isMuted: true };
      render(<VideoPanel panel={mutedPanel} />);
      const muteButton = screen.getByTestId('mute-button');
      fireEvent.click(muteButton);

      expect(mockUpdatePanel).toHaveBeenCalledWith(mockPanel.id, {
        isMuted: false,
      });
    });

    it('ミュート状態が正しく表示される', () => {
      render(<VideoPanel panel={mockPanel} />);
      const muteButton = screen.getByTestId('mute-button');
      expect(muteButton).toHaveTextContent('Mute');
    });

    it('ミュート中は正しく表示される', () => {
      const mutedPanel = { ...mockPanel, isMuted: true };
      render(<VideoPanel panel={mutedPanel} />);
      const muteButton = screen.getByTestId('mute-button');
      expect(muteButton).toHaveTextContent('Unmute');
    });
  });

  describe('パネル削除', () => {
    it('削除ボタンをクリックするとremovePanelが呼ばれる', () => {
      render(<VideoPanel panel={mockPanel} />);
      const removeButton = screen.getByLabelText('パネルを削除');
      fireEvent.click(removeButton);

      expect(mockRemovePanel).toHaveBeenCalledWith(mockPanel.id);
    });

    it('削除ボタンのtype属性がbuttonである', () => {
      render(<VideoPanel panel={mockPanel} />);
      const removeButton = screen.getByLabelText('パネルを削除');
      expect(removeButton).toHaveAttribute('type', 'button');
    });
  });

  describe('異なるパネルデータ', () => {
    it('異なるURLのパネルが正しく表示される', () => {
      const differentPanel = {
        ...mockPanel,
        id: 'panel-2',
        url: 'https://www.youtube.com/watch?v=different',
      };
      render(<VideoPanel panel={differentPanel} />);
      const videoPlayer = screen.getByTestId('video-player');
      expect(videoPlayer).toHaveTextContent(differentPanel.url);
    });

    it('異なる音量のパネルが正しく表示される', () => {
      const differentPanel = { ...mockPanel, volume: 0.3 };
      render(<VideoPanel panel={differentPanel} />);
      const volumeSlider = screen.getByTestId(
        'volume-slider',
      ) as HTMLInputElement;
      expect(volumeSlider.value).toBe('0.3');
    });
  });
});
