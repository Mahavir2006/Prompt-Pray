import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/incidents - List incidents
router.get('/', authenticate, (req, res, next) => {
    try {
        const { status, severity, page = 1, limit = 20 } = req.query;
        const result = store.getIncidents({
            status,
            severity,
            page: parseInt(page),
            limit: Math.min(parseInt(limit) || 20, 50),
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/incidents/:id - Get incident detail
router.get('/:id', authenticate, (req, res, next) => {
    try {
        const incident = store.getIncidentById(req.params.id);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
        }

        // Resolve linked alert details
        const linkedAlertDetails = (incident.linked_alerts || [])
            .map(aid => store.getAlertById(aid))
            .filter(Boolean)
            .map(a => ({ _id: a._id, title: a.title, severity: a.severity, status: a.status, modelName: a.modelName }));

        res.json({ ...incident, linkedAlertDetails });
    } catch (err) {
        next(err);
    }
});

// POST /api/incidents - Create incident
router.post('/', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const { title, severity, linked_alerts } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' });
        }

        const incident = store.createIncident({
            title,
            severity,
            linked_alerts,
            created_by: req.user.email,
        });

        store.addAuditLog({
            action: 'INCIDENT_CREATED',
            details: `Incident "${title}" created`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        res.status(201).json(incident);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/incidents/:id - Update incident
router.patch('/:id', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const incident = store.updateIncident(req.params.id, req.body, req.user.email);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'INCIDENT_UPDATED',
            details: `Incident "${incident.title}" updated`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        res.json(incident);
    } catch (err) {
        next(err);
    }
});

// PATCH /api/incidents/:id/close - Close incident (requires RCA)
router.patch('/:id/close', authenticate, authorize('admin'), (req, res, next) => {
    try {
        const result = store.closeIncident(req.params.id, req.user.id, req.user.email);
        if (result.error) {
            return res.status(400).json({ error: result.error, code: 'VALIDATION_ERROR' });
        }

        store.addAuditLog({
            action: 'INCIDENT_CLOSED',
            details: `Incident "${result.title}" closed with RCA`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// GET /api/incidents/:id/export - Export incident as CSV
router.get('/:id/export', authenticate, (req, res, next) => {
    try {
        const incident = store.getIncidentById(req.params.id);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
        }

        store.addAuditLog({
            action: 'EXPORT_INITIATED',
            details: `Incident "${incident.title}" exported`,
            userId: req.user.id,
            userName: req.user.email,
            userRole: req.user.role,
            ipAddress: req.ip,
        });

        const headers = 'Timestamp,Event,User,Details\n';
        const csv = incident.timeline.map(t =>
            `"${new Date(t.timestamp).toISOString()}","${t.event}","${t.user}","${t.details}"`
        ).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=incident_${incident._id}.csv`);
        res.send(headers + csv);
    } catch (err) {
        next(err);
    }
});

export default router;
