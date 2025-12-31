import { render, screen, fireEvent } from '@testing-library/react';
import { PanelContainer } from '../index';
import { usePanels } from '@/contexts/PanelsContext';
import { useWindowSize } from '@/hooks/useWindowSize';

// モックの設定
jest.mock('@/contexts/PanelsContext');
jest.mock('@/hooks/useWindowSize');
jest.mock('@/components/VideoPanel', () => ({
  VideoPanel: ({ panel }: any) => <div data-testid={`video-panel-${panel.id}`}>VideoPanel</div>,
}));

const mockUsePanels = usePanels as jest.MockedFunction<typeof usePanels>;
const mockUseWindowSize = useWindowSize as jest.MockedFunction<typeof useWindowSize>;

describe('PanelContainer component', () => {
  const mockUpdateLayout = jest.fn();
  const mockAddPanel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWindowSize.mockReturnValue({
      width: 1200,
      height: 800,
      isMobile: false,
    });
  });

  describe('ローディング状態', () => {
    it('isLoadingがtrueの場合はスケルトンが表示される', () => {
      mockUsePanels.mockReturnValue({
        state: { panels: [] },
        isLoading: true,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);

      const { container } = render(<PanelContainer />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('isLoadingがtrueの場合はツールバーのスケルトンが表示される', () => {
      mockUsePanels.mockReturnValue({
        state: { panels: [] },
        isLoading: true,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);

      render(<PanelContainer />);
      const { container } = render(<PanelContainer />);
      const toolbar = container.querySelector('.toolbar');
      expect(toolbar).toBeInTheDocument();
    });
  });

  describe('パネルが空の場合', () => {
    beforeEach(() => {
      mockUsePanels.mockReturnValue({
        state: { panels: [] },
        isLoading: false,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);
    });

    it('空メッセージが表示される', () => {
      render(<PanelContainer />);
      expect(screen.getByText('パネルがありません')).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      render(<PanelContainer />);
      const addButtons = screen.getAllByLabelText('パネルを追加');
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('大きな追加ボタンをクリックするとaddPanelが呼ばれる', () => {
      render(<PanelContainer />);
      const addButtons = screen.getAllByLabelText('パネルを追加');
      fireEvent.click(addButtons[addButtons.length - 1]); // 大きいボタン

      expect(mockAddPanel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          url: '',
          volume: 0.5,
          isMuted: false,
          showChat: false,
        }),
      );
    });
  });

  describe('パネルがある場合', () => {
    const mockPanels = [
      {
        id: 'panel-1',
        url: 'https://www.youtube.com/watch?v=test1',
        volume: 0.5,
        isMuted: false,
        showChat: false,
        layout: { x: 0, y: 0, w: 4, h: 3 },
      },
      {
        id: 'panel-2',
        url: 'https://www.youtube.com/watch?v=test2',
        volume: 0.7,
        isMuted: false,
        showChat: true,
        layout: { x: 4, y: 0, w: 4, h: 3 },
      },
    ];

    beforeEach(() => {
      mockUsePanels.mockReturnValue({
        state: { panels: mockPanels },
        isLoading: false,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);
    });

    it('パネルが表示される', () => {
      render(<PanelContainer />);
      expect(screen.getByTestId('video-panel-panel-1')).toBeInTheDocument();
      expect(screen.getByTestId('video-panel-panel-2')).toBeInTheDocument();
    });

    it('ツールバーの追加ボタンが表示される', () => {
      render(<PanelContainer />);
      const addButton = screen.getByRole('button', { name: 'パネルを追加' });
      expect(addButton).toBeInTheDocument();
    });

    it('追加ボタンをクリックするとaddPanelが呼ばれる', () => {
      render(<PanelContainer />);
      const addButton = screen.getByRole('button', { name: 'パネルを追加' });
      fireEvent.click(addButton);

      expect(mockAddPanel).toHaveBeenCalledTimes(1);
    });

    it('空メッセージが表示されない', () => {
      render(<PanelContainer />);
      expect(screen.queryByText('パネルがありません')).not.toBeInTheDocument();
    });
  });

  describe('モバイル表示', () => {
    beforeEach(() => {
      mockUseWindowSize.mockReturnValue({
        width: 375,
        height: 667,
        isMobile: true,
      });
      mockUsePanels.mockReturnValue({
        state: {
          panels: [
            {
              id: 'panel-1',
              url: 'https://www.youtube.com/watch?v=test1',
              volume: 0.5,
              isMuted: false,
              showChat: false,
              layout: { x: 0, y: 0, w: 4, h: 3 },
            },
          ],
        },
        isLoading: false,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);
    });

    it('カラム切り替えボタンが表示される', () => {
      render(<PanelContainer />);
      const columnButton = screen.getByLabelText('1カラム表示');
      expect(columnButton).toBeInTheDocument();
    });

    it('カラム切り替えボタンをクリックすると表示が変わる', () => {
      render(<PanelContainer />);
      const columnButton = screen.getByLabelText('1カラム表示');
      fireEvent.click(columnButton);

      const updatedButton = screen.getByLabelText('2カラム表示');
      expect(updatedButton).toBeInTheDocument();
    });

    it('カラム切り替えボタンを2回クリックすると元に戻る', () => {
      render(<PanelContainer />);
      const columnButton = screen.getByLabelText('1カラム表示');

      fireEvent.click(columnButton);
      const twoColumnButton = screen.getByLabelText('2カラム表示');
      fireEvent.click(twoColumnButton);

      const oneColumnButton = screen.getByLabelText('1カラム表示');
      expect(oneColumnButton).toBeInTheDocument();
    });
  });

  describe('デスクトップ表示', () => {
    beforeEach(() => {
      mockUseWindowSize.mockReturnValue({
        width: 1200,
        height: 800,
        isMobile: false,
      });
      mockUsePanels.mockReturnValue({
        state: {
          panels: [
            {
              id: 'panel-1',
              url: 'https://www.youtube.com/watch?v=test1',
              volume: 0.5,
              isMuted: false,
              showChat: false,
              layout: { x: 0, y: 0, w: 4, h: 3 },
            },
          ],
        },
        isLoading: false,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);
    });

    it('カラム切り替えボタンが表示されない', () => {
      render(<PanelContainer />);
      expect(screen.queryByLabelText(/カラム表示/)).not.toBeInTheDocument();
    });
  });

  describe('ボタンの属性', () => {
    beforeEach(() => {
      mockUsePanels.mockReturnValue({
        state: { panels: [] },
        isLoading: false,
        updateLayout: mockUpdateLayout,
        addPanel: mockAddPanel,
      } as any);
    });

    it('追加ボタンのtype属性がbuttonである', () => {
      render(<PanelContainer />);
      const addButtons = screen.getAllByRole('button', { name: 'パネルを追加' });
      addButtons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });
});
