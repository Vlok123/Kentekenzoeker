import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

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

  const client = await pool.connect();
  
  try {
    console.log('🚀 Initializing database schema...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');

    // Create activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Activity logs table created/verified');

    // Create anonymous_searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anonymous_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        search_query VARCHAR(255),
        search_type VARCHAR(50) NOT NULL,
        search_filters JSONB DEFAULT '{}',
        result_count INTEGER DEFAULT 0,
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Anonymous searches table created/verified');

    // Create saved_searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        kentekens TEXT[] NOT NULL,
        search_query VARCHAR(255),
        search_filters JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Saved searches table created/verified');

    // Create saved_vehicles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        kenteken VARCHAR(20) NOT NULL,
        vehicle_data JSONB NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, kenteken)
      )
    `);
    console.log('✅ Saved vehicles table created/verified');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_search_type ON anonymous_searches(search_type);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_created_at ON anonymous_searches(created_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_saved_vehicles_user_id ON saved_vehicles(user_id);
    `);
    console.log('✅ Database indexes created/verified');

    // Get table statistics
    const tablesResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables 
      ORDER BY tablename
    `);

    const tables = tablesResult.rows;

    // Get database size
    const dbSizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    const databaseSize = dbSizeResult.rows[0].size;

    console.log('🎉 Database initialization completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Database schema initialized successfully',
      tables: tables,
      databaseSize: databaseSize,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database initialization error:', error);
    return res.status(500).json({ 
      error: 'Database initialization failed', 
      details: error.message 
    });
  } finally {
    client.release();
  }
} 