import type { ParsedYouTubeUrl } from '@/types';

/**
 * YouTube URLを解析して動画ID・チャンネルIDを抽出
 */
export function parseYouTubeUrl(url: string): ParsedYouTubeUrl {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    // 動画URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (
      (hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      urlObj.pathname === '/watch'
    ) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return { videoId, type: 'video' };
      }
    }

    // 短縮URL: https://youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return { videoId, type: 'video' };
      }
    }

    // チャンネルURL: https://www.youtube.com/channel/CHANNEL_ID
    if (
      (hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      urlObj.pathname.startsWith('/channel/')
    ) {
      const channelId = urlObj.pathname.split('/channel/')[1]?.split('/')[0];
      if (channelId) {
        return { channelId, type: 'channel' };
      }
    }

    // カスタムURL: https://www.youtube.com/@handle
    if (
      (hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      urlObj.pathname.startsWith('/@')
    ) {
      const channelHandle = urlObj.pathname.slice(2).split('/')[0];
      if (channelHandle) {
        return { channelHandle, type: 'channel' };
      }
    }

    // カスタムURL: https://www.youtube.com/c/customname
    if (
      (hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      urlObj.pathname.startsWith('/c/')
    ) {
      const channelHandle = urlObj.pathname.split('/c/')[1]?.split('/')[0];
      if (channelHandle) {
        return { channelHandle, type: 'channel' };
      }
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}

/**
 * 入力値をサニタイズ（危険な文字を除去）
 */
export function sanitizeInput(input: string): string {
  // 前後の空白を削除
  let sanitized = input.trim();

  // 制御文字を削除
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // HTMLタグを削除
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // JavaScriptプロトコルを削除
  if (sanitized.toLowerCase().startsWith('javascript:')) {
    return '';
  }

  // データURIスキームを削除
  if (sanitized.toLowerCase().startsWith('data:')) {
    return '';
  }

  return sanitized;
}

/**
 * YouTube動画URLとして有効かチェック
 */
export function isValidYouTubeVideoUrl(url: string): boolean {
  // 入力をサニタイズ
  const sanitized = sanitizeInput(url);

  // 長さチェック（YouTubeのURLは通常2000文字以下）
  if (sanitized.length === 0 || sanitized.length > 2000) {
    return false;
  }

  // URLとして有効かチェック
  try {
    const urlObj = new URL(sanitized);

    // プロトコルがhttpまたはhttpsであることを確認
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
  } catch {
    return false;
  }

  const parsed = parseYouTubeUrl(sanitized);
  return parsed.type === 'video' && !!parsed.videoId;
}

/**
 * YouTube動画IDからURLを生成
 */
export function createYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * YouTube Live ChatのiframeURLを生成
 */
export function createLiveChatUrl(videoId: string): string {
  return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`;
}

/**
 * YouTube動画IDを抽出（動画URLの場合のみ）
 */
export function extractVideoId(url: string): string | null {
  const parsed = parseYouTubeUrl(url);
  return parsed.type === 'video' ? parsed.videoId || null : null;
}
