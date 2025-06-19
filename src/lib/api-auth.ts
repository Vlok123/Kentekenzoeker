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

  // Get admin activity logs
  static async getAdminLogs(token: string, page: number = 1, limit: number = 50) {
    const response = await fetch(`${API_BASE_URL}/auth?action=admin-logs&page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch admin logs');
    }

    return data;
  }

  // Save search results (kentekens from search)
  static async saveSearchResults(token: string, kentekens: string[], name: string, searchQuery?: string, searchFilters?: any) {
    const response = await fetch(`${API_BASE_URL}/auth?action=save-search-results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kentekens,
        name,
        searchQuery,
        searchFilters
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save search results');
    }

    return data;
  }

  // Get saved search results for user
  static async getSavedSearchResults(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=get-saved-searches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch saved searches');
    }

    return data;
  }

  // Delete saved search result
  static async deleteSavedSearchResult(token: string, searchId: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=delete-saved-search`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete saved search');
    }

    return data;
  }

  // Save individual vehicle
  static async saveVehicle(token: string, kenteken: string, vehicleData: any, notes?: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=save-vehicle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kenteken,
        vehicleData,
        notes
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save vehicle');
    }

    return data;
  }

  // Get saved vehicles for user
  static async getSavedVehicles(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=get-saved-vehicles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch saved vehicles');
    }

    return data;
  }

  // Cleanup old data (admin only)
  static async cleanupOldData(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=cleanup-old-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cleanup old data');
    }

    return data;
  }
} 