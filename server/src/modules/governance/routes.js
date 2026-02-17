import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/governance/logs - Paginated audit logs
router.get('/logs', authenticate, (req, res, next) => {
    try {
        const { action, userId, startDate, endDate, page = 1, limit = 25 } = req.query;
        const result = store.getAuditLogs({
            action,
            userId,
            startDate,
            endDate,
            page: parseInt(page),
            limit: Math.min(parseInt(limit) || 25, 50),
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/governance/actions - Available action types
router.get('/actions', authenticate, (req, res) => {
    const actions = [
        'USER_LOGIN', 'MODEL_DEPLOYED', 'MODEL_RETRAINED',
        'ALERT_RESOLVED', 'ALERT_ACKNOWLEDGED', 'THRESHOLD_UPDATED',
        'EXPORT_INITIATED', 'ROLE_CHANGED', 'CONFIG_CHANGED', 'DATA_ACCESSED',
    ];
    res.json({ actions });
});

// POST /api/governance/export - Server-side export
router.post('/export', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const { startDate, endDate, format = 'json' } = req.body;
        const result = store.getAuditLogs({ startDate, endDate, page: 1, limit: 10000 });

        // Log the export action
        store.addAuditLog({
            action: 'EXPORT_INITIATED',
            details: `Audit log export (${format}) — ${result.total} records`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        if (format === 'csv') {
            const headers = 'Timestamp,Action,User,Role,Details,Model,IP\n';
            const csv = result.data.map(l =>
                `"${l.timestamp}","${l.action}","${l.userName}","${l.userRole}","${l.details}","${l.modelName || ''}","${l.ipAddress}"`
            ).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_log_export.csv');
            return res.send(headers + csv);
        }

        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
