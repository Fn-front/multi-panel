/**
 * デバイス判定のユーティリティ関数
 */

/** モバイルデバイスの最大幅（px） */
export const MOBILE_BREAKPOINT = 768;

/**
 * 現在のデバイスがモバイルかどうかを判定
 *
 * @returns モバイルデバイスの場合true
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}
