import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('accessToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(
    response: Response,
    url: string,
    config: RequestInit
  ): Promise<ApiResponse<T>> {
    // Handle 401 (token expired)
    if (response.status === 401) {
      try {
        await this.refreshToken();
        // Retry with new token and original request config
        const newHeaders = await this.getAuthHeaders();
        const retryResponse = await fetch(url, {
          ...config,
          headers: {
            ...newHeaders,
            ...(config.headers || {}),
          },
        });
        return this.parseResponse<T>(retryResponse);
      } catch (error) {
        // Clear tokens and redirect to login
        await this.clearTokens();
        throw new Error('Authentication expired. Please login again.');
      }
    }

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      if (response.status === 204) {
        return { data: undefined as T };
      }

      const text = await response.text();
      if (!text) {
        return { data: undefined as T };
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return { data };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse response');
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response, url, config);
    } catch (error) {
      if (
        error instanceof TypeError &&
        /Network request failed/i.test(error.message)
      ) {
        const friendly =
          'Cannot reach the API. Check EXPO_PUBLIC_API_URL, Wi-Fi network, and that the server is running.';
        console.error('API Error:', friendly);
        throw new Error(friendly);
      }

      console.error('API Error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.get('/properties');
      console.log('Connection test response:', response);
      return !!response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Expose current base URL for diagnostics
  getBaseUrl(): string {
    console.log('Current API Base URL:', this.baseURL);
    return this.baseURL;
  }
}

export const api = new ApiService();
export default api;
