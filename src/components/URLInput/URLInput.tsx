'use client';

import { HiArrowPath } from 'react-icons/hi2';
import { VALIDATION_CONSTANTS } from '@/utils/validation';
import { useURLInput } from './hooks/useURLInput';
import styles from './URLInput.module.scss';

type URLInputProps = {
  currentUrl: string;
  onUrlChange: (url: string) => void;
};

/**
 * YouTube URL入力コンポーネント
 */
export function URLInput({ currentUrl, onUrlChange }: URLInputProps) {
  const { inputValue, error, handleInputChange, handleSubmit } = useURLInput({
    currentUrl,
    onUrlChange,
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type='text'
        className={styles.input}
        placeholder='YouTube動画URLを入力'
        value={inputValue}
        onChange={handleInputChange}
        maxLength={VALIDATION_CONSTANTS.MAX_URL_LENGTH}
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
