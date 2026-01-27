import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { UserProfile } from '../shared/interfaces/user';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);

      if (response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Store tokens and user data
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return response.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);

      if (response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Store tokens and user data
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return response.data;
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed:', error);
    }

    // Clear local storage
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async assignTenantRole(data: {
    dateOfBirth: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  }): Promise<{ message: string; user: UserProfile }> {
    try {
      const response = await api.post<{ message: string; user: UserProfile }>(
        '/users/me/assign-tenant-role',
        data
      );

      if (response.data) {
        // Update user in storage
        const updatedUser = await this.getCurrentUser();
        if (updatedUser) {
          updatedUser.role = 'tenant';
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return response.data;
      } else {
        throw new Error('Role assignment failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Role assignment failed');
    }
  }

  async applyForAgentRole(data: {
    licenseNumber: string;
    agency?: string;
    specialization?: string;
    experienceYears?: number;
    bio?: string;
  }): Promise<{ message: string; application: any }> {
    try {
      const response = await api.post<{ message: string; application: any }>(
        '/users/me/apply-agent-role',
        data
      );

      if (response.data) {
        return response.data;
      } else {
        throw new Error('Agent application failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Agent application failed');
    }
  }

  async getRoleStatus(): Promise<{
    role: string | null;
    hasTenantProfile: boolean;
    hasAgentProfile: boolean;
    pendingAgentApplication: boolean;
  }> {
    try {
      const response = await api.get('/users/me/role-status');

      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to get role status');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get role status');
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });

      if (response.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;

      // Test the token by making a request
      const response = await api.get('/users/me');
      return !!response.data;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
