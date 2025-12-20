'use client';

import { useCallback } from 'react';
import { HiXMark, HiUserGroup } from 'react-icons/hi2';
import type { Channel } from '@/types/channel';
import { useChannelManagement } from './hooks/useChannelManagement';
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
}

export default function FavoriteChannels({
  channels,
  onAddChannel,
  onRemoveChannel,
  onChannelClick,
}: FavoriteChannelsProps) {
  const {
    inputValue,
    isLoading,
    error,
    channelInfoCache,
    handleSubmit,
    handleInputChange,
  } = useChannelManagement({ channels, onAddChannel });

  const handleRemove = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onRemoveChannel(id);
    },
    [onRemoveChannel],
  );

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
        <h2>お気に入りチャンネル</h2>
      </div>

      <form className={styles.addForm} onSubmit={handleSubmit}>
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          placeholder='チャンネルURLまたはIDを入力'
          disabled={isLoading}
          autoComplete='off'
          spellCheck='false'
        />
        <button type='submit' disabled={isLoading}>
          {isLoading ? '追加中...' : '追加'}
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.channelList}>
        {channels.length === 0 ? (
          <div className={styles.emptyState}>
            <HiUserGroup />
            <div>お気に入りチャンネルを追加してください</div>
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
                <button
                  className={styles.removeButton}
                  onClick={(e) => handleRemove(channel.id, e)}
                  aria-label='削除'
                >
                  <HiXMark />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
