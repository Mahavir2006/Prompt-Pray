import { Router } from 'express';
import http from 'http';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

const FASTAPI_HOST = process.env.FASTAPI_HOST || '127.0.0.1';
const FASTAPI_PORT = process.env.FASTAPI_PORT || 8000;

/**
 * Generic proxy helper: forwards request to FastAPI backend.
 */
function proxyToFastAPI(req, res, { method, path, body }) {
    const options = {
        hostname: FASTAPI_HOST,
        port: FASTAPI_PORT,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => (data += chunk));
        proxyRes.on('end', () => {
            try {
                res.status(proxyRes.statusCode).json(JSON.parse(data));
            } catch {
                res.status(proxyRes.statusCode).send(data);
            }
        });
    });

    proxyReq.on('error', () => {
        res.status(502).json({
            error: 'ML API unavailable',
            detail: `Could not connect to FastAPI at ${FASTAPI_HOST}:${FASTAPI_PORT}. Make sure the Python API is running.`,
        });
    });

    if (body) proxyReq.write(JSON.stringify(body));
    proxyReq.end();
}

// POST /api/loan/predict — Single prediction
router.post('/predict', authenticate, (req, res) => {
    proxyToFastAPI(req, res, { method: 'POST', path: '/predict', body: req.body });
});

// POST /api/loan/predict/batch — Batch predictions
router.post('/predict/batch', authenticate, (req, res) => {
    proxyToFastAPI(req, res, { method: 'POST', path: '/predict/batch', body: req.body });
});

// GET /api/loan/model/info — Full model metadata
router.get('/model/info', authenticate, (req, res) => {
    proxyToFastAPI(req, res, { method: 'GET', path: '/model/info' });
});

// GET /api/loan/model/summary — Dashboard-ready summary
router.get('/model/summary', authenticate, (req, res) => {
    proxyToFastAPI(req, res, { method: 'GET', path: '/model/summary' });
});

// GET /api/loan/health — FastAPI health check
router.get('/health', (req, res) => {
    proxyToFastAPI(req, res, { method: 'GET', path: '/health' });
});

// POST /api/loan/train — Trigger model training
router.post('/train', authenticate, (req, res) => {
    proxyToFastAPI(req, res, { method: 'POST', path: '/train', body: req.body });
});

export default router;
