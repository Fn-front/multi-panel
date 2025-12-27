'use client';

import { UI_TEXT } from '@/constants';
import styles from './NotificationSettings.module.scss';

type NotificationSettingsProps = {
  isMounted: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  notifiedCount: number;
  onToggle: () => void;
};

export function NotificationSettings({
  isMounted,
  permission,
  isEnabled,
  notifiedCount,
  onToggle,
}: NotificationSettingsProps) {
  return (
    <section className={styles.section}>
      <h3>{UI_TEXT.NOTIFICATION.TITLE}</h3>
      {isMounted ? (
        <>
          <div className={styles.settingItem}>
            <div className={styles.settingLabel}>
              <label>
                {isEnabled
                  ? `${UI_TEXT.NOTIFICATION.ENABLED} (${UI_TEXT.NOTIFICATION.COUNT(notifiedCount)})`
                  : permission === 'denied'
                    ? UI_TEXT.NOTIFICATION.DENIED
                    : UI_TEXT.NOTIFICATION.ENABLE}
              </label>
            </div>
            <button
              onClick={onToggle}
              className={`${styles.toggleButton} ${permission === 'denied' ? styles.disabled : ''}`}
              disabled={permission === 'denied'}
              type='button'
            >
              {isEnabled ? 'OFF' : 'ON'}
            </button>
          </div>
          {permission === 'default' && (
            <div className={styles.notificationStatus}>
              {UI_TEXT.NOTIFICATION.PERMISSION_REQUIRED}
            </div>
          )}
        </>
      ) : (
        <div className={styles.settingItem}>
          <div className={styles.settingLabel}>
            <label>{UI_TEXT.NOTIFICATION.ENABLE}</label>
          </div>
          <button type='button' className={styles.toggleButton} disabled>
            ON
          </button>
        </div>
      )}
    </section>
  );
}
