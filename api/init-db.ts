import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Saved searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        search_query TEXT,
        search_filters JSONB,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Saved vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        kenteken VARCHAR(20) NOT NULL,
        vehicle_data JSONB NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create admin user if not exists
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['sanderhelmink@gmail.com']
    );

    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
      `, ['sanderhelmink@gmail.com', hashedPassword, 'Sander Helmink', 'admin']);
      
      console.log('Admin user created for sanderhelmink@gmail.com');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      error: error.message || 'Database initialization failed' 
    });
  } finally {
    client.release();
  }
} 