import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/slos - List all SLOs
router.get('/', authenticate, (req, res, next) => {
    try {
        const { status, service_id } = req.query;
        const slos = store.getSLOs({ status, service_id });
        res.json({ data: slos, total: slos.length });
    } catch (err) {
        next(err);
    }
});

// GET /api/slos/:id - Get SLO detail
router.get('/:id', authenticate, (req, res, next) => {
    try {
        const slo = store.getSLOById(req.params.id);
        if (!slo) {
            return res.status(404).json({ error: 'SLO not found', code: 'NOT_FOUND' });
        }

        // Resolve linked alerts
        const linkedAlertDetails = (slo.linked_alerts || [])
            .map(aid => store.getAlertById(aid))
            .filter(Boolean)
            .map(a => ({ _id: a._id, title: a.title, severity: a.severity, status: a.status }));

        res.json({ ...slo, linkedAlertDetails });
    } catch (err) {
        next(err);
    }
});

// POST /api/slos - Create SLO
router.post('/', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const { service_id, service_name, metric, metric_unit, target, evaluation_window } = req.body;
        if (!service_id || !metric || target === undefined) {
            return res.status(400).json({ error: 'service_id, metric, and target are required', code: 'VALIDATION_ERROR' });
        }

        const slo = store.createSLO({
            service_id, service_name, metric, metric_unit, target, evaluation_window,
        });

        store.addAuditLog({
            action: 'SLO_CREATED',
            details: `SLO created: ${service_name || service_id} — ${metric} target ${target}`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        res.status(201).json(slo);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/slos/:id - Update SLO
router.patch('/:id', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const slo = store.updateSLO(req.params.id, req.body);
        if (!slo) {
            return res.status(404).json({ error: 'SLO not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'SLO_UPDATED',
            details: `SLO updated: ${slo.service_name} — ${slo.metric}`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        res.json(slo);
    } catch (err) {
        next(err);
    }
});

export default router;
