import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const logger = pino.default({
  name: 'jules-control-room',
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  
  logger.info({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  }, 'Incoming request');
  
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Auth middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn({ requestId: req.requestId }, 'Missing authentication token');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = typeof user === 'string' ? { userId: user } : user as { userId: string; isAdmin?: boolean; [key: string]: unknown };
    next();
  } catch (err) {
    logger.warn({ requestId: req.requestId, error: err }, 'Invalid token');
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Session storage (in-memory for demo - use Redis/DB in production)
interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  data: Record<string, any>;
}

const sessions = new Map<string, Session>();

// Health check endpoints
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (_req, res) => {
  // Check if server is ready (database connections, etc.)
  const isReady = true; // Add actual readiness checks
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// API Routes

// POST /api/sessions - Create a new session
app.post('/api/sessions', authenticateToken, (req, res) => {
  const sessionId = uuidv4();
  const session: Session = {
    id: sessionId,
    userId: (req.user as any).userId || 'anonymous',
    createdAt: new Date(),
    lastActivity: new Date(),
    data: req.body.data || {},
  };
  
  sessions.set(sessionId, session);
  
  logger.info({
    requestId: req.requestId,
    sessionId,
    userId: session.userId,
  }, 'Session created');
  
  res.status(201).json({
    sessionId,
    createdAt: session.createdAt,
  });
});

// GET /api/sessions - List all sessions
app.get('/api/sessions', authenticateToken, (req, res) => {
  const userId = (req.user as any).userId;
  const userSessions = Array.from(sessions.values())
    .filter(s => s.userId === userId || (req.user as any).isAdmin)
    .map(s => ({
      id: s.id,
      userId: s.userId,
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
    }));
  
  logger.info({
    requestId: req.requestId,
    count: userSessions.length,
  }, 'Sessions listed');
  
  res.json({ sessions: userSessions });
});

// GET /api/sessions/:id - Get a specific session
app.get('/api/sessions/:id', authenticateToken, (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  const userId = (req.user as any).userId;
  if (session.userId !== userId && !(req.user as any).isAdmin) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  
  logger.info({
    requestId: req.requestId,
    sessionId: session.id,
  }, 'Session retrieved');
  
  res.json(session);
});

// PUT /api/sessions/:id - Update a session
app.put('/api/sessions/:id', authenticateToken, (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  const userId = (req.user as any).userId;
  if (session.userId !== userId && !(req.user as any).isAdmin) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  
  session.data = { ...session.data, ...req.body.data };
  session.lastActivity = new Date();
  
  logger.info({
    requestId: req.requestId,
    sessionId: session.id,
  }, 'Session updated');
  
  // Broadcast diff to WebSocket clients
  broadcastSessionDiff(session.id, req.body.data);
  
  res.json(session);
});

// DELETE /api/sessions/:id - Delete a session
app.delete('/api/sessions/:id', authenticateToken, (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  
  const userId = (req.user as any).userId;
  if (session.userId !== userId && !(req.user as any).isAdmin) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  
  sessions.delete(req.params.id);
  
  logger.info({
    requestId: req.requestId,
    sessionId: session.id,
  }, 'Session deleted');
  
  res.status(204).send();
});

// WebSocket connection handling
interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
  sessionId?: string;
  userId?: string;
}

const wsClients = new Set<WebSocketClient>();

server.on('upgrade', (request, socket, head) => {
  const token = new URL(request.url || '', `http://${request.headers.host}`).searchParams.get('token');
  
  if (!token) {
    logger.warn('WebSocket connection rejected: no token');
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as WebSocketClient).userId = (user as any).userId;
      wss.emit('connection', ws, request, user);
    });
  } catch (err) {
    logger.warn({ error: err }, 'WebSocket connection rejected: invalid token');
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocketClient) => {
  ws.isAlive = true;
  wsClients.add(ws);
  
  logger.info({
    userId: ws.userId,
    clientCount: wsClients.size,
  }, 'WebSocket client connected');

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      logger.debug({
        userId: ws.userId,
        type: message.type,
      }, 'WebSocket message received');

      // Handle different message types
      if (message.type === 'subscribe' && message.sessionId) {
        ws.sessionId = message.sessionId;
        ws.send(JSON.stringify({
          type: 'subscribed',
          sessionId: message.sessionId,
        }));
      }
    } catch (err) {
      logger.error({ error: err }, 'Error processing WebSocket message');
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    logger.info({
      userId: ws.userId,
      clientCount: wsClients.size,
    }, 'WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    logger.error({ error: err, userId: ws.userId }, 'WebSocket error');
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Jules Control Room',
  }));
});

// WebSocket heartbeat mechanism
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: WebSocketClient) => {
    if (ws.isAlive === false) {
      logger.warn({ userId: ws.userId }, 'Terminating inactive WebSocket client');
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Broadcast session diff to subscribed clients
function broadcastSessionDiff(sessionId: string, diff: Record<string, any>) {
  const message = JSON.stringify({
    type: 'session-update',
    sessionId,
    diff,
    timestamp: new Date().toISOString(),
  });

  let broadcastCount = 0;
  wsClients.forEach((client) => {
    if (client.sessionId === sessionId && client.readyState === WebSocket.OPEN) {
      client.send(message);
      broadcastCount++;
    }
  });

  logger.debug({
    sessionId,
    clientCount: broadcastCount,
  }, 'Session diff broadcasted');
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  }, 'Unhandled error');
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  logger.info({ port: PORT }, 'Jules Control Room server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Type augmentation for Express
declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    user?: {
      userId: string;
      isAdmin?: boolean;
      [key: string]: unknown;
    };
  }
}

export { app, server };
