/**
 * 配信通知フック
 * お気に入りチャンネルの配信開始を通知する
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { YouTubeVideo } from '@/types/youtube';
import { getMultipleChannelsSchedule } from '@/lib/youtube-api';
import { UI_TEXT } from '@/constants';

interface NotificationOptions {
  /** 通知の有効/無効 */
  enabled: boolean;
  /** チェック間隔（ミリ秒）デフォルト: 3分 */
  checkInterval?: number;
  /** 配信開始前の通知（分）デフォルト: 5分前 */
  notifyBeforeMinutes?: number;
}

interface StreamNotificationState {
  /** 通知済みの動画IDセット */
  notifiedVideoIds: Set<string>;
  /** 最後のチェック時刻 */
  lastCheckTime: number | null;
}

/**
 * ブラウザ通知のパーミッション要求
 */
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn(UI_TEXT.NOTIFICATION.NOT_SUPPORTED);
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * 通知を表示
 */
function showNotification(video: YouTubeVideo, minutesUntilStart: number) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title =
    minutesUntilStart > 0
      ? `${minutesUntilStart}分後に配信開始`
      : video.liveBroadcastContent === 'live'
        ? UI_TEXT.NOTIFICATION.STREAMING_LIVE
        : UI_TEXT.NOTIFICATION.STREAMING_START;

  const notification = new Notification(title, {
    body: `${video.channelName}\n${video.title}`,
    icon: video.thumbnail,
    tag: video.id, // 同じ動画の通知は上書き
    requireInteraction: false,
    silent: false,
  });

  notification.onclick = () => {
    window.open(
      `https://www.youtube.com/watch?v=${video.id}`,
      '_blank',
      'noopener,noreferrer',
    );
    notification.close();
  };

  // 10秒後に自動で閉じる
  setTimeout(() => notification.close(), 10000);
}

/**
 * 配信通知フック
 */
export function useStreamNotification(
  channelIds: string[],
  options: NotificationOptions,
): {
  isEnabled: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  notifiedCount: number;
} {
  const {
    enabled,
    checkInterval = 3 * 60 * 1000,
    notifyBeforeMinutes = 5,
  } = options;

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'denied',
  );

  const stateRef = useRef<StreamNotificationState>({
    notifiedVideoIds: new Set(),
    lastCheckTime: null,
  });

  const [notifiedCount, setNotifiedCount] = useState(0);

  // パーミッション要求
  const handleRequestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  }, []);

  // 配信チェックと通知
  const checkAndNotify = useCallback(async () => {
    if (!enabled || permission !== 'granted' || channelIds.length === 0) {
      return;
    }

    try {
      const scheduleMap = await getMultipleChannelsSchedule(channelIds);
      const now = Date.now();
      const notifyThresholdMs = notifyBeforeMinutes * 60 * 1000;

      scheduleMap.forEach((videos) => {
        videos.forEach((video) => {
          // 既に通知済みの動画はスキップ
          if (stateRef.current.notifiedVideoIds.has(video.id)) {
            return;
          }

          const shouldNotify =
            video.liveBroadcastContent === 'live' || // 現在配信中
            (video.scheduledStartTime &&
              new Date(video.scheduledStartTime).getTime() - now <=
                notifyThresholdMs && // 開始予定時刻が近い
              new Date(video.scheduledStartTime).getTime() > now); // まだ開始していない

          if (shouldNotify) {
            const minutesUntilStart = video.scheduledStartTime
              ? Math.ceil(
                  (new Date(video.scheduledStartTime).getTime() - now) /
                    (60 * 1000),
                )
              : 0;

            showNotification(video, minutesUntilStart);

            // 通知済みとしてマーク
            stateRef.current.notifiedVideoIds.add(video.id);
            setNotifiedCount((prev) => prev + 1);
          }
        });
      });

      stateRef.current.lastCheckTime = now;
    } catch (error) {
      console.error('Failed to check streams for notification:', error);
    }
  }, [enabled, permission, channelIds, notifyBeforeMinutes]);

  // 定期チェック
  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      return;
    }

    // 初回実行
    checkAndNotify();

    // 定期実行
    const interval = setInterval(checkAndNotify, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, permission, checkInterval, checkAndNotify]);

  // 通知済みIDのクリーンアップ（24時間経過したものを削除）
  useEffect(() => {
    const cleanupInterval = setInterval(
      () => {
        // 実際の実装では、動画の配信時刻情報を保持して判定する必要がある
        // ここでは簡易的に全クリア（24時間ごと）
        stateRef.current.notifiedVideoIds.clear();
        setNotifiedCount(0);
      },
      24 * 60 * 60 * 1000,
    );

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    isEnabled: enabled && permission === 'granted',
    permission,
    requestPermission: handleRequestPermission,
    notifiedCount,
  };
}
