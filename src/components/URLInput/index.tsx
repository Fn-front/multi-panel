'use client';

import { HiArrowPath } from 'react-icons/hi2';
import { UI_TEXT } from '@/constants';
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
        placeholder={UI_TEXT.PANEL.URL_PLACEHOLDER}
        value={inputValue}
        onChange={handleInputChange}
        maxLength={VALIDATION_CONSTANTS.MAX_URL_LENGTH}
        autoComplete='off'
        spellCheck='false'
      />
      <button
        type='submit'
        className={styles.button}
        aria-label={UI_TEXT.PANEL.LOAD_VIDEO}
      >
        <HiArrowPath />
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
