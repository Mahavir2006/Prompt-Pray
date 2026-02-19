import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Helper: Mask sensitive data
function maskValue(value) {
    if (!value) return value;
    if (value.includes('@')) {
        // Mask email: j***@example.com
        const [user, domain] = value.split('@');
        return `${user[0]}***@${domain}`;
    }
    // Mask IP or other strings: 192.***.***.1
    return value.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.***.***.$4').replace(/(.{2}).+(.{2})/, '$1***$2');
}

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

        // Privacy Masking (Part 7)
        if (req.user.role !== 'admin') {
            result.data = result.data.map(log => ({
                ...log,
                userName: maskValue(log.userName),
                ipAddress: maskValue(log.ipAddress),
                details: log.details.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, m => maskValue(m)), // simple email mask in details
            }));
        }

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/governance/actions - Available action types
router.get('/actions', authenticate, (req, res) => {
    const actions = [
        'USER_LOGIN', 'MODEL_DEPLOYED', 'MODEL_RETRAINED',
        'ALERT_RESOLVED', 'ALERT_ACKNOWLEDGED', 'ALERT_INVESTIGATING', 'THRESHOLD_UPDATED',
        'EXPORT_INITIATED', 'ROLE_CHANGED', 'CONFIG_CHANGED', 'DATA_ACCESSED',
        'MODEL_REGISTERED', 'MODEL_APPROVED', 'MODEL_UPDATED',
        'INCIDENT_CREATED', 'INCIDENT_UPDATED', 'INCIDENT_CLOSED',
        'SLO_CREATED', 'SLO_UPDATED', 'SLO_BREACH',
        'REPORT_GENERATED',
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

        // Privacy Masking (Part 7) - even for export if not admin (e.g. analyst exporting)
        // Adjust policy: if user is analyst, arguably they might need data, but the prompt says 
        // "Ensure privacy/security... field-level masking". 
        // I will assume Analysts see raw data for analysis, but Viewers (if they could export) wouldn't.
        // However, export is authorized for 'admin', 'analyst'.
        // Let's enforce masking for 'analyst' too just to be "Banking-Grade" strict unless they are Admin.
        if (req.user.role !== 'admin') {
            result.data = result.data.map(log => ({
                ...log,
                userName: maskValue(log.userName),
                ipAddress: maskValue(log.ipAddress),
                details: log.details.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, m => maskValue(m)),
            }));
        }

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

// GET /api/governance/sensitive-access - Access logs for sensitive data
router.get('/sensitive-access', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const { page = 1, limit = 25 } = req.query;
        const result = store.getAuditLogs({
            action: 'DATA_ACCESSED',
            page: parseInt(page),
            limit: Math.min(parseInt(limit) || 25, 50),
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
