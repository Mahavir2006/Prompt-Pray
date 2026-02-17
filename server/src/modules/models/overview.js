import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// In-memory cache with TTL
let overviewCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15000; // 15 seconds

// GET /api/overview
router.get('/', authenticate, (req, res, next) => {
    try {
        const now = Date.now();
        // Serve from cache if fresh
        if (overviewCache && (now - cacheTimestamp) < CACHE_TTL) {
            return res.json({ ...overviewCache, cached: true });
        }

        const overview = store.computeOverview();
        overviewCache = overview;
        cacheTimestamp = now;

        res.json({ ...overview, cached: false });
    } catch (err) {
        next(err);
    }
});

// Invalidate cache when called (used by WebSocket events)
export function invalidateOverviewCache() {
    overviewCache = null;
    cacheTimestamp = 0;
}

export default router;
