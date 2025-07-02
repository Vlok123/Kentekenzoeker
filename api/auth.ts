import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

// Email configuration (will be used globally)
// Removed duplicate - using config from functions below

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
    console.log('🔍 Received action:', action);
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
      case 'test-sketches':
        console.log('🧪 Test sketches endpoint called');
        return res.status(200).json({ message: 'Test sketches endpoint works!', action });
      case 'test-db-connection':
        return await handleTestDbConnection(req, res);
      case 'force-logout-all':
        return await handleForceLogoutAll(req, res);
      case 'verify-email':
        return await handleVerifyEmail(req, res);
      case 'request-password-reset':
        return await handleRequestPasswordReset(req, res);
      case 'reset-password':
        return await handleResetPassword(req, res);
      case 'resend-email-verification':
        return await handleResendEmailVerification(req, res);
      case 'contact':
        return await handleContact(req, res);
      case 'test-email-config':
        return await handleTestEmailConfig(req, res);
      case 'promote-to-admin':
        return await handlePromoteToAdmin(req, res);
      case 'save-sketch':
        return await handleSaveSketch(req, res);
      case 'get-sketches':
        console.log('📂 Calling handleGetSketches');
        return await handleGetSketches(req, res);
      case 'get-sketch':
        return await handleGetSketch(req, res);
      case 'delete-sketch':
        return await handleDeleteSketch(req, res);
      case 'update-sketch':
        return await handleUpdateSketch(req, res);

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

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({ error: 'Email adres is nog niet geverifieerd. Controleer je inbox voor de verificatie email.' });
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

    // Generate email verification token
    const emailToken = generateToken();
    const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with email verification token
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name`,
      [email.toLowerCase(), hashedPassword, name || null, emailToken, emailExpires]
    );

    const user = result.rows[0];

    // Send verification email
    try {
      await sendEmailVerification(user.email, user.name || '', emailToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue registration even if email fails
    }

    // Log registration activity
    await logActivity(user.id, 'REGISTER', { email: user.email, name: user.name }, req);

    return res.status(201).json({ message: 'Account aangemaakt! Controleer je email voor de verificatie link.' });
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
          (SELECT COALESCE(COUNT(*), 0) FROM anonymous_searches) as count
      `);
      const totalSearches = parseInt(totalSearchesResult.rows[0].count);

      // Get searches today
      const searchesTodayResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM activity_logs WHERE action = 'SEARCH' AND DATE(created_at) = CURRENT_DATE) + 
          (SELECT COALESCE(COUNT(*), 0) FROM anonymous_searches WHERE DATE(created_at) = CURRENT_DATE) as count
      `);
      const searchesToday = parseInt(searchesTodayResult.rows[0].count);

      // Get anonymous statistics
      const anonymousStatsResult = await client.query(`
        SELECT 
          COUNT(*) as total_anonymous_searches,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT ip_address) as unique_ips,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_anonymous,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_anonymous
        FROM anonymous_searches
      `);
      const anonymousStats = anonymousStatsResult.rows[0] || {
        total_anonymous_searches: 0,
        unique_sessions: 0,
        unique_ips: 0,
        today_anonymous: 0,
        week_anonymous: 0
      };

      // Get kenteken-specific searches
      const kentekenSearchesResult = await client.query(`
        SELECT 
          COUNT(*) as total_kenteken_searches,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_kenteken,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_kenteken
        FROM anonymous_searches 
        WHERE search_type = 'KENTEKEN'
      `);
      const kentekenStats = kentekenSearchesResult.rows[0] || {
        total_kenteken_searches: 0,
        today_kenteken: 0,
        week_kenteken: 0
      };

      // Get popular searches (combining kentekens from both sources)
      const popularSearchesResult = await client.query(`
        WITH kenteken_searches AS (
          SELECT UPPER(TRIM(search_query)) as kenteken 
          FROM anonymous_searches 
          WHERE search_type = 'KENTEKEN' 
            AND search_query IS NOT NULL 
            AND TRIM(search_query) != ''
            AND LENGTH(TRIM(search_query)) >= 4
            AND TRIM(search_query) ~ '^[A-Z0-9-]+$'
          UNION ALL
          SELECT UPPER(TRIM(details->>'searchQuery')) as kenteken 
          FROM activity_logs 
          WHERE action = 'SEARCH' 
            AND details->>'searchQuery' IS NOT NULL 
            AND TRIM(details->>'searchQuery') != ''
            AND LENGTH(TRIM(details->>'searchQuery')) >= 4
            AND TRIM(details->>'searchQuery') ~ '^[A-Z0-9-]+$'
        )
        SELECT 
          kenteken,
          COUNT(*) as count
        FROM kenteken_searches
        WHERE kenteken IS NOT NULL AND kenteken != ''
        GROUP BY kenteken
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 10
      `);
      const popularSearches = popularSearchesResult.rows;

      // Get search type breakdown for anonymous users
      const searchTypeBreakdownResult = await client.query(`
        SELECT 
          search_type,
          COUNT(*) as count,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_count
        FROM anonymous_searches
        GROUP BY search_type
        ORDER BY count DESC
      `);
      const searchTypeBreakdown = searchTypeBreakdownResult.rows;

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
          COUNT(CASE WHEN al.action = 'SEARCH' THEN 1 END)::integer as search_count,
          COUNT(CASE WHEN al.action = 'LOGIN' THEN 1 END)::integer as login_count,
          COUNT(al.id)::integer as total_activities,
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
        userActivity,
        anonymousStats: {
          totalAnonymousSearches: parseInt(anonymousStats.total_anonymous_searches || 0),
          uniqueSessions: parseInt(anonymousStats.unique_sessions || 0),
          uniqueIps: parseInt(anonymousStats.unique_ips || 0),
          todayAnonymous: parseInt(anonymousStats.today_anonymous || 0),
          weekAnonymous: parseInt(anonymousStats.week_anonymous || 0)
        },
        kentekenStats: {
          totalKentekenSearches: parseInt(kentekenStats.total_kenteken_searches || 0),
          todayKenteken: parseInt(kentekenStats.today_kenteken || 0),
          weekKenteken: parseInt(kentekenStats.week_kenteken || 0)
        },
        searchTypeBreakdown
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Admin stats error:', error);
    
    // Check if it's a JWT error
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Ongeldig token' });
    }
    
    // Database or other errors
    return res.status(500).json({ 
      error: 'Kon statistieken niet laden', 
      details: error.message,
      type: error.name
    });
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

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // false for STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // STARTTLS configuratie voor Namecheap
  requireTLS: true,
  // Extra opties voor Namecheap Private Email
  tls: {
    rejectUnauthorized: false
  },
  // Extra debug opties voor Namecheap
  debug: true,
  logger: true
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@carintel.nl';
const APP_URL = process.env.APP_URL || 'https://carintel.nl';

// Generate secure token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Send email verification
async function sendEmailVerification(email: string, name: string, token: string): Promise<void> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .logo { color: #3b82f6; font-size: 24px; font-weight: bold; }
        .content { padding: 30px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CarIntel</div>
        </div>
        
        <div class="content">
          <h2>Welkom bij CarIntel${name ? `, ${name}` : ''}!</h2>
          
          <p>Bedankt voor het aanmaken van je account. Om je account te activeren, klik je op de onderstaande knop:</p>
          
          <a href="${verificationUrl}" class="button">Email bevestigen</a>
          
          <p>Je kunt ook deze link in je browser kopiëren:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-wrap: break-word;">${verificationUrl}</p>
          
          <p><strong>Deze link is 24 uur geldig.</strong></p>
          
          <p>Als je dit account niet hebt aangemaakt, kun je deze email negeren.</p>
        </div>
        
        <div class="footer">
          <p>© 2024 CarIntel - Je betrouwbare auto-informatie platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: 'Bevestig je CarIntel account',
    html: htmlContent
  });
}

// Send password reset email
async function sendPasswordReset(email: string, name: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .logo { color: #3b82f6; font-size: 24px; font-weight: bold; }
        .content { padding: 30px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">CarIntel</div>
        </div>
        
        <div class="content">
          <h2>Wachtwoord resetten${name ? ` voor ${name}` : ''}</h2>
          
          <p>Je hebt een verzoek ingediend om je wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen:</p>
          
          <a href="${resetUrl}" class="button">Nieuw wachtwoord instellen</a>
          
          <p>Je kunt ook deze link in je browser kopiëren:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-wrap: break-word;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Belangrijk:</strong>
            <ul>
              <li>Deze link is slechts 1 uur geldig</li>
              <li>De link kan maar één keer gebruikt worden</li>
              <li>Als je dit verzoek niet hebt ingediend, negeer dan deze email</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 CarIntel - Je betrouwbare auto-informatie platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: 'Wachtwoord resetten - CarIntel',
    html: htmlContent
  });
}

// Handle email verification
async function handleVerifyEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is verplicht' });
  }

  const client = await pool.connect();
  
  try {
    // Find user by verification token
    const result = await client.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Ongeldige of verlopen verificatie link' });
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

    // Log activity
    await logActivity(user.id, 'EMAIL_VERIFIED', { email: user.email }, req);

    return res.status(200).json({ message: 'Email succesvol geverifieerd! Je kunt nu inloggen.' });
  } finally {
    client.release();
  }
}

// Handle password reset request
async function handleRequestPasswordReset(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is verplicht' });
  }

  const client = await pool.connect();
  
  try {
    // Find user by email
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: 'Als dit email adres bestaat, is er een wachtwoord reset link verstuurd.' });
    }

    const user = result.rows[0];

    // Generate password reset token
    const resetToken = generateToken();
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
      await sendPasswordReset(user.email, user.name || '', resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails
    }

    // Log activity
    await logActivity(user.id, 'PASSWORD_RESET_REQUESTED', { email: user.email }, req);

    return res.status(200).json({ message: 'Als dit email adres bestaat, is er een wachtwoord reset link verstuurd.' });
  } finally {
    client.release();
  }
}

// Handle password reset
async function handleResetPassword(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token en nieuw wachtwoord zijn verplicht' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Wachtwoord moet minimaal 6 karakters lang zijn' });
  }

  const client = await pool.connect();
  
  try {
    // Find user by reset token
    const result = await client.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Ongeldige of verlopen wachtwoord reset link' });
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

    // Log activity
    await logActivity(user.id, 'PASSWORD_RESET_COMPLETED', { email: user.email }, req);

    return res.status(200).json({ message: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen met je nieuwe wachtwoord.' });
  } finally {
    client.release();
  }
}

// Handle resend email verification
async function handleResendEmailVerification(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is verplicht' });
  }

  const client = await pool.connect();
  
  try {
    // Find user by email
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email adres is al geverifieerd' });
    }

    // Generate new verification token
    const emailToken = generateToken();
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
      await sendEmailVerification(user.email, user.name || '', emailToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ error: 'Kon verificatie email niet versturen. Probeer het later opnieuw.' });
    }

    // Log activity
    await logActivity(user.id, 'EMAIL_VERIFICATION_RESENT', { email: user.email }, req);

    return res.status(200).json({ message: 'Nieuwe verificatie email verstuurd! Controleer je inbox.' });
  } finally {
    client.release();
  }
}

// Handle contact form
async function handleContact(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  // Validatie
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }

  // Email validatie
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Ongeldig email adres' });
  }

  try {
    // Debug email configuratie
    const fromEmail = process.env.FROM_EMAIL || 'noreply@carintel.nl';
    console.log('Contact form email debug:', {
      hasSmtpHost: !!process.env.SMTP_HOST,
      smtpHost: process.env.SMTP_HOST || 'mail.privateemail.com',
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : 'not set',
      smtpPort: process.env.SMTP_PORT || '587',
      fromEmail: fromEmail,
      nodeEnv: process.env.NODE_ENV
    });

    // Gebruik dezelfde email configuratie als andere functies
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // false for STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // STARTTLS configuratie voor Namecheap
      requireTLS: true,
      // Extra opties voor Namecheap Private Email
      tls: {
        rejectUnauthorized: false
      },
      // Extra debug opties voor Namecheap
      debug: true,
      logger: true
    });

    // Test de verbinding
    try {
      console.log('🔄 Testing email server connection...');
      await transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (verifyError) {
      console.error('❌ Email server verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response
      });
      throw new Error('Email server niet beschikbaar: ' + verifyError.message);
    }

    // Email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #374151; }
          .value { background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #3b82f6; }
          .message-box { background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚗 Nieuw Contact Bericht - CarIntel</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Van:</div>
              <div class="value">${name} (${email})</div>
            </div>
            
            <div class="field">
              <div class="label">Onderwerp:</div>
              <div class="value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="label">Bericht:</div>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>💡 Tip:</strong> Antwoord direct op deze email om contact op te nemen met de verzender.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email naar CarIntel sturen
    await transporter.sendMail({
      from: `"CarIntel Contact" <${process.env.SMTP_USER}>`,
      to: 'info@carintel.nl',
      replyTo: email,
      subject: `[CarIntel Contact] ${subject}`,
      html: htmlContent,
      text: `
