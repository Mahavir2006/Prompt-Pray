import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Modules
import authRoutes from './modules/auth/routes.js';
import modelRoutes from './modules/models/routes.js';
import overviewRoutes from './modules/models/overview.js';
import metricRoutes from './modules/metrics/routes.js';
import alertRoutes from './modules/alerts/routes.js';
import governanceRoutes from './modules/governance/routes.js';
import { setupRealtimeHandlers } from './modules/realtime/handlers.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import connectDB from './config/database.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Store io instance on app for use in routes
app.set('io', io);

// ============== Middleware ==============
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});
app.use('/api/', apiLimiter);

// ============== Routes ==============
app.use('/api/auth', authRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/metrics', metricRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/governance', governanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
    });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ============== WebSocket ==============
setupRealtimeHandlers(io);

// ============== Start ==============
const PORT = process.env.PORT || 5000;

async function start() {
    // Try connecting to MongoDB (falls back gracefully)
    await connectDB();

    httpServer.listen(PORT, () => {
        console.log(`\n🚀 AI Observability Server running on port ${PORT}`);
        console.log(`   API:       http://localhost:${PORT}/api`);
        console.log(`   WebSocket: ws://localhost:${PORT}`);
        console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
    });
}

start();

export default app;
