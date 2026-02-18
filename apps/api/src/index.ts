/**
 * BrainBolt API Server
 * 
 * Main entry point for the BrainBolt REST API.
 * Provides quiz, leaderboard, and authentication endpoints.
 * 
 * Routes:
 * - POST /v1/auth/login - User login
 * - GET /v1/quiz/next - Get next question
 * - POST /v1/quiz/answer - Submit answer
 * - GET /v1/quiz/metrics - Get user metrics
 * - GET /v1/quiz/state - Get current user state
 * - GET /v1/leaderboard/score - Get score leaderboard
 * - GET /v1/leaderboard/streak - Get streak leaderboard
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { postgresPool, redisClient, testConnections } from './config';
import { setIo } from './services/redis';

// Routes
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import leaderboardRoutes from './routes/leaderboard';

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.API_PORT || '3001');
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ============================================
// EXPRESS SETUP
// ============================================

const app: Express = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SOCKET.IO SETUP
// ============================================

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

setIo(io);

// Store io instance for use in routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user's personal room for targeted updates
  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });
  
  // Join leaderboard room for global updates
  socket.on('join:leaderboard', () => {
    socket.join('leaderboard');
    console.log(`Socket ${socket.id} joined leaderboard room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/v1/auth', authRoutes);
app.use('/v1/quiz', quizRoutes);
app.use('/v1/leaderboard', leaderboardRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Test database connections
    const connected = await testConnections();
    if (!connected) {
      console.warn('Warning: Could not establish all database connections');
    }
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 BrainBolt API running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await postgresPool.end();
  await redisClient.quit();
  httpServer.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

startServer();
