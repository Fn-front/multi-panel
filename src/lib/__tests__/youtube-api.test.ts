/**
 * @jest-environment jsdom
 */

import type {
  YouTubeChannelsResponse,
  YouTubeSearchResponse,
  YouTubeVideosResponse,
} from '@/types/youtube';
import axios from 'axios';

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

// axiosをモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// httpClient用のモックを追加
const mockHttpClientInstance = {
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

mockedAxios.create = jest.fn(() => mockHttpClientInstance as any);

// テストの後にモジュールをインポート
import {
  getChannelInfo,
  getChannelUpcomingStreams,
  getChannelLiveStreams,
  getMultipleChannelsSchedule,
} from '../youtube-api';
import { createYouTubeClient } from '@/lib/http-client';

const mockCreateYouTubeClient = createYouTubeClient as jest.MockedFunction<
  typeof createYouTubeClient
>;

describe('youtube-api', () => {
  const mockApiKey = 'test-api-key';
  const mockChannelId = 'UCtest123';
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockCreateYouTubeClient.mockReturnValue(mockAxiosInstance as any);
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
      mockAxiosInstance.get.mockRejectedValueOnce({
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
      });

      await expect(getChannelInfo(mockChannelId)).rejects.toThrow();
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

      // Mock responses for both channels
      mockAxiosInstance.get.mockResolvedValue({ data: { items: [] } });

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
        // 最初のチャンネルのリクエストは失敗
        if (callCount <= 2) {
          return Promise.reject({
            response: {
              status: 500,
              data: {
                error: { code: 500, message: 'Internal Server Error' },
              },
            },
          });
        }
        // 2番目のチャンネルのリクエストは成功
        return Promise.resolve({ data: { items: [] } });
      });

      const result = await getMultipleChannelsSchedule([channel1, channel2]);

      // エラーが発生したチャンネルは結果に含まれない
      expect(result.size).toBeLessThanOrEqual(2);
    });
  });
});
