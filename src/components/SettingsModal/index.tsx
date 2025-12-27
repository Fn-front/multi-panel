'use client';

import { Modal } from '@/components/Modal';
import { NotificationSettings } from '@/components/NotificationSettings';
import { UI_TEXT } from '@/constants';
import styles from './SettingsModal.module.scss';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isMounted: boolean;
  permission: NotificationPermission;
  isEnabled: boolean;
  notifiedCount: number;
  onToggle: () => void;
};

export function SettingsModal({
  isOpen,
  onClose,
  isMounted,
  permission,
  isEnabled,
  notifiedCount,
  onToggle,
}: SettingsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={UI_TEXT.SETTINGS.TITLE}
      maxWidth='540px'
    >
      <div className={styles.settingsContent}>
        <NotificationSettings
          isMounted={isMounted}
          permission={permission}
          isEnabled={isEnabled}
          notifiedCount={notifiedCount}
          onToggle={onToggle}
        />
      </div>
    </Modal>
  );
}
