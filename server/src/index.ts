import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import config from './config/index.js';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFound, generalLimiter } from './middleware/index.js';
import { logger } from './utils/logger.js';

const app = express();
app.set('trust proxy', 1); // Enable if behind reverse proxy (Heroku, Nginx, etc)
const httpServer = createServer(app);

// ─── Allowed Origins ──────────────────────────────────────────────────────────
// Always allow the configured FRONTEND_URL, localhost dev, and Vercel previews
const allowedOrigins: (string | RegExp)[] = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  /\.vercel\.app$/,
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('public/uploads'));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    message: 'BizHub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbState[mongoose.connection.readyState] ?? 'unknown',
  });
});

// ─── Vercel: lazy DB connection per request ───────────────────────────────────
if (process.env.VERCEL) {
  app.use(async (_req, _res, next) => {
    if (mongoose.connection.readyState >= 1) return next();
    try {
      await connectDB();
      next();
    } catch (err) {
      logger.error('Vercel DB connection middleware failed:', err);
      next(err);
    }
  });
}

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-business', (businessId: string) => {
    socket.join(`business-${businessId}`);
    socket.join(`business:${businessId}`); // alias used by chat
    logger.info(`Socket ${socket.id} joined business ${businessId}`);
  });

  socket.on('join-branch', (branchId: string) => {
    socket.join(`branch-${branchId}`);
    logger.info(`Socket ${socket.id} joined branch ${branchId}`);
  });

  // Chat: send message via socket directly
  socket.on('chat:send', async (data: { businessId: string; senderId: string; receiverId?: string; message: string; isGlobal?: boolean }) => {
    try {
      const { ChatMessage } = await import('./models/ChatMessage.js');
      const msg = await ChatMessage.create({
        businessId: data.businessId,
        senderId: data.senderId,
        receiverId: data.receiverId || undefined,
        isGlobal: data.isGlobal || false,
        message: data.message,
        type: data.isGlobal ? 'notice' : 'text',
      });
      await msg.populate('senderId', 'email profile role');
      io.to(`business:${data.businessId}`).emit('chat:message', msg);
    } catch (err) {
      logger.error('Socket chat:send error:', err);
    }
  });

  // Chat: typing indicator
  socket.on('chat:typing', (data: { businessId: string; senderId: string; receiverId: string; isTyping: boolean }) => {
    socket.to(`business:${data.businessId}`).emit('chat:typing', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Make io available to controllers via req.app.get('io')
app.set('io', io);

export { io };

// ─── Non-Vercel: start server normally ────────────────────────────────────────
if (!process.env.VERCEL) {
  const startServer = async (): Promise<void> => {
    try {
      await connectDB();
      logger.info('Database connection established');
    } catch (error) {
      logger.error(
        'MongoDB connection failed on startup. API requests requiring DB will fail. Check MONGODB_URI in .env',
        error
      );
    }

    httpServer.listen(config.port, () => {
      logger.info(`✅ Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`📡 API: http://localhost:${config.port}/api/v1`);
      logger.info(`🔍 Health: http://localhost:${config.port}/api/health`);
    });
  };

  startServer();
}

// ─── Global crash guards ──────────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL — Uncaught Exception (server kept alive):', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL — Unhandled Promise Rejection (server kept alive):', reason);
});

export default app;