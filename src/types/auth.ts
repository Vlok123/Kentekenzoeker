// Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  search_query: string;
  search_filters: any;
  name: string;
  created_at: Date;
}

export interface SavedVehicle {
  id: string;
  user_id: string;
  kenteken: string;
  vehicle_data: any;
  notes?: string;
  created_at: Date;
} 