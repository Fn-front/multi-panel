'use client';

import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { PanelContainer } from '@/components/PanelContainer';
import FavoriteChannels from '@/components/FavoriteChannels';
import StreamCalendar from '@/components/StreamCalendar';
import { LoginModal } from '@/components/LoginModal';
import { Skeleton } from '@/components/Skeleton';
import { useChannels } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePanels } from '@/contexts/PanelsContext';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useClientMount } from './hooks/useClientMount';
import { useChannelIds } from './hooks/useChannelIds';
import { useSidebar } from './hooks/useSidebar';
import { useNotificationManager } from './hooks/useNotificationManager';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useCalendarMonthFetch } from './hooks/useCalendarMonthFetch';
import { useCalendarEventHandler } from './hooks/useCalendarEventHandler';
import styles from './HomeClient.module.scss';

type HomeClientProps = {
  initialSidebarVisible: boolean;
};

export function HomeClient({ initialSidebarVisible }: HomeClientProps) {
  const { state: channelState, addChannel, removeChannel } = useChannels();
  const { user, isLoading: authLoading } = useAuth();
  const { addPanel } = usePanels();

  // クライアントサイドマウント状態
  const isMounted = useClientMount();

  // チャンネルIDの配列
  const channelIds = useChannelIds(channelState.channels);

  // サイドバー管理
  const { sidebarVisible, toggleSidebar } = useSidebar(initialSidebarVisible);

  // 認証ハンドラ
  const {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    handleLogout,
  } = useAuthHandlers();

  // 通知管理
  const {
    permission,
    isEnabled,
    notifiedCount,
    handleToggle: handleNotificationToggle,
  } = useNotificationManager({ channelIds });

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

  // カレンダー月変更時のデータフェッチ
  const { handleDatesSet } = useCalendarMonthFetch({
    channelIds,
    userId: user?.id,
    onFetchComplete: fetchSchedule,
  });

  // カレンダーイベントクリックハンドラ
  const { handleEventClick } = useCalendarEventHandler({
    onAddPanel: addPanel,
  });


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
                onClick={openLoginModal}
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
                  onEventClick={handleEventClick}
                  events={calendarEvents}
                  isLoading={isCalendarLoading}
                  error={calendarError}
                  onRefresh={fetchSchedule}
                  onDatesSet={handleDatesSet}
                />
              </div>
            </>
          )}
        </div>
      </aside>

      <main className={styles.mainContent}>
        <PanelContainer />
      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}
