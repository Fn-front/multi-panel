/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * ローカルタイムゾーンで変換（UTCではない）
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 現在月の開始日と終了日を取得
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0),
  };
};

/**
 * 指定月の開始日と終了日を取得
 */
export const getMonthRange = (year: number, month: number) => {
  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0),
  };
};

/**
 * 今日から月末までの期間を取得
 */
export const getTodayToMonthEnd = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return {
    startDate: now,
    endDate: new Date(year, month + 1, 0),
  };
};
