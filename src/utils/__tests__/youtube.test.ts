import {
  parseYouTubeUrl,
  isValidYouTubeVideoUrl,
  createYouTubeUrl,
  createLiveChatUrl,
  extractVideoId,
} from '../youtube';

describe('youtube utils', () => {
  describe('parseYouTubeUrl', () => {
    it('should parse standard youtube.com watch URLs', () => {
      const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      });
    });

    it('should parse youtube.com without www', () => {
      const result = parseYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      });
    });

    it('should parse m.youtube.com URLs', () => {
      const result = parseYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      });
    });

    it('should parse youtu.be short URLs', () => {
      const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toEqual({
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      });
    });

    it('should parse youtu.be URLs with query parameters', () => {
      const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=10');
      expect(result).toEqual({
        type: 'video',
        videoId: 'dQw4w9WgXcQ',
      });
    });

    it('should return unknown for invalid URLs', () => {
      expect(parseYouTubeUrl('https://example.com')).toEqual({ type: 'unknown' });
      expect(parseYouTubeUrl('not a url')).toEqual({ type: 'unknown' });
    });

    it('should return unknown for invalid video IDs', () => {
      const result = parseYouTubeUrl('https://youtube.com/watch?v=invalid!');
      expect(result).toEqual({ type: 'unknown' });
    });

    it('should reject non-YouTube domains', () => {
      const result = parseYouTubeUrl('https://notyoutube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({ type: 'unknown' });
    });
  });

  describe('isValidYouTubeVideoUrl', () => {
    it('should accept valid YouTube video URLs', () => {
      expect(isValidYouTubeVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeVideoUrl('https://youtube.com/watch?v=jNQXAC9IVRw')).toBe(true);
      expect(isValidYouTubeVideoUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should reject non-YouTube URLs', () => {
      expect(isValidYouTubeVideoUrl('https://example.com')).toBe(false);
      expect(isValidYouTubeVideoUrl('https://vimeo.com/123456')).toBe(false);
    });

    it('should reject invalid protocols', () => {
      expect(isValidYouTubeVideoUrl('ftp://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
      expect(isValidYouTubeVideoUrl('javascript:alert(1)')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(isValidYouTubeVideoUrl('')).toBe(false);
      expect(isValidYouTubeVideoUrl('not a url')).toBe(false);
    });

    it('should reject channel URLs', () => {
      expect(isValidYouTubeVideoUrl('https://youtube.com/channel/UCxyz')).toBe(false);
      expect(isValidYouTubeVideoUrl('https://youtube.com/@channelname')).toBe(false);
    });
  });

  describe('createYouTubeUrl', () => {
    it('should create valid YouTube watch URL', () => {
      expect(createYouTubeUrl('dQw4w9WgXcQ')).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      );
    });
  });

  describe('createLiveChatUrl', () => {
    it('should create valid live chat URL', () => {
      const url = createLiveChatUrl('dQw4w9WgXcQ');
      expect(url).toContain('https://www.youtube.com/live_chat?v=dQw4w9WgXcQ');
      expect(url).toContain('embed_domain=');
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from valid URLs', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ',
      );
      expect(extractVideoId('https://youtu.be/jNQXAC9IVRw')).toBe('jNQXAC9IVRw');
    });

    it('should return null for non-video URLs', () => {
      expect(extractVideoId('https://youtube.com/channel/UCxyz')).toBe(null);
      expect(extractVideoId('https://example.com')).toBe(null);
    });

    it('should return null for invalid URLs', () => {
      expect(extractVideoId('not a url')).toBe(null);
    });
  });
});
