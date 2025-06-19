import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mijnkentekencheck.nl/api' 
  : '/api';

export class ApiAuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  }

  // Register new user
  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth?action=register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Registration failed');
    }

    return result;
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      return null;
    }
  }

  // Get admin statistics
  static async getAdminStats(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=admin-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch admin stats');
    }

    return data;
  }
} 