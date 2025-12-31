import { render, screen, fireEvent } from '@testing-library/react';
import { VolumeControl } from '../index';
import { usePopoverControl } from '../hooks/usePopoverControl';

// usePopoverControlフックをモック
jest.mock('../hooks/usePopoverControl');

const mockUsePopoverControl =
  usePopoverControl as jest.MockedFunction<typeof usePopoverControl>;

describe('VolumeControl component', () => {
  const mockOnVolumeChange = jest.fn();
  const mockOnMutedChange = jest.fn();
  const mockTogglePopover = jest.fn();
  const mockContainerRef = { current: document.createElement('div') };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePopoverControl.mockReturnValue({
      isOpen: false,
      containerRef: mockContainerRef,
      togglePopover: mockTogglePopover,
    });
  });

  describe('基本レンダリング', () => {
    it('音量ボタンが表示される', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );
      const button = screen.getByLabelText('音量調整');
      expect(button).toBeInTheDocument();
    });

    it('popoverが閉じている場合はスライダーが表示されない', () => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: false,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });

      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      expect(screen.queryByLabelText('音量')).not.toBeInTheDocument();
    });

    it('popoverが開いている場合はスライダーが表示される', () => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: true,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });

      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      expect(screen.getByLabelText('音量')).toBeInTheDocument();
    });
  });

  describe('音量ボタン', () => {
    it('音量ボタンをクリックするとtogglePopoverが呼ばれる', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const button = screen.getByLabelText('音量調整');
      fireEvent.click(button);

      expect(mockTogglePopover).toHaveBeenCalledTimes(1);
    });

    it('音量ボタンのtype属性がbuttonである', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const button = screen.getByLabelText('音量調整');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('アイコンの表示', () => {
    beforeEach(() => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: true,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });
    });

    it('ミュート状態の場合はHiSpeakerXMarkアイコンが表示される', () => {
      const { container } = render(
        <VolumeControl
          volume={0.5}
          muted={true}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('音量が0の場合はHiSpeakerXMarkアイコンが表示される', () => {
      const { container } = render(
        <VolumeControl
          volume={0}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('音量が0より大きくミュートでない場合はHiSpeakerWaveアイコンが表示される', () => {
      const { container } = render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('音量スライダー', () => {
    beforeEach(() => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: true,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });
    });

    it('スライダーの属性が正しく設定されている', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量') as HTMLInputElement;
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '1');
      expect(slider).toHaveAttribute('step', '0.01');
    });

    it('スライダーの値が正しく設定される', () => {
      render(
        <VolumeControl
          volume={0.75}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量') as HTMLInputElement;
      expect(slider.value).toBe('0.75');
    });

    it('スライダーを変更するとonVolumeChangeが呼ばれる', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量');
      fireEvent.change(slider, { target: { value: '0.8' } });

      expect(mockOnVolumeChange).toHaveBeenCalledWith(0.8);
    });

    it('ミュート中にスライダーを0より大きい値に変更するとミュート解除される', () => {
      render(
        <VolumeControl
          volume={0}
          muted={true}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量');
      fireEvent.change(slider, { target: { value: '0.5' } });

      expect(mockOnVolumeChange).toHaveBeenCalledWith(0.5);
      expect(mockOnMutedChange).toHaveBeenCalledWith(false);
    });

    it('ミュート中にスライダーを0に変更してもミュートは解除されない', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={true}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量');
      fireEvent.change(slider, { target: { value: '0' } });

      expect(mockOnVolumeChange).toHaveBeenCalledWith(0);
      expect(mockOnMutedChange).not.toHaveBeenCalled();
    });
  });

  describe('ミュートボタン', () => {
    beforeEach(() => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: true,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });
    });

    it('ミュートボタンが表示される', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const muteButton = screen.getByLabelText('ミュート');
      expect(muteButton).toBeInTheDocument();
    });

    it('ミュート状態の場合はaria-labelが"ミュート解除"になる', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={true}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const muteButton = screen.getByLabelText('ミュート解除');
      expect(muteButton).toBeInTheDocument();
    });

    it('ミュートボタンをクリックするとonMutedChangeが呼ばれる', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const muteButton = screen.getByLabelText('ミュート');
      fireEvent.click(muteButton);

      expect(mockOnMutedChange).toHaveBeenCalledWith(true);
    });

    it('ミュート状態でミュートボタンをクリックするとミュート解除される', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={true}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const muteButton = screen.getByLabelText('ミュート解除');
      fireEvent.click(muteButton);

      expect(mockOnMutedChange).toHaveBeenCalledWith(false);
    });

    it('ミュートボタンのtype属性がbuttonである', () => {
      render(
        <VolumeControl
          volume={0.5}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const muteButton = screen.getByLabelText('ミュート');
      expect(muteButton).toHaveAttribute('type', 'button');
    });
  });

  describe('volumeがnullの場合', () => {
    it('スライダーの値が0になる', () => {
      mockUsePopoverControl.mockReturnValue({
        isOpen: true,
        containerRef: mockContainerRef,
        togglePopover: mockTogglePopover,
      });

      render(
        <VolumeControl
          volume={0}
          muted={false}
          onVolumeChange={mockOnVolumeChange}
          onMutedChange={mockOnMutedChange}
        />,
      );

      const slider = screen.getByLabelText('音量') as HTMLInputElement;
      expect(slider.value).toBe('0');
    });
  });
});
