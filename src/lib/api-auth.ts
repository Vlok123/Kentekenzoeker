import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

// Use local API in development to avoid CORS issues
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : '/api'; // Use local API in development

// Helper function for authenticated requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get token from zustand store in localStorage
  let token: string | null = null;
  
  try {
    const storedData = localStorage.getItem('rdw-app-storage');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      token = parsedData.state?.token || null;
    }
  } catch (error) {
    console.error('Error parsing stored auth data:', error);
  }
  
  if (!token) {
    throw new Error('Geen autorisatie token');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if response is HTML (indicates routing issue)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server configuration error - API endpoint not found. Please contact support.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error: any) {
    // Handle JSON parsing errors specifically
    if (error.message.includes('Unexpected token')) {
      throw new Error('Server configuration error - received HTML instead of JSON. Please contact support.');
    }
    throw error;
  }
}

export class ApiAuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      // Check if response is HTML (indicates routing issue)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server configuration error - API endpoint not found. Please contact support.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return data;
    } catch (error: any) {
      // Handle JSON parsing errors specifically
      if (error.message.includes('Unexpected token')) {
        throw new Error('Server configuration error - received HTML instead of JSON. Please contact support.');
      }
      throw error;
    }
  }

  // Register new user
  static async register(data: RegisterData): Promise<{ message: string }> {
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

  // Get admin debug information
  static async getAdminDebug(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth?action=admin-debug`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch admin debug info');
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

  // Log search activity
  static async logSearch(token: string, searchQuery: string, searchFilters: any, resultCount: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=log-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          searchFilters,
          resultCount
        }),
      });

      // Don't throw errors for logging failures to avoid breaking the search flow
      if (!response.ok) {
        console.warn('Failed to log search activity');
      }
    } catch (error) {
      console.warn('Failed to log search activity:', error);
    }
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

  // Log anonymous search (for users without account)
  static async logAnonymousSearch(searchQuery: string, searchType: string, searchFilters?: any, resultCount?: number) {
    try {
      // Generate a simple session ID if not available
      let sessionId = localStorage.getItem('carintel-session-id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('carintel-session-id', sessionId);
      }

      const response = await fetch(`${API_BASE_URL}/auth?action=log-anonymous-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          searchType,
          searchFilters,
          resultCount: resultCount || 0,
          sessionId
        }),
      });

      // Don't throw errors for logging failures to avoid breaking the search flow
      if (!response.ok) {
        console.warn('Failed to log anonymous search activity');
      }
    } catch (error) {
      console.warn('Failed to log anonymous search activity:', error);
    }
  }

  // Verify email with token
  static async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth?action=verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Email verification failed');
    }

    return data;
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth?action=request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }

    return data;
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth?action=reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return data;
  }

  // Resend email verification
  static async resendEmailVerification(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth?action=resend-email-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend verification email');
    }

    return data;
  }

  // Verkeersschetsen methods
  static async getSketches(): Promise<{ sketches: any[] }> {
    return await fetchWithAuth('/sketches?action=list');
  }

  static async getSketch(id: string): Promise<{ sketch: any }> {
    return await fetchWithAuth(`/sketches?action=get&id=${id}`);
  }

  static async saveSketch(sketchData: {
    title: string;
    description?: string;
    location?: string;
    incidents: any[];
    drawnLines: any[];
    metadata: any;
    isPublic?: boolean;
  }): Promise<{ message: string; sketch: any }> {
    return await fetchWithAuth('/sketches?action=save', {
      method: 'POST',
      body: JSON.stringify(sketchData),
    });
  }

  static async updateSketch(id: string, sketchData: {
    title: string;
    description?: string;
    location?: string;
    incidents: any[];
    drawnLines: any[];
    metadata: any;
    isPublic?: boolean;
  }): Promise<{ message: string; sketch: any }> {
    return await fetchWithAuth(`/sketches?action=update&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(sketchData),
    });
  }

  static async deleteSketch(id: string): Promise<{ message: string }> {
    return await fetchWithAuth(`/sketches?action=delete&id=${id}`, {
      method: 'DELETE',
    });
  }
} 