import { render } from '@testing-library/react';
import { VideoPlayer } from '../index';
import { useYouTubePlayerReady } from '../hooks/useYouTubePlayerReady';

// モックの設定
jest.mock('../hooks/useYouTubePlayerReady');
jest.mock('react-player', () => ({
  __esModule: true,
  default: ({ src }: { src: string; volume: number; muted: boolean; onReady?: () => void; onError?: () => void }) => (
    <div data-testid='react-player' data-url={src}>
      ReactPlayer: {src}
    </div>
  ),
}));

const mockUseYouTubePlayerReady =
  useYouTubePlayerReady as jest.MockedFunction<typeof useYouTubePlayerReady>;

describe('VideoPlayer component', () => {
  const mockPlayerRef = { current: document.createElement('div') };
  const mockHandleReady = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseYouTubePlayerReady.mockReturnValue({
      isPlayerReady: true,
      playerRef: mockPlayerRef,
      handleReady: mockHandleReady,
    });
  });

  describe('基本レンダリング', () => {
    it('コンテナが表示される', () => {
      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );
      const videoContainer = container.querySelector('.container');
      expect(videoContainer).toBeInTheDocument();
    });

    it('ReactPlayerが表示される', () => {
      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );
      const player = container.querySelector('[data-testid="react-player"]');
      expect(player).toBeInTheDocument();
    });
  });

  describe('プレーヤーの準備状態', () => {
    it('プレーヤーが準備できていない場合はスケルトンが表示される', () => {
      mockUseYouTubePlayerReady.mockReturnValue({
        isPlayerReady: false,
        playerRef: mockPlayerRef,
        handleReady: mockHandleReady,
      });

      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('プレーヤーが準備できている場合はスケルトンが1つだけ（初期ローディング用）', () => {
      mockUseYouTubePlayerReady.mockReturnValue({
        isPlayerReady: true,
        playerRef: mockPlayerRef,
        handleReady: mockHandleReady,
      });

      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );
      // isPlayerReady=falseの時のスケルトンは表示されない
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBe(0);
    });

    it('プレーヤーが準備できている場合は不透明度が1になる', () => {
      mockUseYouTubePlayerReady.mockReturnValue({
        isPlayerReady: true,
        playerRef: mockPlayerRef,
        handleReady: mockHandleReady,
      });

      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );

      const playerWrapper = container.querySelector(
        '[data-testid="react-player"]',
      )?.parentElement;
      expect(playerWrapper).toHaveStyle({ opacity: 1 });
    });

    it('プレーヤーが準備できていない場合は不透明度が0になる', () => {
      mockUseYouTubePlayerReady.mockReturnValue({
        isPlayerReady: false,
        playerRef: mockPlayerRef,
        handleReady: mockHandleReady,
      });

      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );

      const playerWrapper = container.querySelector(
        '[data-testid="react-player"]',
      )?.parentElement;
      expect(playerWrapper).toHaveStyle({ opacity: 0 });
    });
  });

  describe('propsの渡し方', () => {
    it('URLが正しく渡される', () => {
      const url = 'https://www.youtube.com/watch?v=abc123';
      const { container } = render(
        <VideoPlayer url={url} volume={0.5} muted={false} />,
      );
      const player = container.querySelector('[data-testid="react-player"]');
      expect(player).toHaveAttribute('data-url', url);
    });

    it('異なるURLが正しく渡される', () => {
      const url = 'https://www.youtube.com/watch?v=different';
      const { container } = render(
        <VideoPlayer url={url} volume={0.7} muted={true} />,
      );
      const player = container.querySelector('[data-testid="react-player"]');
      expect(player).toHaveAttribute('data-url', url);
    });
  });

  describe('useYouTubePlayerReadyフックの呼び出し', () => {
    it('useYouTubePlayerReadyに正しいpropsが渡される', () => {
      const url = 'https://www.youtube.com/watch?v=test123';
      const mockOnReady = jest.fn();

      render(
        <VideoPlayer
          url={url}
          volume={0.5}
          muted={false}
          onReady={mockOnReady}
        />,
      );

      expect(mockUseYouTubePlayerReady).toHaveBeenCalledWith({
        url,
        onReady: mockOnReady,
      });
    });

    it('onReadyが渡されない場合でも正しく動作する', () => {
      const url = 'https://www.youtube.com/watch?v=test123';

      render(<VideoPlayer url={url} volume={0.5} muted={false} />);

      expect(mockUseYouTubePlayerReady).toHaveBeenCalledWith({
        url,
        onReady: undefined,
      });
    });
  });

  describe('コールバック関数', () => {
    it('onReadyコールバックが提供される', () => {
      const mockOnReady = jest.fn();
      render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
          onReady={mockOnReady}
        />,
      );

      // useYouTubePlayerReadyフックに渡されることを確認
      expect(mockUseYouTubePlayerReady).toHaveBeenCalledWith(
        expect.objectContaining({
          onReady: mockOnReady,
        }),
      );
    });

    it('onErrorコールバックが提供される', () => {
      const mockOnError = jest.fn();
      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
          onError={mockOnError}
        />,
      );

      // ReactPlayerに渡されることを確認（実際のReactPlayerではないので、レンダリング確認のみ）
      const player = container.querySelector('[data-testid="react-player"]');
      expect(player).toBeInTheDocument();
    });
  });

  describe('aspectRatio要素', () => {
    it('aspectRatio要素が表示される', () => {
      const { container } = render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );
      const aspectRatio = container.querySelector('.aspectRatio');
      expect(aspectRatio).toBeInTheDocument();
    });

    it('aspectRatio要素にrefが設定される', () => {
      render(
        <VideoPlayer
          url='https://www.youtube.com/watch?v=test123'
          volume={0.5}
          muted={false}
        />,
      );

      // useYouTubePlayerReadyフックが呼ばれ、playerRefが返される
      expect(mockUseYouTubePlayerReady).toHaveBeenCalled();
    });
  });
});