Nieuw contact bericht van CarIntel website

Van: ${name} (${email})
Onderwerp: ${subject}

Bericht:
${message}

---
Dit bericht is verzonden via het contactformulier op de CarIntel website.
      `
    });

    // Bevestigings email naar verzender
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
                     <div class="header">
             <div class="success-icon">✅</div>
             <h2>Email Test Geslaagd!</h2>
           </div>
          <div class="content">
            <p>Beste ${name},</p>
            
            <p>Bedankt voor je bericht! We hebben je contactformulier succesvol ontvangen.</p>
            
                         <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
               <strong>📧 Email configuratie test:</strong><br>
               <strong>Test uitgevoerd op:</strong> ${new Date().toLocaleString('nl-NL')}
             </div>
            
            <p>Ons team bekijkt je bericht en we nemen binnen 24 uur contact met je op tijdens werkdagen.</p>
            
            <p>In de tussentijd kun je:</p>
            <ul>
              <li>🔍 Kentekens opzoeken op onze website</li>
              <li>📊 Trekgewicht controleren</li>
              <li>📱 Je favoriete voertuigen opslaan</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://carintel.nl" class="button">Terug naar CarIntel</a>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <strong>💡 Nog vragen?</strong><br>
              Aarzel niet om nogmaals contact op te nemen als je meer hulp nodig hebt.
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Met vriendelijke groet,<br>
              Het CarIntel Team<br>
              📧 info@carintel.nl
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"CarIntel" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Bedankt voor je bericht - CarIntel',
      html: confirmationHtml,
      text: `
