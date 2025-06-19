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
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123!', 12);
      
      await client.query(`
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
      `, ['sanderhelmink@gmail.com', hashedPassword, 'Sander Helmink', 'admin']);
      
      console.log('Admin user created for sanderhelmink@gmail.com');
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