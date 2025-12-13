'use client';

import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { HiArrowPath } from 'react-icons/hi2';
import { isValidYouTubeVideoUrl, sanitizeInput } from '@/utils/youtube';
import styles from './URLInput.module.scss';

type URLInputProps = {
  currentUrl: string;
  onUrlChange: (url: string) => void;
};

/**
 * YouTube URL入力コンポーネント
 */
export function URLInput({ currentUrl, onUrlChange }: URLInputProps) {
  const [inputValue, setInputValue] = useState(currentUrl);
  const [error, setError] = useState('');

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 入力値の長さ制限（2000文字）
    if (value.length > 2000) {
      setError('URLが長すぎます（最大2000文字）');
      return;
    }

    setInputValue(value);
    setError('');
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      // サニタイズ
      const sanitized = sanitizeInput(inputValue);

      if (!sanitized) {
        setError('URLを入力してください');
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type='text'
        className={styles.input}
        placeholder='YouTube動画URLを入力'
        value={inputValue}
        onChange={handleInputChange}
        maxLength={2000}
        autoComplete='off'
        spellCheck='false'
      />
      <button
        type='submit'
        className={styles.button}
        aria-label='動画を読み込み'
      >
        <HiArrowPath />
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
