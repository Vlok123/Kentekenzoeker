import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'ea1783e3151ee64424006ef07939a2c9e31e8449500c2f0175ee496e2412fd0dc2ec9381e46229f373a4e40f4bedbca5a168390b3d68fdeb1e8e804fc8411c54';

// Ensure we have a proper JWT secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET environment variable not set! Using default secret.');
}

// Debug function to check environment
function debugEnvironment() {
  return {
    hasJwtSecret: !!JWT_SECRET,
    jwtSecretLength: JWT_SECRET?.length || 0,
    jwtSecretPreview: JWT_SECRET?.substring(0, 10) + '...',
    jwtSecretFromEnv: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    isUsingDefaultSecret: JWT_SECRET === 'ea1783e3151ee64424006ef07939a2c9e31e8449500c2f0175ee496e2412fd0dc2ec9381e46229f373a4e40f4bedbca5a168390b3d68fdeb1e8e804fc8411c54'
  };
}
const JWT_EXPIRES_IN = '7d';

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
      case 'admin-logs':
        return await handleAdminLogs(req, res);
      case 'log-search':
        return await handleLogSearch(req, res);
      case 'save-search-results':
        return await handleSaveSearchResults(req, res);
      case 'get-saved-searches':
        return await handleGetSavedSearches(req, res);
      case 'delete-saved-search':
        return await handleDeleteSavedSearch(req, res);
      case 'save-vehicle':
        return await handleSaveVehicle(req, res);
      case 'get-saved-vehicles':
        return await handleGetSavedVehicles(req, res);
      case 'cleanup-old-data':
        return await handleCleanupOldData(req, res);
      case 'admin-debug':
        return await handleAdminDebug(req, res);
      case 'log-anonymous-search':
        return await handleLogAnonymousSearch(req, res);
      case 'debug-env':
        return res.status(200).json(debugEnvironment());
      case 'force-logout-all':
        return await handleForceLogoutAll(req, res);

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

    // Log login activity
    await logActivity(user.id, 'LOGIN', { email: user.email }, req);

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

    // Log registration activity
    await logActivity(user.id, 'REGISTER', { email: user.email, name: user.name }, req);

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

      // Get total users
      const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(usersResult.rows[0].count);

      // Get active users (last 7 days)
      const activeUsersResult = await client.query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM activity_logs 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);
      const activeUsers = parseInt(activeUsersResult.rows[0].count);

      // Get total searches (both logged in and anonymous)
      const totalSearchesResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM activity_logs WHERE action = 'SEARCH') + 
          (SELECT COUNT(*) FROM anonymous_searches) as count
      `);
      const totalSearches = parseInt(totalSearchesResult.rows[0].count);

      // Get searches today
      const searchesTodayResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM activity_logs WHERE action = 'SEARCH' AND DATE(created_at) = CURRENT_DATE) + 
          (SELECT COUNT(*) FROM anonymous_searches WHERE DATE(created_at) = CURRENT_DATE) as count
      `);
      const searchesToday = parseInt(searchesTodayResult.rows[0].count);

      // Get popular searches (combining kentekens from both sources)
      const popularSearchesResult = await client.query(`
        WITH all_searches AS (
          SELECT search_query as kenteken FROM anonymous_searches 
          WHERE search_type = 'KENTEKEN' AND search_query IS NOT NULL
          UNION ALL
          SELECT details->>'searchQuery' as kenteken FROM activity_logs 
          WHERE action = 'SEARCH' AND details->>'searchQuery' IS NOT NULL
        )
        SELECT 
          UPPER(kenteken) as kenteken,
          COUNT(*) as count
        FROM all_searches
        WHERE kenteken != ''
        GROUP BY UPPER(kenteken)
        ORDER BY count DESC
        LIMIT 10
      `);
      const popularSearches = popularSearchesResult.rows;

      // Get recent users
      const recentUsersResult = await client.query(`
        SELECT email, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      const recentUsers = recentUsersResult.rows;

      // Get searches by day (last 7 days)
      const searchesByDayResult = await client.query(`
        WITH daily_counts AS (
          SELECT DATE(created_at) as date, COUNT(*) as count 
          FROM activity_logs 
          WHERE action = 'SEARCH' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          UNION ALL
          SELECT DATE(created_at) as date, COUNT(*) as count 
          FROM anonymous_searches 
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(created_at)
        )
        SELECT 
          date,
          SUM(count) as count
        FROM daily_counts
        GROUP BY date
        ORDER BY date DESC
      `);
      const searchesByDay = searchesByDayResult.rows;

      // Get saved vehicles count
      const savedVehiclesResult = await client.query('SELECT COUNT(*) as count FROM saved_vehicles');
      const savedVehicles = parseInt(savedVehiclesResult.rows[0].count);

      // Get database size
      const dbSizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      const databaseSize = dbSizeResult.rows[0].size;

      // Get detailed user activity
      const userActivityResult = await client.query(`
        SELECT 
          u.email,
          u.name,
          u.created_at,
          COUNT(CASE WHEN al.action = 'SEARCH' THEN 1 END) as search_count,
          COUNT(CASE WHEN al.action = 'LOGIN' THEN 1 END) as login_count,
          COUNT(al.id) as total_activities,
          MAX(al.created_at) as last_activity
        FROM users u
        LEFT JOIN activity_logs al ON u.id = al.user_id
        GROUP BY u.id, u.email, u.name, u.created_at
        ORDER BY search_count DESC, total_activities DESC
      `);
      const userActivity = userActivityResult.rows;

      return res.status(200).json({
        totalUsers,
        activeUsers,
        totalSearches,
        searchesToday,
        popularSearches,
        recentUsers,
        searchesByDay,
        savedVehicles,
        databaseSize,
        userActivity
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleAdminDebug(req: VercelRequest, res: VercelResponse) {
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
    
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Geen admin rechten' });
      }

      // Get all tables info
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Get activity logs details
      const activityLogsResult = await client.query(`
        SELECT 
          action,
          COUNT(*) as count,
          MIN(created_at) as first_log,
          MAX(created_at) as last_log
        FROM activity_logs 
        GROUP BY action
        ORDER BY count DESC
      `);

      // Get recent activity logs
      const recentLogsResult = await client.query(`
        SELECT 
          al.*,
          u.email,
          u.name
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);

      // Get users with activity counts
      const usersActivityResult = await client.query(`
        SELECT 
          u.email,
          u.name,
          u.role,
          u.created_at,
          COUNT(al.id) as total_activities,
          COUNT(CASE WHEN al.action = 'SEARCH' THEN 1 END) as search_count,
          COUNT(CASE WHEN al.action = 'LOGIN' THEN 1 END) as login_count
        FROM users u
        LEFT JOIN activity_logs al ON u.id = al.user_id
        GROUP BY u.id, u.email, u.name, u.role, u.created_at
        ORDER BY total_activities DESC
      `);

      return res.status(200).json({
        timestamp: new Date().toISOString(),
        database_tables: tablesResult.rows.map(r => r.table_name),
        activity_summary: activityLogsResult.rows,
        recent_logs: recentLogsResult.rows,
        users_with_activity: usersActivityResult.rows,
        token_info: {
          user_id: decoded.userId,
          user_email: decoded.email,
          user_role: decoded.role
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Debug query failed',
      details: error.message,
      stack: error.stack
    });
  }
}

