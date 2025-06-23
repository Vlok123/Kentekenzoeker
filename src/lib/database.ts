import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Users table with email verification and password reset
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add indexes for tokens
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
    `);

    // Saved searches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        search_query TEXT,
        search_filters JSONB,
        name VARCHAR(255) NOT NULL,
        kentekens JSONB DEFAULT '[]'::jsonb,
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

    // Activity logs table for tracking user actions
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
    `);

    // Anonymous searches table for tracking non-logged-in users
    await client.query(`
      CREATE TABLE IF NOT EXISTS anonymous_searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        search_query VARCHAR(255) NOT NULL,
        search_type VARCHAR(50) NOT NULL,
        search_filters JSONB,
        result_count INTEGER DEFAULT 0,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_search_query ON anonymous_searches(search_query);
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_search_type ON anonymous_searches(search_type);
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_created_at ON anonymous_searches(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_anonymous_searches_session_id ON anonymous_searches(session_id);
    `);

    // Create cleanup function for old saved vehicles (30 days)
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_saved_vehicles()
      RETURNS void AS $$
      BEGIN
        DELETE FROM saved_vehicles 
        WHERE created_at < NOW() - INTERVAL '30 days';
        
        DELETE FROM saved_searches 
        WHERE created_at < NOW() - INTERVAL '30 days';
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create admin user if not exists
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['sanderhelmink@gmail.com']
    );

    if (adminExists.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, role, email_verified)
        VALUES ($1, $2, $3, $4, $5)
      `, ['sanderhelmink@gmail.com', hashedPassword, 'Sander Helmink', 'admin', true]);
      
      console.log('Admin user created for sanderhelmink@gmail.com');
    } else {
      // Update existing admin user to be verified
      await client.query(`
        UPDATE users 
        SET email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_expires = NULL
        WHERE email = $1
      `, ['sanderhelmink@gmail.com']);
      
      console.log('Admin user updated to verified status');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { pool }; 