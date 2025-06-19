import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './database';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [credentials.email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new Error('Gebruiker niet gevonden');
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Ongeldig wachtwoord');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return { user: userData, token };
    } finally {
      client.release();
    }
  }

  // Register new user
  static async register(data: RegisterData): Promise<AuthResponse> {
    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Gebruiker bestaat al met dit email adres');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, role, created_at, updated_at`,
        [data.email.toLowerCase(), hashedPassword, data.name]
      );

      const user = result.rows[0];

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return { user: userData, token };
    } finally {
      client.release();
    }
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT * FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const user = result.rows[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return null;
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } finally {
      client.release();
    }
  }

  // Save search for user
  static async saveSearch(userId: string, searchQuery: string, searchFilters: any, name: string) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `INSERT INTO saved_searches (user_id, search_query, search_filters, name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, searchQuery, JSON.stringify(searchFilters), name]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Save vehicle for user
  static async saveVehicle(userId: string, kenteken: string, vehicleData: any, notes?: string) {
    const client = await pool.connect();
    
    try {
      // Check if vehicle is already saved
      const existing = await client.query(
        'SELECT id FROM saved_vehicles WHERE user_id = $1 AND kenteken = $2',
        [userId, kenteken]
      );

      if (existing.rows.length > 0) {
        throw new Error('Dit voertuig is al opgeslagen');
      }

      const result = await client.query(
        `INSERT INTO saved_vehicles (user_id, kenteken, vehicle_data, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, kenteken, JSON.stringify(vehicleData), notes]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get saved searches for user
  static async getSavedSearches(userId: string) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get saved vehicles for user
  static async getSavedVehicles(userId: string) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM saved_vehicles WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }
} 