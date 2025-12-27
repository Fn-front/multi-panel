import { useState, useCallback } from 'react';
import type { Channel } from '@/types/channel';
import type { YouTubeChannelInfo } from '@/types/youtube';
import { getChannelInfo } from '@/lib/youtube-api';
import { extractVideoId } from '@/utils/youtube';
import { UI_TEXT } from '@/constants';

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
        const channelId = url.pathname.replace('/channel/', '').split('/')[0];
        if (/^UC[\w-]{22}$/.test(channelId)) {
          return channelId;
        }
      }

      // youtube.com/@handle 形式
      if (url.pathname.startsWith('/@')) {
        const handle = url.pathname.slice(2).split('/')[0];
        if (handle) {
          // ハンドルをそのまま返す（getChannelInfo APIで解決）
          return `@${handle}`;
        }
      }

      // youtube.com/c/customname 形式
      if (url.pathname.startsWith('/c/')) {
        const customName = url.pathname.split('/c/')[1]?.split('/')[0];
        if (customName) {
          // カスタム名をそのまま返す（getChannelInfo APIで解決）
          return customName;
        }
      }

      // 動画URLからチャンネルIDを取得することはできないため
      // Videos APIを使う必要がある（ここでは未対応）
      const videoId = extractVideoId(trimmed);
      if (videoId) {
        setError(UI_TEXT.CHANNEL.INVALID_VIDEO_URL);
        return null;
      }
    } catch {
      // URLではない場合
      // @で始まる場合はハンドルとして扱う
      if (trimmed.startsWith('@')) {
        return trimmed;
      }
      // それ以外はそのまま返す（検証はAPI呼び出し時に行う）
      return trimmed;
    }

    return null;
  }, []);

  // チャンネル追加
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!inputValue.trim()) {
        setError(UI_TEXT.CHANNEL.INPUT_REQUIRED);
        return;
      }

      const channelId = extractChannelId(inputValue);

      if (!channelId) {
        setError(UI_TEXT.CHANNEL.INVALID_INPUT);
        return;
      }

      // 既に登録済みかチェック
      if (channels.some((ch) => ch.channelId === channelId)) {
        setError(UI_TEXT.CHANNEL.ALREADY_REGISTERED);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // チャンネル情報を取得
        const channelInfo = await getChannelInfo(channelId);

        if (!channelInfo) {
          setError(UI_TEXT.CHANNEL.NOT_FOUND);
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
          err instanceof Error ? err.message : UI_TEXT.CHANNEL.ADD_FAILED,
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
