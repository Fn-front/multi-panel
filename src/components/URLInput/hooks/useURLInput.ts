import { useState, useCallback } from 'react';
import { isValidYouTubeVideoUrl } from '@/utils/youtube';
import { sanitizeInput, VALIDATION_CONSTANTS } from '@/utils/validation';

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
          `URLが長すぎます（最大${VALIDATION_CONSTANTS.MAX_URL_LENGTH}文字）`,
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
        setError('有効なYouTube動画URLを入力してください');
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
