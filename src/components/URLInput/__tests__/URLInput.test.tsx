import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { URLInput } from '../index';
import { useURLInput } from '../hooks/useURLInput';

// useURLInputフックをモック
jest.mock('../hooks/useURLInput');

const mockUseURLInput = useURLInput as jest.MockedFunction<typeof useURLInput>;

describe('URLInput component', () => {
  const mockOnUrlChange = jest.fn();
  const mockHandleInputChange = jest.fn();
  const mockHandleSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseURLInput.mockReturnValue({
      inputValue: '',
      error: null,
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
    });
  });

  describe('基本レンダリング', () => {
    it('入力フィールドが表示される', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      expect(input).toBeInTheDocument();
    });

    it('送信ボタンが表示される', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const button = screen.getByLabelText('動画を読み込み');
      expect(button).toBeInTheDocument();
    });

    it('フォームが表示される', () => {
      const { container } = render(
        <URLInput currentUrl='' onUrlChange={mockOnUrlChange} />,
      );
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('入力フィールドの属性', () => {
    it('type属性がtextである', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('maxLength属性が設定されている', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      expect(input).toHaveAttribute('maxLength', '2000');
    });

    it('autoComplete属性がoffである', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      expect(input).toHaveAttribute('autoComplete', 'off');
    });

    it('spellCheck属性がfalseである', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      expect(input).toHaveAttribute('spellCheck', 'false');
    });
  });

  describe('入力値の表示', () => {
    it('hookから返される入力値が表示される', () => {
      mockUseURLInput.mockReturnValue({
        inputValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        error: null,
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
      });

      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText(
        'YouTube動画URLを入力',
      ) as HTMLInputElement;
      expect(input.value).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('空の入力値が表示される', () => {
      mockUseURLInput.mockReturnValue({
        inputValue: '',
        error: null,
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
      });

      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const input = screen.getByPlaceholderText(
        'YouTube動画URLを入力',
      ) as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('入力変更イベント', () => {
    it('入力時にhandleInputChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);

      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      await user.type(input, 'test');

      expect(mockHandleInputChange).toHaveBeenCalled();
    });

    it('onChangeイベントがhandleInputChangeにバインドされる', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);

      const input = screen.getByPlaceholderText('YouTube動画URLを入力');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('フォーム送信', () => {
    it('送信ボタンのtype属性がsubmitである', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const button = screen.getByLabelText('動画を読み込み');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('フォーム送信時にhandleSubmitが呼ばれる', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);

      const form = screen.getByRole('textbox').closest('form')!;
      fireEvent.submit(form);

      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it('送信ボタンクリックでフォームが送信される', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);

      const button = screen.getByLabelText('動画を読み込み');
      fireEvent.click(button);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('エラー表示', () => {
    it('エラーがない場合はエラーメッセージが表示されない', () => {
      mockUseURLInput.mockReturnValue({
        inputValue: '',
        error: null,
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
      });

      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const errorElement = screen.queryByText(/エラー/);
      expect(errorElement).not.toBeInTheDocument();
    });

    it('エラーがある場合はエラーメッセージが表示される', () => {
      const errorMessage = '有効なYouTube動画URLを入力してください';
      mockUseURLInput.mockReturnValue({
        inputValue: 'invalid-url',
        error: errorMessage,
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
      });

      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('異なるエラーメッセージが正しく表示される', () => {
      const errorMessage = 'URLが長すぎます（最大2000文字）';
      mockUseURLInput.mockReturnValue({
        inputValue: 'a'.repeat(2001),
        error: errorMessage,
        handleInputChange: mockHandleInputChange,
        handleSubmit: mockHandleSubmit,
      });

      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('アイコンの表示', () => {
    it('送信ボタンにアイコンが含まれる', () => {
      render(<URLInput currentUrl='' onUrlChange={mockOnUrlChange} />);
      const button = screen.getByLabelText('動画を読み込み');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('propsの変更', () => {
    it('useURLInputに正しいpropsが渡される', () => {
      const currentUrl = 'https://www.youtube.com/watch?v=test123';
      render(<URLInput currentUrl={currentUrl} onUrlChange={mockOnUrlChange} />);

      expect(mockUseURLInput).toHaveBeenCalledWith({
        currentUrl,
        onUrlChange: mockOnUrlChange,
      });
    });

    it('異なるpropsでuseURLInputが呼ばれる', () => {
      const currentUrl = 'https://www.youtube.com/watch?v=different';
      const differentOnChange = jest.fn();
      render(
        <URLInput currentUrl={currentUrl} onUrlChange={differentOnChange} />,
      );

      expect(mockUseURLInput).toHaveBeenCalledWith({
        currentUrl,
        onUrlChange: differentOnChange,
      });
    });
  });
});
