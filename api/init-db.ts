import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = await pool.connect();
  const createdTables: string[] = [];
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('users');

    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('activity_logs');

    // Create anonymous_searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anonymous_searches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id VARCHAR(255),
        ip_address INET,
        search_type VARCHAR(50),
        search_query VARCHAR(255),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('anonymous_searches');

    // Create saved_vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        kenteken VARCHAR(20) NOT NULL,
        vehicle_data JSONB NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('saved_vehicles');

    // Create saved_searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        search_query VARCHAR(255) NOT NULL,
        search_results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('saved_searches');

    // Create verkeersschetsen table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verkeersschetsen (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        incidents JSONB NOT NULL DEFAULT '[]'::jsonb,
        drawn_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    createdTables.push('verkeersschetsen');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_created_at ON anonymous_searches(created_at);
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_search_type ON anonymous_searches(search_type);
      CREATE INDEX IF NOT EXISTS idx_saved_vehicles_user_id ON saved_vehicles(user_id);
      CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
      CREATE INDEX IF NOT EXISTS idx_verkeersschetsen_user_id ON verkeersschetsen(user_id);
    `);

    return res.status(200).json({ 
      success: true, 
      message: 'Database tables created successfully',
      createdTables
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database operation failed',
      details: error.message,
      createdTables
    });
  } finally {
    client.release();
  }
} 