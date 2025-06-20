import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://carintel.nl',
    'https://www.carintel.nl',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.carintel.nl');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;
  const client = await pool.connect();
  
  try {
    switch (action) {
      case 'create-admin':
        return await createAdminUser(client, res);
      case 'create-test-data':
        return await createTestData(client, res);
      case 'cleanup-old':
        return await cleanupOldData(client, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Cleanup API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    client.release();
  }
}

async function createAdminUser(client: any, res: VercelResponse) {
  try {
    // Check if admin user already exists
    const adminExists = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['sanderhelmink@gmail.com']
    );

    if (adminExists.rows.length > 0) {
      // Update existing user to admin
      await client.query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        ['admin', 'sanderhelmink@gmail.com']
      );
      
      return res.status(200).json({
        success: true,
        message: 'Admin role updated for existing user',
        user: adminExists.rows[0]
      });
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      const result = await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, role, created_at
      `, ['sanderhelmink@gmail.com', hashedPassword, 'Sander Helmink', 'admin']);

      return res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        user: result.rows[0]
      });
    }
  } catch (error: any) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }
}

async function createTestData(client: any, res: VercelResponse) {
  try {
    // Create some test anonymous searches
    const testSearches = [
      { query: '12-ABC-3', type: 'KENTEKEN' },
      { query: '34-DEF-5', type: 'KENTEKEN' },
      { query: '56-GHI-7', type: 'KENTEKEN' },
      { query: 'BMW', type: 'MERK' },
      { query: 'Mercedes', type: 'MERK' }
    ];

    for (const search of testSearches) {
      await client.query(`
        INSERT INTO anonymous_searches (search_query, search_type, result_count, session_id, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        search.query, 
        search.type, 
        Math.floor(Math.random() * 10) + 1,
        `test_session_${Math.random().toString(36).substr(2, 9)}`,
        '127.0.0.1',
        new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
      ]);
    }

    // Create some test users
    const testUsers = [
      { email: 'test1@example.com', name: 'Test User 1' },
      { email: 'test2@example.com', name: 'Test User 2' },
      { email: 'test3@example.com', name: 'Test User 3' }
    ];

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      try {
        await client.query(`
          INSERT INTO users (email, password_hash, name, created_at)
          VALUES ($1, $2, $3, $4)
        `, [
          user.email, 
          hashedPassword, 
          user.name,
          new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random date within last 14 days
        ]);
      } catch (error: any) {
        // Ignore duplicate key errors
        if (!error.message.includes('duplicate key')) {
          throw error;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Test data created successfully'
    });
  } catch (error: any) {
    throw new Error(`Failed to create test data: ${error.message}`);
  }
}

async function cleanupOldData(client: any, res: VercelResponse) {
  try {
    // Clean up old anonymous searches (older than 30 days)
    const anonymousResult = await client.query(`
      DELETE FROM anonymous_searches 
      WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
    `);

    // Clean up old activity logs (older than 90 days)
    const activityResult = await client.query(`
      DELETE FROM activity_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
    `);

    // Clean up old saved searches (older than 365 days)
    const savedSearchesResult = await client.query(`
      DELETE FROM saved_searches 
      WHERE created_at < CURRENT_DATE - INTERVAL '365 days'
    `);

    return res.status(200).json({
      success: true,
      message: 'Old data cleaned up successfully',
      deleted: {
        anonymousSearches: anonymousResult.rowCount,
        activityLogs: activityResult.rowCount,
        savedSearches: savedSearchesResult.rowCount
      }
    });
  } catch (error: any) {
    throw new Error(`Failed to cleanup old data: ${error.message}`);
  }
} 