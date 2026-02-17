import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// GET /api/models - List all models
router.get('/', authenticate, (req, res, next) => {
    try {
        const { type, environment, status } = req.query;
        const models = store.getModels({ type, environment, status });
        res.json({ data: models, total: models.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/models/:id - Get model details
router.get('/:id', authenticate, (req, res, next) => {
    try {
        const model = store.getModelById(req.params.id);
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }

        // Include latest metrics snapshot
        const latestMetrics = store.getLatestMetrics(model._id);
        res.json({ ...model, latestMetrics });
    } catch (err) {
        next(err);
    }
});

export default router;
