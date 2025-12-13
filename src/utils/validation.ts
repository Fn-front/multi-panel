/**
 * 入力値検証・サニタイズのユーティリティ
 */

// 定数
export const VALIDATION_CONSTANTS = {
  /** URL最大長 */
  MAX_URL_LENGTH: 2000,
  /** YouTube動画ID長（11文字固定） */
  YOUTUBE_VIDEO_ID_LENGTH: 11,
} as const;

// 正規表現パターン（共通化）
export const PATTERNS = {
  /** 制御文字 */
  // eslint-disable-next-line no-control-regex
  CONTROL_CHARS: /[\x00-\x1F\x7F]/g,
  /** HTMLタグ */
  HTML_TAGS: /<[^>]*>/g,
  /** null文字 */
  // eslint-disable-next-line no-control-regex
  NULL_BYTE: /\0/g,
  /** YouTube動画ID（英数字、ハイフン、アンダースコアのみ） */
  YOUTUBE_VIDEO_ID: /^[a-zA-Z0-9_-]{11}$/,
  /** 危険なスクリプトパターン */
  DANGEROUS_SCRIPT: /<script|javascript:|data:|vbscript:|on\w+=/gi,
} as const;

// 許可されたプロトコル
export const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

// 許可されたYouTubeドメイン
export const ALLOWED_YOUTUBE_DOMAINS = [
  'youtube.com',
  'm.youtube.com',
  'youtu.be',
] as const;

/**
 * 入力値をサニタイズ（危険な文字を除去）
 * OWASP推奨のサニタイゼーション手法を実装
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 前後の空白を削除
  let sanitized = input.trim();

  // 長さチェック（早期リターン）
  if (sanitized.length === 0 || sanitized.length > VALIDATION_CONSTANTS.MAX_URL_LENGTH) {
    return '';
  }

  // null文字を削除（セキュリティリスク）
  sanitized = sanitized.replace(PATTERNS.NULL_BYTE, '');

  // 制御文字を削除
  sanitized = sanitized.replace(PATTERNS.CONTROL_CHARS, '');

  // HTMLタグを削除
  sanitized = sanitized.replace(PATTERNS.HTML_TAGS, '');

  // 危険なスクリプトパターンを検出したら空文字を返す
  if (PATTERNS.DANGEROUS_SCRIPT.test(sanitized)) {
    return '';
  }

  // JavaScriptプロトコルを除去
  if (sanitized.toLowerCase().startsWith('javascript:')) {
    return '';
  }

  // データURIスキームを除去
  if (sanitized.toLowerCase().startsWith('data:')) {
    return '';
  }

  // vbscriptプロトコルを除去
  if (sanitized.toLowerCase().startsWith('vbscript:')) {
    return '';
  }

  return sanitized;
}

/**
 * URLのプロトコルが安全かチェック
 */
export function isValidProtocol(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (ALLOWED_PROTOCOLS as readonly string[]).includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * URLの長さが許容範囲内かチェック
 */
export function isValidUrlLength(url: string): boolean {
  return url.length > 0 && url.length <= VALIDATION_CONSTANTS.MAX_URL_LENGTH;
}

/**
 * ホスト名から www. プレフィックスを除去
 */
export function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

/**
 * YouTubeドメインが許可されたものかチェック
 */
export function isAllowedYouTubeDomain(hostname: string): boolean {
  const normalizedHostname = normalizeHostname(hostname);
  return (ALLOWED_YOUTUBE_DOMAINS as readonly string[]).includes(normalizedHostname);
}

/**
 * YouTube動画IDが有効な形式かチェック
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  return PATTERNS.YOUTUBE_VIDEO_ID.test(videoId);
}
