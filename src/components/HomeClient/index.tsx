'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { PanelContainer } from '@/components/PanelContainer';
import FavoriteChannels from '@/components/FavoriteChannels';
import StreamCalendar from '@/components/StreamCalendar';
import { LoginModal } from '@/components/LoginModal';
import { Skeleton } from '@/components/Skeleton';
import { useChannels } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePanels } from '@/contexts/PanelsContext';
import { useStreamNotification } from '@/hooks/useStreamNotification';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import type { CalendarEvent } from '@/types/youtube';
import { formatDate } from '@/utils/date';
import { callSupabaseFunction } from '@/utils/supabase';
import styles from './HomeClient.module.scss';

type HomeClientProps = {
  initialSidebarVisible: boolean;
};

export function HomeClient({ initialSidebarVisible }: HomeClientProps) {
  const [sidebarVisible, setSidebarVisible] = useState(initialSidebarVisible);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const { state: channelState, addChannel, removeChannel } = useChannels();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { addPanel } = usePanels();

  // クライアントサイドでのみマウント状態を有効化
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // チャンネルIDの配列をメモ化
  const channelIds = useMemo(
    () => channelState.channels.map((ch) => ch.channelId),
    [channelState.channels],
  );

  // カレンダーイベント管理
  const {
    events: calendarEvents,
    isLoading: isCalendarLoading,
    error: calendarError,
    fetchSchedule,
  } = useCalendarEvents({
    channelIds,
    refreshInterval: 5 * 60 * 1000,
  });

  // 通知設定をメモ化
  const notificationOptions = useMemo(
    () => ({
      enabled: notificationEnabled,
      checkInterval: 3 * 60 * 1000, // 3分
      notifyBeforeMinutes: 5, // 5分前
    }),
    [notificationEnabled],
  );

  // 通知機能
  const { permission, requestPermission, isEnabled, notifiedCount } =
    useStreamNotification(channelIds, notificationOptions);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => {
      const newState = !prev;
      // Cookieに保存（1年間有効）
      document.cookie = `sidebar-visible=${newState}; path=/; max-age=${60 * 60 * 24 * 365}`;
      return newState;
    });
  }, []);

  const handleNotificationToggle = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    setNotificationEnabled((prev) => !prev);
  }, [permission, requestPermission]);

  const handleCalendarEventClick = useCallback(
    (event: CalendarEvent) => {
      // 新しいパネルを追加
      const newPanel = {
        id: `panel-${Date.now()}`,
        url: event.url,
        title: event.title,
        volume: 0.5,
        isMuted: false,
        showChat: true,
        layout: {
          i: `panel-${Date.now()}`,
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
      };
      addPanel(newPanel);
    },
    [addPanel],
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      alert('ログアウトに失敗しました。');
    }
  }, [signOut]);

  const handleLoginModalClose = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  // カレンダー月変更時のハンドラー
  const handleCalendarDatesSet = useCallback(
    async (dateInfo: { start: Date; end: Date; view: { type: string } }) => {
      if (!user || channelIds.length === 0) return;

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
          // 各月のデータを取得
          for (const monthKey of monthsToFetch) {
            const [year, month] = monthKey.split('-').map(Number);
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0); // 月末

            await callSupabaseFunction('fetch-past-streams', {
              channelIds,
              startDate: formatDate(monthStart),
              endDate: formatDate(monthEnd),
            });

            // フェッチ済みとしてマーク
            fetchedMonthsRef.current.add(monthKey);
          }

          // データ再取得
          fetchSchedule();
        } catch (error) {
          console.error(
            'Failed to fetch past streams on calendar move:',
            error,
          );
        }
      }
    },
    [user, channelIds, fetchSchedule],
  );

  return (
    <div className={styles.container}>
      <aside
        className={`${styles.sidebar} ${!sidebarVisible ? styles.collapsed : ''}`}
        style={
          !sidebarVisible
            ? {
                width: 'fit-content',
                minWidth: 'fit-content',
                maxWidth: 'fit-content',
              }
            : undefined
        }
      >
        <div
          className={`${styles.sidebarContent} ${!sidebarVisible ? styles.collapsed : ''}`}
        >
          <div className={styles.authSection}>
            {authLoading ? (
              <Skeleton width={40} height={40} variant='circle' />
            ) : user ? (
              <div className={styles.userInfo}>
                {sidebarVisible ? (
                  <>
                    <img
                      src={
                        user.user_metadata?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                      }
                      alt='User avatar'
                      className={styles.userAvatar}
                      title={user.email || ''}
                    />
                    <button
                      onClick={handleLogout}
                      className={styles.logoutButton}
                      type='button'
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <img
                    src={
                      user.user_metadata?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                    }
                    alt='User avatar'
                    className={styles.userAvatarCompact}
                    title={user.email || ''}
                  />
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={styles.loginButton}
                type='button'
              >
                ログイン
              </button>
            )}
            <button
              className={styles.toggleButton}
              onClick={toggleSidebar}
              aria-label={
                sidebarVisible ? 'サイドバーを閉じる' : 'サイドバーを開く'
              }
              type='button'
            >
              {sidebarVisible ? <HiChevronLeft /> : <HiChevronRight />}
            </button>
          </div>

          {sidebarVisible && user && (
            <>
              <div className={`${styles.section} ${styles.channelsSection}`}>
                <FavoriteChannels
                  channels={channelState.channels}
                  onAddChannel={addChannel}
                  onRemoveChannel={removeChannel}
                />
              </div>

              <div className={styles.notificationSettings}>
                <h3>配信通知</h3>
                {isMounted ? (
                  <>
                    <div className={styles.notificationToggle}>
                      <label>
                        {isEnabled
                          ? `通知有効 (${notifiedCount}件通知済み)`
                          : permission === 'denied'
                            ? '通知が拒否されています'
                            : '通知を有効にする'}
                      </label>
                      <button
                        onClick={handleNotificationToggle}
                        className={
                          permission === 'denied' ? styles.disabled : ''
                        }
                        disabled={permission === 'denied'}
                        type='button'
                      >
                        {isEnabled ? 'OFF' : 'ON'}
                      </button>
                    </div>
                    {permission === 'default' && (
                      <div className={styles.notificationStatus}>
                        ブラウザの通知許可が必要です
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.notificationToggle}>
                    <label>通知を有効にする</label>
                    <button type='button' disabled>
                      ON
                    </button>
                  </div>
                )}
              </div>

              <div className={`${styles.section} ${styles.calendarSection}`}>
                <StreamCalendar
                  onEventClick={handleCalendarEventClick}
                  events={calendarEvents}
                  isLoading={isCalendarLoading}
                  error={calendarError}
                  onRefresh={fetchSchedule}
                  onDatesSet={handleCalendarDatesSet}
                />
              </div>
            </>
          )}
        </div>
      </aside>

      <main className={styles.mainContent}>
        <PanelContainer />
      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} />
    </div>
  );
}
