import { useState, useCallback } from 'react';
import type { Channel } from '@/types/channel';
import type { YouTubeChannelInfo } from '@/types/youtube';
import { getChannelInfo } from '@/lib/youtube-api';
import { extractVideoId } from '@/utils/youtube';

interface UseChannelManagementProps {
  channels: Channel[];
  onAddChannel: (channel: Channel) => void;
}

export function useChannelManagement({
  channels,
  onAddChannel,
}: UseChannelManagementProps) {
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
    async (e: React.FormEvent) => {
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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setError(null);
    },
    [],
  );

  return {
    inputValue,
    isLoading,
    error,
    channelInfoCache,
    handleSubmit,
    handleInputChange,
  };
}
