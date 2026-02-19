import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/models - List all models
router.get('/', authenticate, (req, res, next) => {
    try {
        const { type, environment, status, risk_tier, deployment_env, business_unit } = req.query;
        const models = store.getModels({ type, environment, status, risk_tier, deployment_env, business_unit });
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
        // Include version history
        const versionHistory = store.getVersionHistory(model._id);
        res.json({ ...model, latestMetrics, versionHistory });
    } catch (err) {
        next(err);
    }
});

// POST /api/models - Register new model (admin only)
router.post('/', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const { name, type, model_type, environment, deployment_env, description, version, use_case, business_unit, risk_tier, owner } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Model name is required', code: 'VALIDATION_ERROR' });
        }

        const model = store.registerModel({
            name, type, model_type, environment, deployment_env,
            description, version, use_case, business_unit, risk_tier, owner,
        });

        store.addAuditLog({
            action: 'MODEL_REGISTERED',
            details: `Model "${name}" registered (${risk_tier || 'Low'} risk)`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: model._id,
            modelName: model.name,
            ipAddress: req.ip,
        });

        res.status(201).json(model);
    } catch (err) {
        next(err);
    }
});

// PUT /api/models/:id - Update model
router.put('/:id', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const model = store.updateModel(req.params.id, { ...req.body, updated_by: req.user.email });
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'MODEL_UPDATED',
            details: `Model "${model.name}" updated`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: model._id,
            modelName: model.name,
            ipAddress: req.ip,
        });

        res.json(model);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/models/:id/approve - Approve model (admin only)
router.patch('/:id/approve', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const model = store.approveModel(req.params.id, req.user.email);
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'MODEL_APPROVED',
            details: `Model "${model.name}" approved for production`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: model._id,
            modelName: model.name,
            ipAddress: req.ip,
        });

        res.json(model);
    } catch (err) {
        next(err);
    }
});

// GET /api/models/:id/versions - Get version history
router.get('/:id/versions', authenticate, (req, res, next) => {
    try {
        const model = store.getModelById(req.params.id);
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }
        const versions = store.getVersionHistory(req.params.id);
        res.json({ data: versions, total: versions.length });
    } catch (err) {
        next(err);
    }
});

export default router;