Beste ${name},

Bedankt voor je bericht! We hebben je contactformulier succesvol ontvangen.

Je bericht details:
- Onderwerp: ${subject}
- Verzonden op: ${new Date().toLocaleString('nl-NL')}

Ons team bekijkt je bericht en we nemen binnen 24 uur contact met je op tijdens werkdagen.

Met vriendelijke groet,
Het CarIntel Team
info@carintel.nl
      `
    });

    return res.status(200).json({ success: true, message: 'Bericht succesvol verzonden' });

  } catch (error) {
    console.error('Contact form error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    
    // Geef meer specifieke error informatie
    let errorMessage = 'Er ging iets mis bij het versturen van je bericht';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authenticatie mislukt. Controleer email instellingen.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Kan geen verbinding maken met email server.';
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage = 'Email login credentials zijn niet geldig.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Handle test email configuration
async function handleTestEmailConfig(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is verplicht' });
  }

  try {
    // Debug email configuratie
    const fromEmail = process.env.FROM_EMAIL || 'noreply@carintel.nl';
    console.log('Contact form email debug:', {
      hasSmtpHost: !!process.env.SMTP_HOST,
      smtpHost: process.env.SMTP_HOST || 'mail.privateemail.com',
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : 'not set',
      smtpPort: process.env.SMTP_PORT || '587',
      fromEmail: fromEmail,
      nodeEnv: process.env.NODE_ENV
    });

    // Gebruik dezelfde email configuratie als andere functies
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // false for STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // STARTTLS configuratie voor Namecheap
      requireTLS: true,
      // Extra opties voor Namecheap Private Email
      tls: {
        rejectUnauthorized: false
      },
      // Extra debug opties voor Namecheap
      debug: true,
      logger: true
    });

    // Test de verbinding
    try {
      console.log('🔄 Testing email server connection...');
      await transporter.verify();
      console.log('✅ Email server connection verified');
    } catch (verifyError) {
      console.error('❌ Email server verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response
      });
      throw new Error('Email server niet beschikbaar: ' + verifyError.message);
    }

    // Bevestigings email naar verzender
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h2>Email Test Geslaagd!</h2>
          </div>
          <div class="content">
            <p>Beste gebruiker,</p>
             
            <p>De email configuratie test is succesvol uitgevoerd!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <strong>📧 Email configuratie test:</strong><br>
              <strong>Test uitgevoerd op:</strong> ${new Date().toLocaleString('nl-NL')}
            </div>
            
            <p>De email configuratie werkt correct en is klaar voor gebruik.</p>
            
            <p>In de tussentijd kun je:</p>
            <ul>
              <li>🔍 Kentekens opzoeken op onze website</li>
              <li>📊 Trekgewicht controleren</li>
              <li>📱 Je favoriete voertuigen opslaan</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://carintel.nl" class="button">Terug naar CarIntel</a>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <strong>💡 Nog vragen?</strong><br>
              Aarzel niet om nogmaals contact op te nemen als je meer hulp nodig hebt.
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Met vriendelijke groet,<br>
              Het CarIntel Team<br>
              📧 info@carintel.nl
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

         await transporter.sendMail({
       from: `"CarIntel" <${process.env.SMTP_USER}>`,
       to: email,
       subject: 'Email Test - CarIntel',
       html: confirmationHtml,
       text: `
 Beste gebruiker,
 
  De email configuratie test is succesvol uitgevoerd!
 
 Test details:
 - Test uitgevoerd op: ${new Date().toLocaleString('nl-NL')}
 - Email server: Namecheap Private Email
 
 De email configuratie werkt correct en is klaar voor gebruik.
 
 Met vriendelijke groet,
 Het CarIntel Team
 info@carintel.nl
      `
    });

    return res.status(200).json({ success: true, message: 'Bericht succesvol verzonden' });

  } catch (error) {
    console.error('Contact form error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    
    // Geef meer specifieke error informatie
    let errorMessage = 'Er ging iets mis bij het versturen van je bericht';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authenticatie mislukt. Controleer email instellingen.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Kan geen verbinding maken met email server.';
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage = 'Email login credentials zijn niet geldig.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Handle promote to admin
async function handlePromoteToAdmin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is verplicht' });
  }

  const client = await pool.connect();
  
  try {
    // Find user by ID
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    const user = userResult.rows[0];

    // Update user role to admin
    await client.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['admin', userId]
    );

    // Log activity
    await logActivity(userId, 'PROMOTED_TO_ADMIN', {}, req);

    return res.status(200).json({ message: 'Gebruiker succesvol gepromoveerd tot admin' });
  } finally {
    client.release();
  }
}

// Save traffic sketch
async function handleSaveSketch(req: VercelRequest, res: VercelResponse) {
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
    const { title, description, location, incidents, drawnLines, metadata, isPublic } = req.body;

    if (!title || !incidents) {
      return res.status(400).json({ error: 'Titel en incidents zijn verplicht' });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO verkeersschetsen (user_id, title, description, location, incidents, drawn_lines, metadata, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title, description, location, created_at
      `, [
        decoded.userId,
        title,
        description || null,
        location || null,
        JSON.stringify(incidents),
        JSON.stringify(drawnLines || []),
        JSON.stringify(metadata || {}),
        isPublic || false
      ]);

      const sketch = result.rows[0];
      
      // Log the save activity
      await logActivity(decoded.userId, 'SAVE_SKETCH', { 
        sketchId: sketch.id,
        title: title 
      }, req);

      return res.status(200).json({ 
        message: 'Verkeersschets succesvol opgeslagen',
        sketch
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Save sketch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ongeldige token' });
    }
    return res.status(500).json({ error: 'Server error bij opslaan verkeersschets' });
  }
}

