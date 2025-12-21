import { useEffect } from 'react';

/**
 * モバイルでサイドバーが開いているときにbodyのスクロールをロックするフック
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // モバイルかどうかを判定
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // スクロールをロック
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // クリーンアップ
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}
