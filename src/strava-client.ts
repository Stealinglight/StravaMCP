import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface StravaClientConfig {
  clientId: string;
  clientSecret: string;
  tokens: StravaTokens;
  onTokenRefresh?: (tokens: StravaTokens) => void;
}

export class StravaClient {
  private clientId: string;
  private clientSecret: string;
  private tokens: StravaTokens;
  private onTokenRefresh?: (tokens: StravaTokens) => void;
  private axiosInstance: AxiosInstance;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: StravaClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokens = config.tokens;
    this.onTokenRefresh = config.onTokenRefresh;

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
        config.headers.Authorization = `Bearer ${this.tokens.access_token}`;
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
          originalRequest.headers.Authorization = `Bearer ${this.tokens.access_token}`;
          return this.axiosInstance(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Ensures the access token is valid, refreshing if necessary
   */
  private async ensureValidToken(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // Refresh 5 minutes before expiry

    if (this.tokens.expires_at - now < bufferTime) {
      if (this.isRefreshing) {
        await this.refreshPromise;
      } else {
        await this.refreshAccessToken();
      }
    }
  }

  /**
   * Refreshes the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing) {
      await this.refreshPromise;
      return;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await axios.post('https://www.strava.com/oauth/token', {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token,
        });

        this.tokens = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: response.data.expires_at,
        };

        if (this.onTokenRefresh) {
          this.onTokenRefresh(this.tokens);
        }
      } catch (error) {
        console.error('Failed to refresh access token:', error);
        throw new Error('Failed to refresh access token');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    await this.refreshPromise;
  }

  /**
   * Generic request method to support ALL Strava API endpoints dynamically
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param endpoint - API endpoint path (e.g., '/athlete', '/activities')
   * @param data - Request body for POST/PUT requests
   * @param config - Additional axios configuration
   */
  async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      ...config,
    };

    return this.axiosInstance.request<T>(requestConfig);
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  /**
   * Get current tokens
   */
  getTokens(): StravaTokens {
    return { ...this.tokens };
  }

  /**
   * Update tokens manually
   */
  setTokens(tokens: StravaTokens): void {
    this.tokens = tokens;
  }
}
