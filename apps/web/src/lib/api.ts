/**
 * API Client
 * 
 * Provides typed API calls to the BrainBolt backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private userId: string | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth
  async login(username: string): Promise<ApiResponse<{ user: { id: string; username: string } }>> {
    return this.request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  // Quiz
  async getNextQuestion(): Promise<ApiResponse<any>> {
    return this.request('/v1/quiz/next');
  }

  async submitAnswer(
    questionId: string,
    selectedIndex: number,
    stateVersion: number,
    answerIdempotencyKey: string
  ): Promise<ApiResponse<any>> {
    return this.request('/v1/quiz/answer', {
      method: 'POST',
      body: JSON.stringify({
        questionId,
        selectedIndex,
        stateVersion,
        answerIdempotencyKey,
      }),
    });
  }

  async getUserState(): Promise<ApiResponse<any>> {
    return this.request('/v1/quiz/state');
  }

  async getMetrics(): Promise<ApiResponse<any>> {
    return this.request('/v1/quiz/metrics');
  }

  // Leaderboard
  async getScoreLeaderboard(limit: number = 100, userId?: string): Promise<ApiResponse<any>> {
    let url = `/v1/leaderboard/score?limit=${limit}`;
    if (userId) url += `&userId=${userId}`;
    return this.request(url);
  }

  async getStreakLeaderboard(limit: number = 100, userId?: string): Promise<ApiResponse<any>> {
    let url = `/v1/leaderboard/streak?limit=${limit}`;
    if (userId) url += `&userId=${userId}`;
    return this.request(url);
  }
}

export const api = new ApiClient();
export default api;
