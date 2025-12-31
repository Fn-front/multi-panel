import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../index';

describe('Modal component', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    // body要素をクリア
    document.body.innerHTML = '';
  });

  describe('基本レンダリング', () => {
    it('isOpenがtrueの時にモーダルが表示される', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('isOpenがfalseの時にモーダルが表示されない', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('createPortalでbody要素にレンダリングされる', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByText('Modal Content');
      expect(modalContent.closest('.modal')).toBeInTheDocument();
    });
  });

  describe('タイトルの表示', () => {
    it('titleが指定された場合にヘッダーが表示される', () => {
      render(<Modal {...defaultProps} title='Test Title' />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('titleが指定されない場合にヘッダーが表示されない', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('閉じるボタンが表示される', () => {
      render(<Modal {...defaultProps} title='Test Title' />);
      const closeButton = screen.getByRole('button', { name: '閉じる' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('モーダルを閉じる操作', () => {
    it('背景をクリックするとonCloseが呼ばれる', () => {
      render(<Modal {...defaultProps} />);
      const modalBackdrop = document.querySelector('.modal') as HTMLElement;
      fireEvent.click(modalBackdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダルコンテンツをクリックしてもonCloseが呼ばれない', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen.getByText('Modal Content');
      fireEvent.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<Modal {...defaultProps} title='Test Title' />);
      const closeButton = screen.getByRole('button', { name: '閉じる' });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escapeキーを押すとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('isOpenがfalseの時はEscapeキーを押してもonCloseが呼ばれない', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} isOpen={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('スタイルのカスタマイズ', () => {
    it('maxWidthが指定された場合にスタイルが適用される', () => {
      render(<Modal {...defaultProps} maxWidth='600px' />);
      const modalContent = screen
        .getByText('Modal Content')
        .closest('.modalContent') as HTMLElement;

      expect(modalContent).toHaveStyle({ maxWidth: '600px' });
    });

    it('maxWidthが指定されない場合にスタイルが適用されない', () => {
      render(<Modal {...defaultProps} />);
      const modalContent = screen
        .getByText('Modal Content')
        .closest('.modalContent') as HTMLElement;

      expect(modalContent).not.toHaveAttribute('style');
    });
  });

  describe('イベントリスナーのクリーンアップ', () => {
    it('アンマウント時にイベントリスナーが削除される', async () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );

      unmount();

      // イベントリスナーが削除されることを確認
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('isOpenがfalseになった時にイベントリスナーが削除される', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener',
      );

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('子要素のレンダリング', () => {
    it('複雑な子要素を正しくレンダリングする', () => {
      const complexChildren = (
        <div>
          <h3>Section Title</h3>
          <p>Section Content</p>
          <button type='button'>Action</button>
        </div>
      );

      render(<Modal {...defaultProps}>{complexChildren}</Modal>);

      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Section Content')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Action' }),
      ).toBeInTheDocument();
    });
  });
});
