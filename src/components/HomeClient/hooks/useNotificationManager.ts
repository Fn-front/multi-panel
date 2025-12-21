import { useState, useCallback, useMemo } from 'react';
import { useStreamNotification } from '@/hooks/useStreamNotification';

type UseNotificationManagerOptions = {
  channelIds: string[];
};

/**
 * 配信通知の管理を行うフック
 *
 * - 通知の有効/無効切り替え
 * - 通知権限のリクエスト
 * - 通知状態の管理
 */
export function useNotificationManager({
  channelIds,
}: UseNotificationManagerOptions) {
  const [notificationEnabled, setNotificationEnabled] = useState(false);

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

  const handleToggle = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    setNotificationEnabled((prev) => !prev);
  }, [permission, requestPermission]);

  return {
    notificationEnabled,
    permission,
    isEnabled,
    notifiedCount,
    handleToggle,
  };
}
