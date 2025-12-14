import styles from './Skeleton.module.scss';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  variant?: 'box' | 'circle' | 'text';
  className?: string;
};

/**
 * 共通スケルトンコンポーネント
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  variant = 'box',
  className = '',
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const variantClass = variant === 'circle' ? styles.circle : styles.box;

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={style}
    />
  );
}
