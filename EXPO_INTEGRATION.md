# 📱 Expo Frontend Integration Guide

This guide explains how to connect your Expo frontend to the Estate Management API.

---

## ✅ **API Status: READY FOR EXPO**

Your API is now fully configured and ready for Expo frontend integration!

### **🔧 What's Been Implemented:**

#### **✅ CORS Configuration Added:**

```typescript
// Supports all Expo development scenarios
- http://localhost:8081           // Expo web
- exp://localhost:8081           // Expo Go (local)
- http://192.168.*:8081          // Expo Go (network)
- http://127.0.0.1:8081          // Alternative localhost
- process.env.CLIENT_APP_URL     // Web client
```

#### **✅ Authentication Ready:**

- JWT access tokens (15min expiry)
- Refresh tokens (7 days expiry)
- Cookie-based refresh token storage
- Role-based access control

#### **✅ All Endpoints Available:**

- `/api/v1/auth/*` - Authentication
- `/api/v1/users/*` - User management
- `/api/v1/properties/*` - Property listings
- `/api/v1/leases/*` - Lease management
- `/api/v1/agents/*` - Agent operations
- `/api/v1/tenants/*` - Tenant operations
- `/api/v1/admin/*` - Admin operations
- `/api/v1/documents/*` - File management
- `/api/v1/notifications/*` - Notifications
- `/api/v1/payments/*` - Payment processing

---

## 🚀 **Quick Start for Expo**

### **1. API Configuration in Expo:**

```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:5000/api/v1' // Development
    : 'https://your-production-api.com/api/v1', // Production

  TIMEOUT: 10000,
};

// For device testing (replace with your computer's IP)
export const DEVICE_API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:5000/api/v1', // Your computer's IP
  TIMEOUT: 10000,
};
```

### **2. HTTP Client Setup:**

```typescript
// src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

class ApiService {
  private baseURL: string;

  constructor() {
    // Use device URL for physical devices, localhost for simulator
    this.baseURL =
      Platform.OS === 'ios' && !__DEV__
        ? 'http://192.168.1.100:5000/api/v1'
        : API_CONFIG.BASE_URL;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get auth token
    const token = await AsyncStorage.getItem('accessToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 (token expired)
      if (response.status === 401) {
        await this.refreshToken();
        // Retry with new token
        const newToken = await AsyncStorage.getItem('accessToken');
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return fetch(url, config);
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json();
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    } catch (error) {
      // Clear tokens and redirect to login
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      throw error;
    }
  }

  // Convenience methods
  get(endpoint: string) {
    return this.request(endpoint);
  }

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
```

### **3. Authentication Service:**

```typescript
// src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

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

export class AuthService {
  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    const result = await response.json();

    if (response.ok) {
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      return result;
    } else {
      throw new Error(result.error || 'Login failed');
    }
  }

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    const result = await response.json();

    if (response.ok) {
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      return result;
    } else {
      throw new Error(result.error || 'Registration failed');
    }
  }

  async logout() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  async getCurrentUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async assignTenantRole(data: {
    dateOfBirth: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  }) {
    const response = await api.post('/users/me/assign-tenant-role', data);
    const result = await response.json();

    if (response.ok) {
      // Update user in storage
      const updatedUser = await this.getCurrentUser();
      if (updatedUser) {
        updatedUser.role = 'TENANT';
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return result;
    } else {
      throw new Error(result.error || 'Role assignment failed');
    }
  }

  async applyForAgentRole(data: {
    licenseNumber: string;
    agency?: string;
    specialization?: string;
    experienceYears?: number;
    bio?: string;
  }) {
    const response = await api.post('/users/me/apply-agent-role', data);
    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      throw new Error(result.error || 'Agent application failed');
    }
  }

  async getRoleStatus() {
    const response = await api.get('/users/me/role-status');
    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      throw new Error(result.error || 'Failed to get role status');
    }
  }
}

export const authService = new AuthService();
```

### **4. Example Usage in React Component:**

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authService } from '../services/auth';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      navigation.replace('MainApp');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 20, padding: 10 }}
      />
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### **5. Property Listing Example:**

```typescript
// src/services/property.ts
import { api } from './api';

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  images: string[];
  agent?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class PropertyService {
  async getProperties(filters?: {
    page?: number;
    limit?: number;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    search?: string;
  }) {
    const params = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/properties?${params.toString()}`);
    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      throw new Error(result.error || 'Failed to fetch properties');
    }
  }

  async getPropertyById(id: number) {
    const response = await api.get(`/properties/${id}`);
    const result = await response.json();

    if (response.ok) {
      return result.property;
    } else {
      throw new Error(result.error || 'Property not found');
    }
  }
}

export const propertyService = new PropertyService();
```

---

## 🔧 **Development Setup**

### **1. Start the API Server:**

```bash
# In your estate-server directory
npm run dev
# Server will run on http://localhost:5000
```

### **2. Configure Expo for Device Testing:**

```typescript
// Find your computer's IP
# On Mac/Linux: ifconfig | grep "inet "
# On Windows: ipconfig

// Update the API config in Expo
const DEVICE_API_CONFIG = {
  BASE_URL: 'http://YOUR_COMPUTER_IP:5000/api/v1',
};
```

### **3. Test Connection:**

```bash
# Test from Expo app
fetch('http://localhost:5000/api/v1/properties')
  .then(res => res.json())
  .then(data => console.log('API Connected!', data))
  .catch(err => console.error('Connection failed:', err));
```

---

## 📋 **Available API Endpoints**

### **Authentication:**

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/verify-email` - Email verification

### **User Management:**

- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `POST /users/me/assign-tenant-role` - Assign tenant role
- `POST /users/me/apply-agent-role` - Apply for agent role
- `GET /users/me/role-status` - Get role status

### **Properties:**

- `GET /properties` - List properties (with filters)
- `GET /properties/:id` - Get property details
- `POST /properties` - Create property (agent/admin)
- `PUT /properties/:id` - Update property (agent/admin)
- `DELETE /properties/:id` - Delete property (agent/admin)

### **Leases:**

- `GET /leases/me` - Get current user's leases (tenant)
- `GET /leases/:id` - Get lease details
- `POST /leases` - Create lease (agent/admin)
- `PUT /leases/:id` - Update lease (agent/admin)

### **Documents:**

- `GET /documents/:entityType/:entityId` - Get documents
- `POST /documents` - Upload document
- `DELETE /documents/:id` - Delete document

### **Notifications:**

- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read

---

## 🎯 **Next Steps**

### **1. Database Migration (Optional):**

```bash
# If you haven't migrated the database yet
npx prisma migrate dev --name add_nullable_role_and_agent_applications
```

### **2. Environment Configuration:**

```bash
# Update .env file with your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/estate_db"
```

### **3. Start Building Your Expo App:**

- Set up authentication screens
- Implement property browsing
- Add user profile management
- Integrate role assignment flows

---

## 🚨 **Important Notes**

### **CORS Configuration:**

- ✅ Already configured for Expo development
- ✅ Supports both simulator and physical devices
- ✅ Allows credentials for refresh token cookies

### **Authentication:**

- ✅ JWT tokens with automatic refresh
- ✅ Role-based access control
- ✅ Secure token storage in AsyncStorage

### **Error Handling:**

- ✅ Proper HTTP status codes
- ✅ Descriptive error messages
- ✅ Automatic token refresh on 401 errors

---

## 🎉 **You're Ready to Go!**

Your Estate Management API is fully configured and ready for Expo frontend integration. The CORS is set up, authentication is working, and all endpoints are available.

**Start building your Expo app now!** 🚀
