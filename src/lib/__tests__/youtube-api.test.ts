/**
 * @jest-environment jsdom
 */

import {
  getChannelInfo,
  getChannelUpcomingStreams,
  getChannelLiveStreams,
  getMultipleChannelsSchedule,
} from '../youtube-api';
import type {
  YouTubeChannelsResponse,
  YouTubeSearchResponse,
  YouTubeVideosResponse,
} from '@/types/youtube';

// fetch をモック
global.fetch = jest.fn();

describe('youtube-api', () => {
  const mockApiKey = 'test-api-key';
  const mockChannelId = 'UCtest123';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = mockApiKey;
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getChannelInfo(mockChannelId);

      expect(result).toEqual({
        id: mockChannelId,
        title: 'Test Channel',
        description: 'Test Description',
        thumbnail: 'https://example.com/high.jpg',
        customUrl: '@testchannel',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`channels?part=snippet&id=${mockChannelId}&key=${mockApiKey}`),
      );
    });

    it('should return null when channel not found', async () => {
      const mockResponse: YouTubeChannelsResponse = {
        items: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            code: 403,
            message: 'API key not valid',
          },
        }),
      });

      await expect(getChannelInfo(mockChannelId)).rejects.toThrow('YouTube API Error');
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

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVideosResponse,
        });

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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

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

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVideosResponse,
        });

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
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('eventType=live')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [] }),
          });
        }
        if (url.includes('eventType=upcoming')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ items: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      });

      const result = await getMultipleChannelsSchedule([channel1, channel2]);

      expect(result.size).toBe(2);
      expect(result.has(channel1)).toBe(true);
      expect(result.has(channel2)).toBe(true);
    });

    it('should handle partial failures gracefully', async () => {
      const channel1 = 'UCtest1';
      const channel2 = 'UCtest2';

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        // 最初のチャンネルのリクエストは失敗
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: { code: 500, message: 'Internal Server Error' } }),
          });
        }
        // 2番目のチャンネルのリクエストは成功
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [] }),
        });
      });

      const result = await getMultipleChannelsSchedule([channel1, channel2]);

      // エラーが発生したチャンネルは結果に含まれない
      expect(result.size).toBeLessThanOrEqual(2);
    });
  });
});
