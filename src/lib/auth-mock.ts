import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

// Mock users database (in-memory for demo)
const mockUsers: User[] = [
  {
    id: '1',
    email: 'sanderhelmink@gmail.com',
    name: 'Sander Helmink',
    role: 'admin',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01')
  }
];

// Mock JWT token (just base64 encoded user info for demo)
const createMockToken = (user: User): string => {
  return btoa(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  }));
};

const verifyMockToken = (token: string): any => {
  try {
    const decoded = JSON.parse(atob(token));
    if (decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export class MockAuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const user = mockUsers.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
    
    if (!user) {
      throw new Error('Gebruiker niet gevonden');
    }

    // For demo purposes, accept admin123! for admin and any password for others
    const isValidPassword = 
      (user.email === 'sanderhelmink@gmail.com' && credentials.password === 'admin123!') ||
      (user.email !== 'sanderhelmink@gmail.com');

    if (!isValidPassword) {
      throw new Error('Ongeldig wachtwoord');
    }

    const token = createMockToken(user);
    return { user, token };
  }

  // Register new user
  static async register(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
      throw new Error('Gebruiker bestaat al met dit email adres');
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email.toLowerCase(),
      name: data.name || data.email.split('@')[0],
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockUsers.push(newUser);

    const token = createMockToken(newUser);
    return { user: newUser, token };
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    const decoded = verifyMockToken(token);
    if (!decoded) {
      return null;
    }

    const user = mockUsers.find(u => u.id === decoded.userId);
    return user || null;
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    return mockUsers.find(u => u.id === userId) || null;
  }

  // Mock save functions (just log for now)
  static async saveSearch(userId: string, searchQuery: string, searchFilters: any, name: string) {
    console.log('Mock: Saving search for user', userId, { searchQuery, searchFilters, name });
    return {
      id: Date.now().toString(),
      user_id: userId,
      search_query: searchQuery,
      search_filters: searchFilters,
      name,
      created_at: new Date()
    };
  }

  static async saveVehicle(userId: string, kenteken: string, vehicleData: any, notes?: string) {
    console.log('Mock: Saving vehicle for user', userId, { kenteken, vehicleData, notes });
    return {
      id: Date.now().toString(),
      user_id: userId,
      kenteken,
      vehicle_data: vehicleData,
      notes,
      created_at: new Date()
    };
  }

  static async getSavedSearches(userId: string) {
    console.log('Mock: Getting saved searches for user', userId);
    return [];
  }

  static async getSavedVehicles(userId: string) {
    console.log('Mock: Getting saved vehicles for user', userId);
    return [];
  }
} 