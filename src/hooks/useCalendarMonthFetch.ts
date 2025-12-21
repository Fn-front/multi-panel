import { useCallback, useRef, useEffect } from 'react';
import { formatDate } from '@/utils/date';
import { callSupabaseFunction } from '@/utils/supabase';

type DateInfo = {
  start: Date;
  end: Date;
  view: { type: string };
};

type UseCalendarMonthFetchOptions = {
  channelIds: string[];
  userId: string | undefined;
  onFetchComplete: () => void;
};

/**
 * カレンダー月変更時のデータフェッチを管理するフック
 *
 * - 月単位でキャッシュし、未取得の月のみAPI呼び出し
 * - 現在月は初期キャッシュに追加（ログイン時に取得済みのため）
 * - 月末週（22日以降）の場合、来月も初期キャッシュに追加
 */
export function useCalendarMonthFetch({
  channelIds,
  userId,
  onFetchComplete,
}: UseCalendarMonthFetchOptions) {
  const fetchedMonthsRef = useRef<Set<string>>(new Set());

  // 初期キャッシュの設定
  useEffect(() => {
    // 現在月を初期キャッシュに追加（ログイン時に既に取得済みのため）
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    fetchedMonthsRef.current.add(currentMonthKey);

    // 月の最終週（22日以降）の場合、来月もキャッシュに追加
    // ログイン時のfetch-channel-streamsで既に月末までのデータ取得済みのため
    if (now.getDate() >= 22) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      fetchedMonthsRef.current.add(nextMonthKey);
    }
  }, []);

  // カレンダー月変更時のハンドラー
  const handleDatesSet = useCallback(
    async (dateInfo: DateInfo) => {
      if (!userId || channelIds.length === 0) return;

      // 月表示・週表示の場合のみ過去データを取得
      if (
        dateInfo.view.type === 'dayGridMonth' ||
        dateInfo.view.type === 'timeGridWeek'
      ) {
        // 表示範囲に含まれる月を抽出（年月でキャッシュ）
        const monthsInRange = new Set<string>();
        const currentDate = new Date(dateInfo.start);
        const endDate = new Date(dateInfo.end);

        while (currentDate <= endDate) {
          const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          monthsInRange.add(monthKey);
          currentDate.setMonth(currentDate.getMonth() + 1);
          currentDate.setDate(1); // 月の1日に設定
        }

        // 未取得の月のみフェッチ
        const monthsToFetch = Array.from(monthsInRange).filter(
          (month) => !fetchedMonthsRef.current.has(month),
        );

        if (monthsToFetch.length === 0) {
          return;
        }

        try {
          const now = new Date();

          // 各月のデータを取得
          for (const monthKey of monthsToFetch) {
            const [year, month] = monthKey.split('-').map(Number);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0); // 月末

            // 過去月・現在月・来月まで取得（週表示で月跨ぎに対応）
            // それより先の未来月はスキップ
            const nextMonth = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              1,
            );

            if (monthStart <= nextMonth) {
              await callSupabaseFunction('fetch-past-streams', {
                channelIds,
                startDate: formatDate(monthStart),
                endDate: formatDate(monthEnd),
              });
            }

            // フェッチ済みとしてマーク
            fetchedMonthsRef.current.add(monthKey);
          }

          // データ再取得
          onFetchComplete();
        } catch (error) {
          console.error(
            'Failed to fetch past streams on calendar move:',
            error,
          );
        }
      }
    },
    [userId, channelIds, onFetchComplete],
  );

  return { handleDatesSet };
}
