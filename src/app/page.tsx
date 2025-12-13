'use client';

import { useState, useCallback, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { PanelContainer } from '@/components/PanelContainer';
import FavoriteChannels from '@/components/FavoriteChannels';
import StreamCalendar from '@/components/StreamCalendar';
import { useChannels } from '@/contexts/ChannelContext';
import { useStreamNotification } from '@/hooks/useStreamNotification';
import type { CalendarEvent } from '@/types/youtube';
import styles from './page.module.scss';

export default function Home() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { state: channelState, addChannel, removeChannel } = useChannels();

  // クライアントサイドでのみマウント状態を有効化
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 通知機能
  const { permission, requestPermission, isEnabled, notifiedCount } = useStreamNotification(
    channelState.channels.map((ch) => ch.channelId),
    {
      enabled: notificationEnabled,
      checkInterval: 3 * 60 * 1000, // 3分
      notifyBeforeMinutes: 5, // 5分前
    },
  );

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  const handleNotificationToggle = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    setNotificationEnabled((prev) => !prev);
  }, [permission, requestPermission]);

  const handleCalendarEventClick = useCallback((event: CalendarEvent) => {
    window.open(event.url, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className={styles.container}>
      <button
        className={`${styles.toggleButton} ${sidebarVisible ? styles.visible : styles.hidden}`}
        onClick={toggleSidebar}
        aria-label={sidebarVisible ? 'サイドバーを閉じる' : 'サイドバーを開く'}
        type='button'
      >
        {sidebarVisible ? <HiChevronLeft /> : <HiChevronRight />}
      </button>

      {sidebarVisible && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
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
                      className={permission === 'denied' ? styles.disabled : ''}
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
                channelIds={channelState.channels.map((ch) => ch.channelId)}
                onEventClick={handleCalendarEventClick}
                refreshInterval={5 * 60 * 1000}
              />
            </div>
          </div>
        </aside>
      )}

      <main className={styles.mainContent}>
        <PanelContainer />
      </main>
    </div>
  );
}