async function handleLogSearch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const { searchQuery, searchFilters, resultCount } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Log search activity
    await logActivity(decoded.userId, 'SEARCH', {
      search_query: searchQuery,
      search_filters: searchFilters,
      result_count: resultCount || 0
    }, req);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

// Helper function to log user activity
async function logActivity(userId: string, action: string, details: any = {}, req: VercelRequest) {
  const client = await pool.connect();
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    
    await client.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  } finally {
    client.release();
  }
}

async function handleAdminLogs(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const { page = '1', limit = '50' } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Geen admin rechten' });
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get activity logs with user information
      const logsResult = await client.query(`
        SELECT 
          al.id,
          al.action,
          al.details,
          al.ip_address,
          al.user_agent,
          al.created_at,
          u.email,
          u.name,
          u.role
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit as string), offset]);

      // Get total count for pagination
      const countResult = await client.query('SELECT COUNT(*) as count FROM activity_logs');
      const totalCount = parseInt(countResult.rows[0].count);

      return res.status(200).json({
        logs: logsResult.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit as string))
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleSaveSearchResults(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const { kentekens, name, searchQuery, searchFilters } = req.body;

  if (!kentekens || !Array.isArray(kentekens) || !name) {
    return res.status(400).json({ error: 'Kentekens en naam zijn verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO saved_searches (user_id, search_query, search_filters, name, kentekens)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [decoded.userId, searchQuery || null, JSON.stringify(searchFilters || {}), name, JSON.stringify(kentekens)]
      );

      // Log activity
      await logActivity(decoded.userId, 'SAVE_SEARCH_RESULTS', {
        name,
        kenteken_count: kentekens.length,
        search_query: searchQuery
      }, req);

      return res.status(201).json({
        id: result.rows[0].id,
        name: result.rows[0].name,
        kentekens,
        kenteken_count: kentekens.length,
        created_at: result.rows[0].created_at
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleGetSavedSearches(req: VercelRequest, res: VercelResponse) {
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
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM saved_searches 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [decoded.userId]
      );

      // Parse kentekens from JSONB and add kenteken_count
      const searches = result.rows.map(search => ({
        ...search,
        kentekens: search.kentekens || [],
        kenteken_count: (search.kentekens || []).length
      }));

      return res.status(200).json(searches);
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleDeleteSavedSearch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const { searchId } = req.body;

  if (!searchId) {
    return res.status(400).json({ error: 'Search ID is verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM saved_searches 
         WHERE id = $1 AND user_id = $2
         RETURNING name`,
        [searchId, decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Opgeslagen zoekopdracht niet gevonden' });
      }

      // Log activity
      await logActivity(decoded.userId, 'DELETE_SAVED_SEARCH', {
        search_id: searchId,
        name: result.rows[0].name
      }, req);

      return res.status(200).json({ message: 'Opgeslagen zoekopdracht verwijderd' });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleSaveVehicle(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const { kenteken, vehicleData, notes } = req.body;

  if (!kenteken || !vehicleData) {
    return res.status(400).json({ error: 'Kenteken en voertuigdata zijn verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      // Check if vehicle is already saved
      const existing = await client.query(
        'SELECT id FROM saved_vehicles WHERE user_id = $1 AND kenteken = $2',
        [decoded.userId, kenteken]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Dit voertuig is al opgeslagen' });
      }

      const result = await client.query(
        `INSERT INTO saved_vehicles (user_id, kenteken, vehicle_data, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [decoded.userId, kenteken, JSON.stringify(vehicleData), notes]
      );

      // Log activity
      await logActivity(decoded.userId, 'SAVE_VEHICLE', {
        kenteken,
        notes: notes || null
      }, req);

      return res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleGetSavedVehicles(req: VercelRequest, res: VercelResponse) {
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
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM saved_vehicles 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [decoded.userId]
      );

      return res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleCleanupOldData(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const client = await pool.connect();
    try {
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return res.status(403).json({ error: 'Geen admin rechten' });
      }

      // Execute cleanup function
      await client.query('SELECT cleanup_old_saved_vehicles()');

      // Log activity
      await logActivity(decoded.userId, 'CLEANUP_OLD_DATA', {}, req);

      return res.status(200).json({ message: 'Oude data succesvol opgeschoond' });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(401).json({ error: 'Ongeldig token' });
  }
}

async function handleForceLogoutAll(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This endpoint simply returns success - the real "logout" happens on the client side
  // by clearing all stored tokens. This is just to confirm the JWT secret change.
  
  return res.status(200).json({ 
    success: true, 
    message: 'JWT secret has been updated. All old tokens are now invalid.',
    timestamp: new Date().toISOString(),
    jwtInfo: debugEnvironment()
  });
}

async function handleLogAnonymousSearch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery, searchType, searchFilters, resultCount, sessionId } = req.body;

  if (!searchQuery || !searchType) {
    return res.status(400).json({ error: 'Search query and type are required' });
  }

  const client = await pool.connect();
  
  try {
    // Get client IP and user agent
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await client.query(`
      INSERT INTO anonymous_searches (
        search_query, 
        search_type, 
        search_filters, 
        result_count, 
        ip_address, 
        user_agent, 
        session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      searchQuery,
      searchType,
      searchFilters ? JSON.stringify(searchFilters) : null,
      resultCount || 0,
      clientIp,
      userAgent,
      sessionId || null
    ]);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error logging anonymous search:', error);
    return res.status(500).json({ 
      error: 'Failed to log search',
      details: error.message 
    });
  } finally {
    client.release();
  }
}

 