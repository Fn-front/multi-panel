/**
 * localStorage の安全な読み書きを提供するユーティリティ
 */

/**
 * localStorage からデータを読み込む
 * @param key ストレージキー
 * @param fallback パースに失敗した場合のフォールバック値
 * @returns パースされたデータ、または null
 */
export function loadFromStorage<T>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return fallback;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load data from localStorage (key: ${key}):`, error);
    return fallback;
  }
}

/**
 * localStorage にデータを保存する
 * @param key ストレージキー
 * @param data 保存するデータ
 */
export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to localStorage (key: ${key}):`, error);
  }
}

/**
 * localStorage からデータを削除する
 * @param key ストレージキー
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove data from localStorage (key: ${key}):`, error);
  }
}

/**
 * 配列データを localStorage に保存する（空の場合は削除）
 * @param key ストレージキー
 * @param data 配列データ
 */
export function saveArrayToStorage<T>(key: string, data: T[]): void {
  if (data.length > 0) {
    saveToStorage(key, data);
  } else {
    removeFromStorage(key);
  }
}
