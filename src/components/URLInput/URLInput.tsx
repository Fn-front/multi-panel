'use client';

import { useState, type FormEvent } from 'react';
import { isValidYouTubeVideoUrl } from '@/utils/youtube';
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      setError('URLを入力してください');
      return;
    }

    if (!isValidYouTubeVideoUrl(inputValue)) {
      setError('有効なYouTube動画URLを入力してください');
      return;
    }

    setError('');
    onUrlChange(inputValue);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type='text'
        className={styles.input}
        placeholder='YouTube動画URLを入力'
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <button type='submit' className={styles.button}>
        読み込み
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
