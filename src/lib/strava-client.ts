import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { StravaTokens } from '../config/types.js';

export interface StravaClientConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/**
 * StravaClient handles all interactions with the Strava API v3.
 * Automatically manages OAuth 2.0 token refresh to ensure requests always use valid tokens.
 * 
 * @example
 * ```typescript
 * const client = new StravaClient({
 *   clientId: process.env.STRAVA_CLIENT_ID!,
 *   clientSecret: process.env.STRAVA_CLIENT_SECRET!,
 *   refreshToken: process.env.STRAVA_REFRESH_TOKEN!,
 * });
 * 
 * // Make any API request
 * const activities = await client.request('GET', '/athlete/activities');
 * ```
 */
export class StravaClient {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: StravaClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;

    this.axiosInstance = axios.create({
      baseURL: 'https://www.strava.com/api/v3',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add access token and handle refresh
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401 errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.refreshAccessToken();
          if (this.accessToken) {
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
          }
          return this.axiosInstance(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Ensures the access token is valid, refreshing if necessary.
   * Tokens are refreshed 5 minutes before expiry to prevent edge cases.
   */
  private async ensureValidToken(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // Refresh 5 minutes before expiry

    if (!this.accessToken || this.tokenExpiresAt - now < bufferTime) {
      if (this.isRefreshing) {
        await this.refreshPromise;
      } else {
        await this.refreshAccessToken();
      }
    }
  }

  /**
   * Refreshes the access token using the refresh token.
   * This method is thread-safe and prevents multiple concurrent refresh attempts.
   * 
   * @throws {Error} If token refresh fails
   */
  private async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing) {
      await this.refreshPromise;
      return;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await axios.post<StravaTokens>(
          'https://www.strava.com/oauth/token',
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
          }
        );

        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
        this.tokenExpiresAt = response.data.expires_at;

        console.error('[StravaClient] Token refreshed successfully');
      } catch (error) {
        console.error('[StravaClient] Failed to refresh access token:', error);
        throw new Error('Failed to refresh Strava access token');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  /**
   * Generic request method to support ALL Strava API endpoints dynamically.
   * This method handles authentication, token refresh, and error handling automatically.
   * 
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param endpoint - API endpoint path (e.g., '/athlete', '/activities/123')
   * @param data - Request body for POST/PUT requests
   * @param config - Additional axios configuration (query params, headers, etc.)
   * @returns Promise resolving to the API response data
   * 
   * @example
   * ```typescript
   * // GET request with query parameters
   * const activities = await client.request('GET', '/athlete/activities', undefined, {
   *   params: { per_page: 30, page: 1 }
   * });
   * 
   * // POST request with body
   * const activity = await client.request('POST', '/activities', {
   *   name: 'Morning Run',
   *   type: 'Run',
   *   start_date_local: '2024-01-13T06:00:00Z',
   *   elapsed_time: 3600,
   *   distance: 10000
   * });
   * 
   * // PUT request to update
   * const updated = await client.request('PUT', '/activities/123', {
   *   name: 'Updated Run Name',
   *   description: 'Great run with perfect weather!'
   * });
   * ```
   */
  async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      ...config,
    };

    const response = await this.axiosInstance.request<T>(requestConfig);
    return response.data;
  }

  /**
   * Convenience method for GET requests
   * @param endpoint - API endpoint path
   * @param config - Additional axios configuration (query params, headers, etc.)
   */
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * Convenience method for POST requests
   * @param endpoint - API endpoint path
   * @param data - Request body
   * @param config - Additional axios configuration
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  /**
   * Convenience method for PUT requests
   * @param endpoint - API endpoint path
   * @param data - Request body
   * @param config - Additional axios configuration
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  /**
   * Convenience method for DELETE requests
   * @param endpoint - API endpoint path
   * @param config - Additional axios configuration
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}
