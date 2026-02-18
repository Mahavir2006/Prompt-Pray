import 'dotenv/config';
import express from 'express';
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
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import connectDB from './config/database.js';

const IS_VERCEL = !!process.env.VERCEL;

const app = express();

// ============== CORS ==============
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];
// Add the production frontend URL if set (strip trailing slash)
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Strip trailing slash from incoming origin for comparison
        const cleanOrigin = origin.replace(/\/+$/, '');
        // Check against allowed list
        if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
        // Also allow any *.vercel.app origin for deployment flexibility
        if (cleanOrigin.endsWith('.vercel.app')) return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============== Middleware ==============
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
        environment: IS_VERCEL ? 'vercel' : 'local',
    });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ============== Start ==============
// Only start the HTTP server + WebSocket when running locally (not on Vercel)
if (!IS_VERCEL) {
    const { createServer } = await import('http');
    const { Server: SocketIOServer } = await import('socket.io');
    const { setupRealtimeHandlers } = await import('./modules/realtime/handlers.js');

    const httpServer = createServer(app);

    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    app.set('io', io);
    setupRealtimeHandlers(io);

    const PORT = process.env.PORT || 5000;

    async function start() {
        await connectDB();
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 AI Observability Server running on port ${PORT}`);
            console.log(`   API:       http://localhost:${PORT}/api`);
            console.log(`   WebSocket: ws://localhost:${PORT}`);
            console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
        });
    }

    start();
} else {
    // On Vercel: just connect DB (no listen, no WebSocket)
    connectDB().catch(() => console.warn('[Vercel] DB connection skipped'));
}

export default app;

