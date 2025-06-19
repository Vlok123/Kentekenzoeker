import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'register':
        return await handleRegister(req, res);
      case 'verify':
        return await handleVerify(req, res);
      case 'admin-stats':
        return await handleAdminStats(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  }

  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Gebruiker niet gevonden' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ongeldig wachtwoord' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.status(200).json({ user: userData, token });
  } finally {
    client.release();
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Wachtwoord moet minimaal 6 karakters lang zijn' });
  }

  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Gebruiker bestaat al met dit email adres' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, created_at, updated_at`,
      [email.toLowerCase(), hashedPassword, name || null]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.status(201).json({ user: userData, token });
  } finally {
    client.release();
  }
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Gebruiker niet gevonden' });
      }

      const user = result.rows[0];
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return res.status(200).json({ user: userData });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleAdminStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user is admin
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Geen admin rechten' });
      }

      // Get statistics
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(usersResult.rows[0].count);

      const searchesResult = await client.query('SELECT COUNT(*) as count FROM saved_searches');
      const totalSavedSearches = parseInt(searchesResult.rows[0].count);

      const vehiclesResult = await client.query('SELECT COUNT(*) as count FROM saved_vehicles');
      const totalSavedVehicles = parseInt(vehiclesResult.rows[0].count);

      const recentUsersResult = await client.query(`
        SELECT id, email, name, role, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      const recentUsers = recentUsersResult.rows;

      return res.status(200).json({
        totalUsers,
        totalSavedSearches,
        totalSavedVehicles,
        recentUsers
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
} 