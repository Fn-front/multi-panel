'use client';

import { useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { HiXMark, HiUserGroup } from 'react-icons/hi2';
import type { Channel } from '@/types/channel';
import type { YouTubeChannelInfo } from '@/types/youtube';
import { getChannelInfo } from '@/lib/youtube-api';
import { extractVideoId } from '@/utils/youtube';
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
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelInfoCache, setChannelInfoCache] = useState<
    Map<string, YouTubeChannelInfo>
  >(new Map());

  // チャンネルIDの抽出
  const extractChannelId = useCallback((input: string): string | null => {
    const trimmed = input.trim();

    // 既にチャンネルIDの形式（UC...）の場合
    if (/^UC[\w-]{22}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);

      // youtube.com/channel/... 形式
      if (url.pathname.startsWith('/channel/')) {
        const channelId = url.pathname.replace('/channel/', '');
        if (/^UC[\w-]{22}$/.test(channelId)) {
          return channelId;
        }
      }

      // 動画URLからチャンネルIDを取得することはできないため
      // Videos APIを使う必要がある（ここでは未対応）
      const videoId = extractVideoId(trimmed);
      if (videoId) {
        setError(
          '動画URLからチャンネルを追加することはできません。チャンネルURLを入力してください。',
        );
        return null;
      }
    } catch {
      // URLではない場合はそのまま返す（検証はAPI呼び出し時に行う）
      return trimmed;
    }

    return null;
  }, []);

  // チャンネル追加
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!inputValue.trim()) {
        setError('チャンネルIDまたはURLを入力してください');
        return;
      }

      const channelId = extractChannelId(inputValue);

      if (!channelId) {
        setError('有効なチャンネルIDまたはURLを入力してください');
        return;
      }

      // 既に登録済みかチェック
      if (channels.some((ch) => ch.channelId === channelId)) {
        setError('このチャンネルは既に登録されています');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // チャンネル情報を取得
        const channelInfo = await getChannelInfo(channelId);

        if (!channelInfo) {
          setError('チャンネルが見つかりませんでした');
          return;
        }

        // キャッシュに保存
        setChannelInfoCache((prev) =>
          new Map(prev).set(channelId, channelInfo),
        );

        // チャンネルを追加
        const newChannel: Channel = {
          id: crypto.randomUUID(),
          channelId: channelInfo.id,
          name: channelInfo.title,
          thumbnail: channelInfo.thumbnail,
        };

        onAddChannel(newChannel);
        setInputValue('');
      } catch (err) {
        console.error('Failed to add channel:', err);
        setError(
          err instanceof Error ? err.message : 'チャンネルの追加に失敗しました',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, channels, extractChannelId, onAddChannel],
  );

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null);
  }, []);

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
