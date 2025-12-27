import styles from './Spinner.module.scss';

type SpinnerProps = {
  size?: number;
};

/**
 * 回転スピナーコンポーネント
 */
export function Spinner({ size = 50 }: SpinnerProps) {
  const borderWidth = Math.max(5, size / 10);

  return (
    <div
      className={styles.spinner}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `${borderWidth}px solid rgba(255, 255, 255, 0.3)`,
        borderTopColor: '#fff',
      }}
    />
  );
}
