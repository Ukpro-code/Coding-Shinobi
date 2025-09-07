import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Routes
app.get('/make-server-3d59ded4/health', async (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all nodes (ideas) for a user
app.get('/make-server-3d59ded4/nodes', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const nodes = await kv.getByPrefix(`user:${userId}:node:`);
    return c.json({ nodes });
  } catch (error) {
    console.log('Error fetching nodes:', error);
    return c.json({ error: 'Failed to fetch nodes' }, 500);
  }
});

// Create or update a node
app.post('/make-server-3d59ded4/nodes', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const nodeData = await c.req.json();
    const nodeId = nodeData.id || crypto.randomUUID();
    
    const node = {
      id: nodeId,
      title: nodeData.title,
      x: nodeData.x,
      y: nodeData.y,
      size: nodeData.size || 60,
      color: nodeData.color || 'bg-blue-500',
      interactionCount: nodeData.interactionCount || 0,
      lastInteraction: new Date().toISOString(),
      connections: nodeData.connections || [],
      sources: nodeData.sources || [],
      createdAt: new Date().toISOString(),
      userId
    };

    await kv.set(`user:${userId}:node:${nodeId}`, node);
    return c.json({ node });
  } catch (error) {
    console.log('Error creating/updating node:', error);
    return c.json({ error: 'Failed to save node' }, 500);
  }
});

// Get connections for a user
app.get('/make-server-3d59ded4/connections', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const connections = await kv.getByPrefix(`user:${userId}:connection:`);
    return c.json({ connections });
  } catch (error) {
    console.log('Error fetching connections:', error);
    return c.json({ error: 'Failed to fetch connections' }, 500);
  }
});

// Create or update a connection
app.post('/make-server-3d59ded4/connections', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const connectionData = await c.req.json();
    const connectionId = connectionData.id || `${connectionData.from}-${connectionData.to}`;
    
    const connection = {
      id: connectionId,
      from: connectionData.from,
      to: connectionData.to,
      strength: connectionData.strength || 0.1,
      lastReinforced: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId
    };

    await kv.set(`user:${userId}:connection:${connectionId}`, connection);
    return c.json({ connection });
  } catch (error) {
    console.log('Error creating/updating connection:', error);
    return c.json({ error: 'Failed to save connection' }, 500);
  }
});

// Process uploaded content (PDF, YouTube, etc.) - placeholder for AI processing
app.post('/make-server-3d59ded4/process-content', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { type, url, title } = await c.req.json();
    
    // Placeholder for AI content processing
    // In a real implementation, this would:
    // 1. Extract text from PDF/YouTube/etc.
    // 2. Use AI to identify key concepts
    // 3. Create nodes and connections automatically
    
    const processedContent = {
      id: crypto.randomUUID(),
      title,
      type,
      url,
      extractedConcepts: [
        'Example Concept 1',
        'Example Concept 2',
        'Example Concept 3'
      ],
      processedAt: new Date().toISOString(),
      userId
    };

    await kv.set(`user:${userId}:content:${processedContent.id}`, processedContent);
    return c.json({ content: processedContent });
  } catch (error) {
    console.log('Error processing content:', error);
    return c.json({ error: 'Failed to process content' }, 500);
  }
});

// Get learning analytics
app.get('/make-server-3d59ded4/analytics', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user: { id: userId } }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const nodes = await kv.getByPrefix(`user:${userId}:node:`);
    const connections = await kv.getByPrefix(`user:${userId}:connection:`);
    
    const analytics = {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      totalInteractions: nodes.reduce((sum: number, node: any) => sum + (node.interactionCount || 0), 0),
      strongConnections: connections.filter((conn: any) => conn.strength > 0.7).length,
      recentActivity: nodes
        .filter((node: any) => new Date(node.lastInteraction) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .length
    };

    return c.json({ analytics });
  } catch (error) {
    console.log('Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// User registration
app.post('/make-server-3d59ded4/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Error during signup:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Initialize storage bucket on startup
const initializeStorage = async () => {
  try {
    const bucketName = 'make-3d59ded4-content';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName);
      console.log(`Created storage bucket: ${bucketName}`);
    }
  } catch (error) {
    console.log('Error initializing storage:', error);
  }
};

initializeStorage();

serve(app.fetch);