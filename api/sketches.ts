import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_p1IJPygusA8w@ep-patient-mouse-a9tzeizd-pooler.gwc.azure.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'ea1783e31511a6c2e9e85efce8f5bf6c93de2f84d68bb31f67f442906e68b7af06bbba37b6b2b0c05fdb4b15476c8f7dd3c2f4d5e0e07e0ebdcecb7f3d1c7c42b';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🎨 Sketches API called:', req.method, req.url);

  try {
    const action = req.query.action as string;
    console.log('🎯 Action:', action);

    // Check authentication for all actions
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Geen autorisatie token' });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
      console.log('✅ User authenticated:', userId);
    } catch (error) {
      return res.status(401).json({ error: 'Ongeldige token' });
    }

    const client = await pool.connect();
    
    try {
      // Ensure table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS verkeersschetsen (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
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

      switch (action) {
        case 'list':
          return await handleList(client, res, userId);
        case 'get':
          return await handleGet(client, req, res, userId);
        case 'save':
          return await handleSave(client, req, res, userId);
        case 'update':
          return await handleUpdate(client, req, res, userId);
        case 'delete':
          return await handleDelete(client, req, res, userId);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Sketches API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}

async function handleList(client: any, res: VercelResponse, userId: string) {
  console.log('📋 Listing sketches for user:', userId);
  
  const result = await client.query(`
    SELECT id, title, description, location, created_at, updated_at, is_public
    FROM verkeersschetsen 
    WHERE user_id = $1 
    ORDER BY updated_at DESC
  `, [userId]);

  console.log('📊 Found', result.rows.length, 'sketches');
  return res.status(200).json({ sketches: result.rows });
}

async function handleGet(client: any, req: VercelRequest, res: VercelResponse, userId: string) {
  const sketchId = req.query.id as string;
  
  if (!sketchId) {
    return res.status(400).json({ error: 'Sketch ID is required' });
  }

  const result = await client.query(`
    SELECT * FROM verkeersschetsen 
    WHERE id = $1 AND user_id = $2
  `, [sketchId, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Sketch not found' });
  }

  return res.status(200).json({ sketch: result.rows[0] });
}

async function handleSave(client: any, req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, description, location, incidents, drawnLines, metadata, isPublic } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const result = await client.query(`
    INSERT INTO verkeersschetsen (user_id, title, description, location, incidents, drawn_lines, metadata, is_public)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, created_at
  `, [
    userId,
    title,
    description || null,
    location || null,
    JSON.stringify(incidents || []),
    JSON.stringify(drawnLines || []),
    JSON.stringify(metadata || {}),
    isPublic || false
  ]);

  return res.status(201).json({ 
    message: 'Sketch saved successfully',
    sketch: result.rows[0]
  });
}

async function handleUpdate(client: any, req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sketchId = req.query.id as string;
  const { title, description, location, incidents, drawnLines, metadata, isPublic } = req.body;

  if (!sketchId) {
    return res.status(400).json({ error: 'Sketch ID is required' });
  }

  const result = await client.query(`
    UPDATE verkeersschetsen 
    SET title = $1, description = $2, location = $3, incidents = $4, 
        drawn_lines = $5, metadata = $6, is_public = $7, updated_at = CURRENT_TIMESTAMP
    WHERE id = $8 AND user_id = $9
    RETURNING id, updated_at
  `, [
    title,
    description || null,
    location || null,
    JSON.stringify(incidents || []),
    JSON.stringify(drawnLines || []),
    JSON.stringify(metadata || {}),
    isPublic || false,
    sketchId,
    userId
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Sketch not found or not authorized' });
  }

  return res.status(200).json({ 
    message: 'Sketch updated successfully',
    sketch: result.rows[0]
  });
}

async function handleDelete(client: any, req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sketchId = req.query.id as string;

  if (!sketchId) {
    return res.status(400).json({ error: 'Sketch ID is required' });
  }

  const result = await client.query(`
    DELETE FROM verkeersschetsen 
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `, [sketchId, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Sketch not found or not authorized' });
  }

  return res.status(200).json({ message: 'Sketch deleted successfully' });
} 