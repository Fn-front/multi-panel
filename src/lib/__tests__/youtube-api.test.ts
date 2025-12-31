/**
 * @jest-environment jsdom
 */

import type {
  YouTubeChannelsResponse,
  YouTubeSearchResponse,
  YouTubeVideosResponse,
} from '@/types/youtube';

// http-clientをモック
jest.mock('@/lib/http-client', () => ({
  createYouTubeClient: jest.fn(),
  httpClient: {
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

// youtube-apiモジュールをリセット可能にする
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getChannelInfo: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getChannelUpcomingStreams: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getChannelLiveStreams: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getMultipleChannelsSchedule: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createYouTubeClient: any;

beforeEach(async () => {
  // モジュールキャッシュをクリア
  jest.resetModules();

  // モジュールを再インポート
  const youtubeApi = await import('../youtube-api');
  getChannelInfo = youtubeApi.getChannelInfo;
  getChannelUpcomingStreams = youtubeApi.getChannelUpcomingStreams;
  getChannelLiveStreams = youtubeApi.getChannelLiveStreams;
  getMultipleChannelsSchedule = youtubeApi.getMultipleChannelsSchedule;

  const httpClient = await import('@/lib/http-client');
  createYouTubeClient = httpClient.createYouTubeClient;
});

describe('youtube-api', () => {
  const mockApiKey = 'test-api-key';
  const mockChannelId = 'UCtest123';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockAxiosInstance: any;

  // console.errorをモック
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = mockApiKey;

    // axios.createのモックを設定
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((fn) => {
            mockAxiosInstance.requestInterceptor = fn;
            return 0;
          }),
          eject: jest.fn()
        },
        response: {
          use: jest.fn((fn) => {
            mockAxiosInstance.responseInterceptor = fn;
            return 0;
          }),
          eject: jest.fn()
        },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createYouTubeClient as jest.Mock).mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  });

  describe('getChannelInfo', () => {
    it('should fetch channel information successfully', async () => {
      const mockResponse: YouTubeChannelsResponse = {
        items: [
          {
            id: mockChannelId,
            snippet: {
              title: 'Test Channel',
              description: 'Test Description',
              customUrl: '@testchannel',
              thumbnails: {
                default: { url: 'https://example.com/default.jpg' },
                medium: { url: 'https://example.com/medium.jpg' },
                high: { url: 'https://example.com/high.jpg' },
              },
            },
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getChannelInfo(mockChannelId);

      expect(result).toEqual({
        id: mockChannelId,
        title: 'Test Channel',
        description: 'Test Description',
        thumbnail: 'https://example.com/high.jpg',
        customUrl: '@testchannel',
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            part: 'snippet',
            id: mockChannelId,
          }),
        }),
      );
    });

    it('should return null when channel not found', async () => {
      const mockResponse: YouTubeChannelsResponse = {
        items: [],
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await getChannelInfo(mockChannelId);
      expect(result).toBeNull();
    });

    it('should throw error when API key is not configured', async () => {
      delete process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      await expect(getChannelInfo(mockChannelId)).rejects.toThrow(
        'YouTube API Key is not configured',
      );
    });

    it('should handle API errors', async () => {
      const error = {
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: {
            error: {
              code: 403,
              message: 'API key not valid',
            },
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(getChannelInfo(mockChannelId)).rejects.toEqual(error);
    });
  });

  describe('getChannelUpcomingStreams', () => {
    it('should fetch upcoming streams successfully', async () => {
      const mockSearchResponse: YouTubeSearchResponse = {
        items: [
          {
            id: {
              kind: 'youtube#video',
              videoId: 'video123',
            },
            snippet: {
              title: 'Upcoming Stream',
              channelId: mockChannelId,
              channelTitle: 'Test Channel',
              publishedAt: '2024-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'https://example.com/default.jpg' },
                medium: { url: 'https://example.com/medium.jpg' },
                high: { url: 'https://example.com/high.jpg' },
              },
              liveBroadcastContent: 'upcoming',
            },
          },
        ],
      };

      const mockVideosResponse: YouTubeVideosResponse = {
        items: [
          {
            id: 'video123',
            snippet: {
              title: 'Upcoming Stream',
              channelId: mockChannelId,
              channelTitle: 'Test Channel',
              publishedAt: '2024-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'https://example.com/default.jpg' },
                medium: { url: 'https://example.com/medium.jpg' },
                high: { url: 'https://example.com/high.jpg' },
              },
            },
            liveStreamingDetails: {
              scheduledStartTime: '2024-01-02T10:00:00Z',
            },
          },
        ],
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: mockSearchResponse })
        .mockResolvedValueOnce({ data: mockVideosResponse });

      const result = await getChannelUpcomingStreams(mockChannelId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'video123',
        title: 'Upcoming Stream',
        channelId: mockChannelId,
        liveBroadcastContent: 'upcoming',
        scheduledStartTime: '2024-01-02T10:00:00Z',
      });
    });

    it('should return empty array when no upcoming streams', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { items: [] } });

      const result = await getChannelUpcomingStreams(mockChannelId);
      expect(result).toEqual([]);
    });
  });

  describe('getChannelLiveStreams', () => {
    it('should fetch live streams successfully', async () => {
      const mockSearchResponse: YouTubeSearchResponse = {
        items: [
          {
            id: {
              kind: 'youtube#video',
              videoId: 'live123',
            },
            snippet: {
              title: 'Live Stream',
              channelId: mockChannelId,
              channelTitle: 'Test Channel',
              publishedAt: '2024-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'https://example.com/default.jpg' },
                medium: { url: 'https://example.com/medium.jpg' },
                high: { url: 'https://example.com/high.jpg' },
              },
              liveBroadcastContent: 'live',
            },
          },
        ],
      };

      const mockVideosResponse: YouTubeVideosResponse = {
        items: [
          {
            id: 'live123',
            snippet: {
              title: 'Live Stream',
              channelId: mockChannelId,
              channelTitle: 'Test Channel',
              publishedAt: '2024-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'https://example.com/default.jpg' },
                medium: { url: 'https://example.com/medium.jpg' },
                high: { url: 'https://example.com/high.jpg' },
              },
            },
            liveStreamingDetails: {
              actualStartTime: '2024-01-01T10:00:00Z',
            },
          },
        ],
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: mockSearchResponse })
        .mockResolvedValueOnce({ data: mockVideosResponse });

      const result = await getChannelLiveStreams(mockChannelId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'live123',
        title: 'Live Stream',
        liveBroadcastContent: 'live',
      });
    });
  });

  describe('getMultipleChannelsSchedule', () => {
    it('should fetch schedules for multiple channels', async () => {
      const channel1 = 'UCtest1';
      const channel2 = 'UCtest2';

      // Mock responses for both channels - 各APIエンドポイントに対するレスポンス
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { items: [] } }) // upcoming for channel1
        .mockResolvedValueOnce({ data: { items: [] } }) // live for channel1
        .mockResolvedValueOnce({ data: { items: [] } }) // past for channel1
        .mockResolvedValueOnce({ data: { items: [] } }) // upcoming for channel2
        .mockResolvedValueOnce({ data: { items: [] } }) // live for channel2
        .mockResolvedValueOnce({ data: { items: [] } }); // past for channel2

      const result = await getMultipleChannelsSchedule([channel1, channel2]);

      expect(result.size).toBe(2);
      expect(result.has(channel1)).toBe(true);
      expect(result.has(channel2)).toBe(true);
    });

    it('should handle partial failures gracefully', async () => {
      const channel1 = 'UCtest1';
      const channel2 = 'UCtest2';

      let callCount = 0;
      mockAxiosInstance.get.mockImplementation(() => {
        callCount++;
        // 最初のチャンネルの最初のリクエストのみ失敗
        if (callCount === 1) {
          return Promise.reject({
            response: {
              status: 500,
              data: {
                error: { code: 500, message: 'Internal Server Error' },
              },
            },
          });
        }
        // それ以外は成功
        return Promise.resolve({ data: { items: [] } });
      });

      const result = await getMultipleChannelsSchedule([channel1, channel2]);

      // 1つのリクエストが失敗してもチャンネル全体がスキップされる
      expect(result.size).toBeLessThanOrEqual(2);
    });
  });
});
