'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import {
  HiChevronLeft,
  HiChevronRight,
  HiBars3,
  HiCog6Tooth,
} from 'react-icons/hi2';
import { PanelContainer } from '@/components/PanelContainer';
import FavoriteChannels from '@/components/FavoriteChannels';
import StreamCalendar from '@/components/StreamCalendar';
import { LoginModal } from '@/components/LoginModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Skeleton } from '@/components/Skeleton';
import { useChannels } from '@/contexts/ChannelContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePanels } from '@/contexts/PanelsContext';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { UI_TEXT } from '@/constants';
import { useClientMount } from './hooks/useClientMount';
import { useChannelIds } from './hooks/useChannelIds';
import { useSidebar } from './hooks/useSidebar';
import { useNotificationManager } from './hooks/useNotificationManager';
import { useAuthHandlers } from './hooks/useAuthHandlers';
import { useCalendarMonthFetch } from './hooks/useCalendarMonthFetch';
import { useCalendarEventHandler } from './hooks/useCalendarEventHandler';
import { useScrollLock } from './hooks/useScrollLock';
import { useSettingsModal } from './hooks/useSettingsModal';
import styles from './HomeClient.module.scss';

type HomeClientProps = {
  initialSidebarVisible: boolean;
};

export function HomeClient({ initialSidebarVisible }: HomeClientProps) {
  const {
    state: channelState,
    addChannel,
    removeChannel,
    updateChannel,
  } = useChannels();
  const { user, isLoading: authLoading } = useAuth();
  const { addPanel } = usePanels();

  // クライアントサイドマウント状態
  const isMounted = useClientMount();

  // チャンネルIDの配列
  const channelIds = useChannelIds(channelState.channels);

  // チャンネルIDと色のマップ
  const channelColorMap = channelState.channels.reduce<Record<string, string>>(
    (acc, channel) => {
      if (channel.color) {
        acc[channel.channelId] = channel.color;
      }
      return acc;
    },
    {},
  );

  // サイドバー管理
  const { sidebarVisible, toggleSidebar } = useSidebar(initialSidebarVisible);

  // 認証ハンドラ
  const { isLoginModalOpen, openLoginModal, closeLoginModal, handleLogout } =
    useAuthHandlers();

  // 設定モーダル
  const { isSettingsModalOpen, openSettingsModal, closeSettingsModal } =
    useSettingsModal();

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
    refreshSchedule,
  } = useCalendarEvents({
    channelIds,
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

  // モバイルでサイドバーが開いているときスクロールをロック
  useScrollLock(sidebarVisible);

  // チャンネル色変更ハンドラー
  const handleColorChange = useCallback(
    (id: string, color: string) => {
      updateChannel(id, { color });
    },
    [updateChannel],
  );

  return (
    <div className={styles.container}>
      {/* ハンバーガーメニューボタン（モバイルのみ） */}
      <button
        className={`${styles.hamburgerButton} ${sidebarVisible ? styles.hidden : ''}`}
        onClick={toggleSidebar}
        aria-label={
          sidebarVisible ? UI_TEXT.SIDEBAR.CLOSE : UI_TEXT.SIDEBAR.OPEN
        }
        type='button'
      >
        <HiBars3 />
      </button>

      {/* オーバーレイ（モバイルのみ） */}
      <div
        className={`${styles.overlay} ${sidebarVisible ? styles.visible : ''}`}
        onClick={toggleSidebar}
        aria-hidden='true'
      />

      <aside
        className={`${styles.sidebar} ${sidebarVisible ? styles.visible : styles.collapsed}`}
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
                    <Image
                      src={
                        user.user_metadata?.avatar_url ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                      }
                      alt='User avatar'
                      className={styles.userAvatar}
                      title={user.email || ''}
                      width={40}
                      height={40}
                      unoptimized
                    />
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                        type='button'
                      >
                        {UI_TEXT.AUTH.LOGOUT}
                      </button>
                      <button
                        onClick={openSettingsModal}
                        className={styles.settingsButton}
                        type='button'
                        aria-label={UI_TEXT.SETTINGS.TITLE}
                      >
                        <HiCog6Tooth />
                      </button>
                    </div>
                  </>
                ) : (
                  <Image
                    src={
                      user.user_metadata?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                    }
                    alt='User avatar'
                    className={styles.userAvatarCompact}
                    title={user.email || ''}
                    width={40}
                    height={40}
                    unoptimized
                  />
                )}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className={styles.loginButton}
                type='button'
              >
                {UI_TEXT.AUTH.LOGIN}
              </button>
            )}
            <button
              className={styles.toggleButton}
              onClick={toggleSidebar}
              aria-label={
                sidebarVisible ? UI_TEXT.SIDEBAR.CLOSE : UI_TEXT.SIDEBAR.OPEN
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
                  onColorChange={handleColorChange}
                />
              </div>

              <div className={`${styles.section} ${styles.calendarSection}`}>
                <StreamCalendar
                  onEventClick={handleEventClick}
                  events={calendarEvents}
                  isLoading={isCalendarLoading}
                  error={calendarError}
                  onRefresh={refreshSchedule}
                  onDatesSet={handleDatesSet}
                  channelColorMap={channelColorMap}
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
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        isMounted={isMounted}
        permission={permission}
        isEnabled={isEnabled}
        notifiedCount={notifiedCount}
        onToggle={handleNotificationToggle}
      />
    </div>
  );
}
