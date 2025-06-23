import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './database';
import { EmailService } from './email';
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

      // Check if email is verified
      if (!user.email_verified) {
        throw new Error('Email adres is nog niet geverifieerd. Controleer je inbox voor de verificatie email.');
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
  static async register(data: RegisterData): Promise<{ message: string }> {
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

      // Generate email verification token
      const emailToken = EmailService.generateToken();
      const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with email verification token
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, email_verification_token, email_verification_expires)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name`,
        [data.email.toLowerCase(), hashedPassword, data.name, emailToken, emailExpires]
      );

      const user = result.rows[0];

      // Send verification email
      try {
        await EmailService.sendEmailVerification(user.email, user.name || '', emailToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue registration even if email fails
      }

      return { message: 'Account aangemaakt! Controleer je email voor de verificatie link.' };
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

  // Verify email with token
  static async verifyEmail(token: string): Promise<{ message: string }> {
    const client = await pool.connect();
    
    try {
      // Find user by verification token
      const result = await client.query(
        'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Ongeldige of verlopen verificatie link');
      }

      const user = result.rows[0];

      // Update user to verified and clear token
      await client.query(
        `UPDATE users 
         SET email_verified = TRUE, 
             email_verification_token = NULL, 
             email_verification_expires = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [user.id]
      );

      return { message: 'Email succesvol geverifieerd! Je kunt nu inloggen.' };
    } finally {
      client.release();
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<{ message: string }> {
    const client = await pool.connect();
    
    try {
      // Find user by email
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists or not for security
        return { message: 'Als dit email adres bestaat, is er een wachtwoord reset link verstuurd.' };
      }

      const user = result.rows[0];

      // Generate password reset token
      const resetToken = EmailService.generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await client.query(
        `UPDATE users 
         SET password_reset_token = $1, 
             password_reset_expires = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [resetToken, resetExpires, user.id]
      );

      // Send password reset email
      try {
        await EmailService.sendPasswordReset(user.email, user.name || '', resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue even if email fails
      }

      return { message: 'Als dit email adres bestaat, is er een wachtwoord reset link verstuurd.' };
    } finally {
      client.release();
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const client = await pool.connect();
    
    try {
      // Find user by reset token
      const result = await client.query(
        'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Ongeldige of verlopen wachtwoord reset link');
      }

      const user = result.rows[0];

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await client.query(
        `UPDATE users 
         SET password_hash = $1, 
             password_reset_token = NULL, 
             password_reset_expires = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      return { message: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen met je nieuwe wachtwoord.' };
    } finally {
      client.release();
    }
  }

  // Resend email verification
  static async resendEmailVerification(email: string): Promise<{ message: string }> {
    const client = await pool.connect();
    
    try {
      // Find user by email
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new Error('Gebruiker niet gevonden');
      }

      const user = result.rows[0];

      if (user.email_verified) {
        throw new Error('Email adres is al geverifieerd');
      }

      // Generate new verification token
      const emailToken = EmailService.generateToken();
      const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update verification token
      await client.query(
        `UPDATE users 
         SET email_verification_token = $1, 
             email_verification_expires = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [emailToken, emailExpires, user.id]
      );

      // Send verification email
      try {
        await EmailService.sendEmailVerification(user.email, user.name || '', emailToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        throw new Error('Kon verificatie email niet versturen. Probeer het later opnieuw.');
      }

      return { message: 'Nieuwe verificatie email verstuurd! Controleer je inbox.' };
    } finally {
      client.release();
    }
  }
} 