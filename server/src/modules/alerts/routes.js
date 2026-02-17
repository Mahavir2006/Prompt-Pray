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
            active: allAlerts.filter(a => a.status === 'active').length,
            acknowledged: allAlerts.filter(a => a.status === 'acknowledged').length,
            resolved: allAlerts.filter(a => a.status === 'resolved').length,
            bySeverity: {
                critical: allAlerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
                high: allAlerts.filter(a => a.status === 'active' && a.severity === 'high').length,
                medium: allAlerts.filter(a => a.status === 'active' && a.severity === 'medium').length,
                low: allAlerts.filter(a => a.status === 'active' && a.severity === 'low').length,
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

// PATCH /api/alerts/:id/resolve - Resolve an alert
router.patch('/:id/resolve', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const alert = store.resolveAlert(req.params.id, req.user.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
        }

        // Create audit log
        store.addAuditLog({
            action: 'ALERT_RESOLVED',
            details: `Alert "${alert.title}" resolved`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: alert.modelId,
            modelName: alert.modelName,
            ipAddress: req.ip,
        });

        // Emit resolution event
        if (req.app.get('io')) {
            req.app.get('io').emit('alertResolved', { alertId: alert._id, resolvedBy: req.user.id });
        }

        res.json(alert);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/alerts/:id/acknowledge - Acknowledge an alert
router.patch('/:id/acknowledge', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const alert = store.acknowledgeAlert(req.params.id, req.user.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'ALERT_ACKNOWLEDGED',
            details: `Alert "${alert.title}" acknowledged`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            modelId: alert.modelId,
            modelName: alert.modelName,
            ipAddress: req.ip,
        });

        res.json(alert);
    } catch (err) {
        next(err);
    }
});

export default router;
