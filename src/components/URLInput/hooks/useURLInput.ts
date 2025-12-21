import { useState, useCallback } from 'react';
import { isValidYouTubeVideoUrl } from '@/utils/youtube';
import { sanitizeInput, VALIDATION_CONSTANTS } from '@/utils/validation';
import { UI_TEXT } from '@/constants';

interface UseURLInputProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

/**
 * URL入力のバリデーションとサニタイズを管理するフック
 */
export function useURLInput({ currentUrl, onUrlChange }: UseURLInputProps) {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [error, setError] = useState('');

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // 入力値の長さ制限
      if (value.length > VALIDATION_CONSTANTS.MAX_URL_LENGTH) {
        setError(
          UI_TEXT.PANEL.URL_TOO_LONG(VALIDATION_CONSTANTS.MAX_URL_LENGTH),
        );
        return;
      }

      setInputValue(value);
      setError('');
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // サニタイズ
      const sanitized = sanitizeInput(inputValue);

      // 空文字列の場合はクリア
      if (!sanitized) {
        setError('');
        onUrlChange('');
        return;
      }

      if (!isValidYouTubeVideoUrl(sanitized)) {
        setError(UI_TEXT.PANEL.INVALID_URL);
        return;
      }

      setError('');
      onUrlChange(sanitized);
    },
    [inputValue, onUrlChange],
  );

  return {
    inputValue,
    error,
    handleInputChange,
    handleSubmit,
  };
}
