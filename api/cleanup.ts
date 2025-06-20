import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
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
    'http://localhost:3000'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.carintel.nl');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cleanup-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - you can add a secret key verification here
  const authKey = req.headers['x-cleanup-key'];
  if (authKey !== process.env.CLEANUP_SECRET_KEY && authKey !== 'cleanup-secret-2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  
  try {
    // Execute cleanup function
    const result = await client.query('SELECT cleanup_old_saved_vehicles()');
    
    // Get count of deleted records
    const deletedVehicles = await client.query(`
      SELECT COUNT(*) as count 
      FROM saved_vehicles 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    
    const deletedSearches = await client.query(`
      SELECT COUNT(*) as count 
      FROM saved_searches 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);

    // Log the cleanup activity
    await client.query(`
      INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES (
        (SELECT id FROM users WHERE email = 'sanderhelmink@gmail.com' LIMIT 1),
        'AUTOMATED_CLEANUP',
        $1,
        $2,
        'Vercel Cron Job'
      )
    `, [
      JSON.stringify({
        vehicles_cleaned: deletedVehicles.rows[0].count,
        searches_cleaned: deletedSearches.rows[0].count,
        timestamp: new Date().toISOString()
      }),
      req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown'
    ]);

    // Actually delete the old records
    await client.query('SELECT cleanup_old_saved_vehicles()');

    return res.status(200).json({ 
      success: true,
      message: 'Cleanup completed successfully',
      deleted_vehicles: deletedVehicles.rows[0].count,
      deleted_searches: deletedSearches.rows[0].count
    });
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ 
      error: error.message || 'Cleanup failed',
      success: false
    });
  } finally {
    client.release();
  }
} 