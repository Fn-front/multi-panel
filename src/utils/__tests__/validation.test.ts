import {
  sanitizeInput,
  isValidProtocol,
  isValidUrlLength,
  normalizeHostname,
  isAllowedYouTubeDomain,
  isValidYouTubeVideoId,
  VALIDATION_CONSTANTS,
  PATTERNS,
  ALLOWED_PROTOCOLS,
  ALLOWED_YOUTUBE_DOMAINS,
} from '../validation';

describe('validation utils', () => {
  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should remove control characters', () => {
      expect(sanitizeInput('hello\x00world')).toBe('helloworld');
      expect(sanitizeInput('test\x1Ftext')).toBe('testtext');
    });

    it('should remove HTML tags including script tags', () => {
      // HTMLタグは削除され、innerTextのみ残る
      expect(sanitizeInput('hello<script>alert("xss")</script>world')).toBe(
        'helloalert("xss")world',
      );
      expect(sanitizeInput('<div>content</div>')).toBe('content');
      expect(sanitizeInput('<p>paragraph</p>')).toBe('paragraph');
      // scriptタグも削除され、中身のテキストのみ残る
      expect(sanitizeInput('<script>test</script>')).toBe('test');
    });

    it('should detect dangerous patterns after tag removal', () => {
      // HTMLタグ削除後にDANGEROUSパターンをチェック
      // onclickなどのイベントハンドラがテキストとして残っている場合
      expect(sanitizeInput('normal onclick=alert text')).toBe('');
    });

    it('should block javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('');
      expect(sanitizeInput('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('should block data: URI scheme', () => {
      expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).toBe(
        '',
      );
    });

    it('should block vbscript: protocol', () => {
      expect(sanitizeInput('vbscript:msgbox')).toBe('');
    });

    it('should return empty for too long input', () => {
      const longString = 'a'.repeat(VALIDATION_CONSTANTS.MAX_URL_LENGTH + 1);
      expect(sanitizeInput(longString)).toBe('');
    });

    it('should handle valid URLs', () => {
      const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(sanitizeInput(validUrl)).toBe(validUrl);
    });
  });

  describe('isValidProtocol', () => {
    it('should allow http and https', () => {
      expect(isValidProtocol('http://example.com')).toBe(true);
      expect(isValidProtocol('https://example.com')).toBe(true);
    });

    it('should reject other protocols', () => {
      expect(isValidProtocol('ftp://example.com')).toBe(false);
      expect(isValidProtocol('file:///path/to/file')).toBe(false);
      expect(isValidProtocol('javascript:alert(1)')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidProtocol('not a url')).toBe(false);
    });
  });

  describe('isValidUrlLength', () => {
    it('should accept valid length URLs', () => {
      expect(isValidUrlLength('https://example.com')).toBe(true);
      expect(isValidUrlLength('a'.repeat(100))).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isValidUrlLength('')).toBe(false);
    });

    it('should reject too long URLs', () => {
      const tooLong = 'a'.repeat(VALIDATION_CONSTANTS.MAX_URL_LENGTH + 1);
      expect(isValidUrlLength(tooLong)).toBe(false);
    });
  });

  describe('normalizeHostname', () => {
    it('should remove www. prefix', () => {
      expect(normalizeHostname('www.example.com')).toBe('example.com');
      expect(normalizeHostname('www.youtube.com')).toBe('youtube.com');
    });

    it('should not modify hostnames without www.', () => {
      expect(normalizeHostname('example.com')).toBe('example.com');
      expect(normalizeHostname('youtube.com')).toBe('youtube.com');
    });
  });

  describe('isAllowedYouTubeDomain', () => {
    it('should allow youtube.com', () => {
      expect(isAllowedYouTubeDomain('youtube.com')).toBe(true);
      expect(isAllowedYouTubeDomain('www.youtube.com')).toBe(true);
    });

    it('should allow m.youtube.com', () => {
      expect(isAllowedYouTubeDomain('m.youtube.com')).toBe(true);
    });

    it('should allow youtu.be', () => {
      expect(isAllowedYouTubeDomain('youtu.be')).toBe(true);
    });

    it('should reject other domains', () => {
      expect(isAllowedYouTubeDomain('example.com')).toBe(false);
      expect(isAllowedYouTubeDomain('youtube.com.evil.com')).toBe(false);
    });
  });

  describe('isValidYouTubeVideoId', () => {
    it('should accept valid 11-character video IDs', () => {
      expect(isValidYouTubeVideoId('dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeVideoId('jNQXAC9IVRw')).toBe(true);
      expect(isValidYouTubeVideoId('_-123456789')).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(isValidYouTubeVideoId('short')).toBe(false);
      expect(isValidYouTubeVideoId('toolongvideoid')).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(isValidYouTubeVideoId('dQw4w9WgXc!')).toBe(false);
      expect(isValidYouTubeVideoId('dQw4w9WgXc@')).toBe(false);
    });
  });

  describe('constants', () => {
    it('should have correct VALIDATION_CONSTANTS', () => {
      expect(VALIDATION_CONSTANTS.MAX_URL_LENGTH).toBe(2000);
      expect(VALIDATION_CONSTANTS.YOUTUBE_VIDEO_ID_LENGTH).toBe(11);
    });

    it('should have correct ALLOWED_PROTOCOLS', () => {
      expect(ALLOWED_PROTOCOLS).toContain('http:');
      expect(ALLOWED_PROTOCOLS).toContain('https:');
      expect(ALLOWED_PROTOCOLS).toHaveLength(2);
    });

    it('should have correct ALLOWED_YOUTUBE_DOMAINS', () => {
      expect(ALLOWED_YOUTUBE_DOMAINS).toContain('youtube.com');
      expect(ALLOWED_YOUTUBE_DOMAINS).toContain('m.youtube.com');
      expect(ALLOWED_YOUTUBE_DOMAINS).toContain('youtu.be');
    });

    it('should have PATTERNS object', () => {
      expect(PATTERNS.CONTROL_CHARS).toBeInstanceOf(RegExp);
      expect(PATTERNS.HTML_TAGS).toBeInstanceOf(RegExp);
      expect(PATTERNS.NULL_BYTE).toBeInstanceOf(RegExp);
      expect(PATTERNS.YOUTUBE_VIDEO_ID).toBeInstanceOf(RegExp);
      expect(PATTERNS.DANGEROUS_SCRIPT).toBeInstanceOf(RegExp);
    });
  });
});
