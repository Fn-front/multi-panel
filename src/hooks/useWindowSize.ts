import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/constants';

/**
 * ウィンドウサイズと画面サイズ種別を監視するフック
 *
 * @param breakpoint - モバイル判定のブレークポイント（デフォルト: BREAKPOINTS.MOBILE）
 * @returns ウィンドウの幅、高さ、モバイル判定
 */
export function useWindowSize(breakpoint: number = BREAKPOINTS.MOBILE) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({
        width,
        height,
        isMobile: width <= breakpoint,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return windowSize;
}