// Get user's sketches
async function handleGetSketches(req: VercelRequest, res: VercelResponse) {
  console.log('📂 handleGetSketches called');
  
  if (req.method !== 'GET') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid auth header');
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  console.log('🎫 Token extracted');
  
  try {
    console.log('🔐 Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('✅ Token verified for user:', decoded.userId);

    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('📊 Querying verkeersschetsen...');
      
      // First check if table exists
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'verkeersschetsen'
        );
      `);
      
      console.log('📋 Table exists:', tableCheck.rows[0].exists);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ Table does not exist, creating...');
        await client.query(`
          CREATE TABLE verkeersschetsen (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
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
        console.log('✅ Table created');
      }

      const result = await client.query(`
        SELECT id, title, description, location, created_at, updated_at, is_public
        FROM verkeersschetsen 
        WHERE user_id = $1 
        ORDER BY updated_at DESC
      `, [decoded.userId]);

      console.log('📊 Query result:', result.rows.length, 'sketches found');
      return res.status(200).json({ sketches: result.rows });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Get sketches error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ongeldige token' });
    }
    return res.status(500).json({ error: 'Server error bij ophalen verkeersschetsen', details: error.message });
  }
}

// Get specific sketch
async function handleGetSketch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const sketchId = req.query.id as string;
  
  if (!sketchId) {
    return res.status(400).json({ error: 'Sketch ID is verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM verkeersschetsen 
        WHERE id = $1 AND (user_id = $2 OR is_public = TRUE)
      `, [sketchId, decoded.userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Verkeersschets niet gevonden' });
      }

      return res.status(200).json({ sketch: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Get sketch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ongeldige token' });
    }
    return res.status(500).json({ error: 'Server error bij ophalen verkeersschets' });
  }
}

// Update sketch
async function handleUpdateSketch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { id, title, description, location, incidents, drawnLines, metadata, isPublic } = req.body;

    if (!id || !title || !incidents) {
      return res.status(400).json({ error: 'ID, titel en incidents zijn verplicht' });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE verkeersschetsen 
        SET title = $1, description = $2, location = $3, incidents = $4, 
            drawn_lines = $5, metadata = $6, is_public = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 AND user_id = $9
        RETURNING id, title, description, location, updated_at
      `, [
        title,
        description || null,
        location || null,
        JSON.stringify(incidents),
        JSON.stringify(drawnLines || []),
        JSON.stringify(metadata || {}),
        isPublic || false,
        id,
        decoded.userId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Verkeersschets niet gevonden of geen toegang' });
      }

      const sketch = result.rows[0];
      
      // Log the update activity
      await logActivity(decoded.userId, 'UPDATE_SKETCH', { 
        sketchId: id,
        title: title 
      }, req);

      return res.status(200).json({ 
        message: 'Verkeersschets succesvol bijgewerkt',
        sketch
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update sketch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ongeldige token' });
    }
    return res.status(500).json({ error: 'Server error bij bijwerken verkeersschets' });
  }
}

// Delete sketch
async function handleDeleteSketch(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Geen autorisatie token' });
  }

  const token = authHeader.substring(7);
  const sketchId = req.query.id as string;
  
  if (!sketchId) {
    return res.status(400).json({ error: 'Sketch ID is verplicht' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        DELETE FROM verkeersschetsen 
        WHERE id = $1 AND user_id = $2
        RETURNING title
      `, [sketchId, decoded.userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Verkeersschets niet gevonden of geen toegang' });
      }

      // Log the delete activity
      await logActivity(decoded.userId, 'DELETE_SKETCH', { 
        sketchId: sketchId,
        title: result.rows[0].title 
      }, req);

      return res.status(200).json({ message: 'Verkeersschets succesvol verwijderd' });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Delete sketch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Ongeldige token' });
    }
    return res.status(500).json({ error: 'Server error bij verwijderen verkeersschets' });
  }
}

async function handleTestDbConnection(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    try {
      // Test basic connection
      await client.query('SELECT 1 as test');
      
      // Check which tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      // Check users table specifically
      let usersInfo: { exists: boolean; count?: number } = { exists: false };
      try {
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
        usersInfo = { exists: true, count: parseInt(usersResult.rows[0].count) };
      } catch {
        usersInfo = { exists: false };
      }
      
      return res.status(200).json({ 
        message: 'Database connection successful',
        tables: tablesResult.rows.map(r => r.table_name),
        usersTable: usersInfo
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to database',
      details: error.message 
    });
  }
}