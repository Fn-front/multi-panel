'use client';

import { useCallback, useState, memo } from 'react';
import { HiXMark, HiUserGroup } from 'react-icons/hi2';
import type { Channel } from '@/types/channel';
import { UI_TEXT } from '@/constants';
import { useChannelManagement } from './hooks/useChannelManagement';
import { ColorPicker } from '@/components/ColorPicker';
import styles from './FavoriteChannels.module.scss';

interface FavoriteChannelsProps {
  /** 登録済みチャンネル一覧 */
  channels: Channel[];
  /** チャンネル追加時のコールバック */
  onAddChannel: (channel: Channel) => void;
  /** チャンネル削除時のコールバック */
  onRemoveChannel: (id: string) => void;
  /** チャンネルクリック時のコールバック */
  onChannelClick?: (channelId: string) => void;
  /** チャンネル色変更時のコールバック */
  onColorChange?: (id: string, color: string) => void;
}

const FavoriteChannels = memo(function FavoriteChannels({
  channels,
  onAddChannel,
  onRemoveChannel,
  onChannelClick,
  onColorChange,
}: FavoriteChannelsProps) {
  const {
    inputValue,
    isLoading,
    error,
    channelInfoCache,
    handleSubmit,
    handleInputChange,
  } = useChannelManagement({ channels, onAddChannel });

  const [colorPickerState, setColorPickerState] = useState<{
    channelId: string;
    position: { top: number; left: number };
  } | null>(null);

  const handleRemove = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onRemoveChannel(id);
    },
    [onRemoveChannel],
  );

  const handleColorClick = useCallback(
    (channelId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      setColorPickerState({
        channelId,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    },
    [],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (colorPickerState && onColorChange) {
        onColorChange(colorPickerState.channelId, color);
      }
    },
    [colorPickerState, onColorChange],
  );

  const handleColorPickerClose = useCallback(() => {
    setColorPickerState(null);
  }, []);

  const handleChannelClick = useCallback(
    (channelId: string) => {
      if (onChannelClick) {
        onChannelClick(channelId);
      } else {
        // デフォルト動作: 新しいタブでチャンネルページを開く
        window.open(
          `https://www.youtube.com/channel/${channelId}`,
          '_blank',
          'noopener,noreferrer',
        );
      }
    },
    [onChannelClick],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{UI_TEXT.CHANNEL.TITLE}</h2>
      </div>

      <form className={styles.addForm} onSubmit={handleSubmit}>
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          placeholder={UI_TEXT.CHANNEL.PLACEHOLDER}
          disabled={isLoading}
          autoComplete='off'
          spellCheck='false'
        />
        <button type='submit' disabled={isLoading}>
          {isLoading ? UI_TEXT.CHANNEL.ADDING : UI_TEXT.CHANNEL.ADD}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.channelList}>
        {channels.length === 0 ? (
          <div className={styles.emptyState}>
            <HiUserGroup />
            <div>{UI_TEXT.CHANNEL.EMPTY}</div>
          </div>
        ) : (
          channels.map((channel) => {
            const info = channelInfoCache.get(channel.channelId);
            const thumbnail = channel.thumbnail || info?.thumbnail;
            const description = info?.description;

            return (
              <div
                key={channel.id}
                className={styles.channelItem}
                onClick={() => handleChannelClick(channel.channelId)}
              >
                {thumbnail && (
                  <div className={styles.thumbnail}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail} alt={channel.name} />
                  </div>
                )}
                <div className={styles.info}>
                  <h3 className={styles.title}>{channel.name}</h3>
                  {description && (
                    <p className={styles.description}>{description}</p>
                  )}
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.colorButton}
                    onClick={(e) => handleColorClick(channel.id, e)}
                    style={{ backgroundColor: channel.color || '#3b82f6' }}
                    aria-label='色を変更'
                    type='button'
                  />
                  <button
                    className={styles.removeButton}
                    onClick={(e) => handleRemove(channel.id, e)}
                    aria-label={UI_TEXT.CHANNEL.REMOVE}
                    type='button'
                  >
                    <HiXMark />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {colorPickerState && (
        <ColorPicker
          selectedColor={
            channels.find((ch) => ch.id === colorPickerState.channelId)
              ?.color || '#3b82f6'
          }
          onChange={handleColorChange}
          onClose={handleColorPickerClose}
          position={colorPickerState.position}
        />
      )}
    </div>
  );
});

export default FavoriteChannels;
