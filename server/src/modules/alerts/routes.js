import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/alerts - List alerts with pagination
router.get('/', authenticate, (req, res, next) => {
    try {
        const { status, severity, modelId, page = 1, limit = 20 } = req.query;
        const result = store.getAlerts({
            status,
            severity,
            modelId,
            page: parseInt(page),
            limit: Math.min(parseInt(limit) || 20, 50), // Cap at 50
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/alerts/stats - Alert statistics
router.get('/stats', authenticate, (req, res, next) => {
    try {
        const allAlerts = store.alerts;
        const stats = {
            total: allAlerts.length,
            active: allAlerts.filter(a => a.status === 'open' || a.status === 'active').length,
            acknowledged: allAlerts.filter(a => a.status === 'acknowledged').length,
            investigating: allAlerts.filter(a => a.status === 'investigating').length,
            resolved: allAlerts.filter(a => a.status === 'resolved').length,
            bySeverity: {
                critical: allAlerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'critical').length,
                high: allAlerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'high').length,
                medium: allAlerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'medium').length,
                low: allAlerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'low').length,
            },
        };
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

// GET /api/alerts/:id - Get single alert
router.get('/:id', authenticate, (req, res, next) => {
    try {
        const alert = store.getAlertById(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
        }
        res.json(alert);
    } catch (err) {
        next(err);
    }
});

// GET /api/alerts/:id/evidence - Get alert evidence snapshot
router.get('/:id/evidence', authenticate, (req, res, next) => {
    try {
        const evidence = store.getAlertEvidence(req.params.id);
        if (!evidence) {
            return res.status(404).json({ error: 'Alert or evidence not found', code: 'NOT_FOUND' });
        }
        res.json(evidence);
    } catch (err) {
        next(err);
    }
});

// GET /api/alerts/:id/history - Get state transition history
router.get('/:id/history', authenticate, (req, res, next) => {
    try {
        const history = store.getAlertHistory(req.params.id);
        if (!history) {
            return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
        }
        res.json({ data: history });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/alerts/:id/acknowledge - Acknowledge an alert
router.patch('/:id/acknowledge', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const result = store.acknowledgeAlert(req.params.id, req.user.id);
        if (result.error) {
            return res.status(400).json({ error: result.error, code: 'INVALID_TRANSITION' });
        }

        store.addAuditLog({
            action: 'ALERT_ACKNOWLEDGED',
            details: `Alert "${result.title}" acknowledged`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: result.modelId,
            modelName: result.modelName,
            ipAddress: req.ip,
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/alerts/:id/investigate - Move to INVESTIGATING state
router.patch('/:id/investigate', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const { comment } = req.body;
        const result = store.investigateAlert(req.params.id, req.user.id, req.user.email, comment);
        if (result.error) {
            return res.status(400).json({ error: result.error, code: 'INVALID_TRANSITION' });
        }

        store.addAuditLog({
            action: 'ALERT_INVESTIGATING',
            details: `Alert "${result.title}" — investigation started`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: result.modelId,
            modelName: result.modelName,
            ipAddress: req.ip,
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/alerts/:id/resolve - Resolve an alert (mandatory comment)
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const { comment } = req.body;
        const result = store.resolveAlert(req.params.id, req.user.id, comment);
        if (result.error) {
            return res.status(400).json({ error: result.error, code: 'INVALID_TRANSITION' });
        }

        // Create audit log
        store.addAuditLog({
            action: 'ALERT_RESOLVED',
            details: `Alert "${result.title}" resolved`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: result.modelId,
            modelName: result.modelName,
            ipAddress: req.ip,
        });

        // Emit resolution event
        if (req.app.get('io')) {
            req.app.get('io').emit('alertResolved', { alertId: result._id, resolvedBy: req.user.id });
        }

        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
