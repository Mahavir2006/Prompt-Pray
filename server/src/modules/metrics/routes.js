import { Router } from 'express';
import store from '../../config/mockStore.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// GET /api/metrics/:modelId - Get aggregated metrics for a model
router.get('/:modelId', authenticate, (req, res, next) => {
    try {
        const { modelId } = req.params;
        const { type, startDate, endDate, bucket = '1' } = req.query;

        const model = store.getModelById(modelId);
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }

        if (type) {
            // Return aggregated time-series for a specific metric type
            const data = store.getAggregatedMetrics(
                modelId, type,
                startDate || new Date(Date.now() - 24 * 3600000).toISOString(),
                endDate || new Date().toISOString(),
                parseInt(bucket) || 1
            );
            return res.json({ modelId, type, data, count: data.length });
        }

        // Return latest snapshot of all metric types
        const latestMetrics = store.getLatestMetrics(modelId);
        res.json({ modelId, metrics: latestMetrics });
    } catch (err) {
        next(err);
    }
});

// POST /api/metrics/ingest - Ingest new metric data point
router.post('/ingest', authenticate, authorize('admin', 'analyst'), (req, res, next) => {
    try {
        const { modelId, type, value } = req.body;
        if (!modelId || !type || value === undefined) {
            return res.status(400).json({ error: 'modelId, type, and value are required', code: 'VALIDATION_ERROR' });
        }

        const model = store.getModelById(modelId);
        if (!model) {
            return res.status(404).json({ error: 'Model not found', code: 'NOT_FOUND' });
        }

        // Store metric
        const metric = store.addMetric({ modelId, type, value, environment: model.environment });

        // Rule evaluation — check thresholds
        const alert = evaluateRules(model, type, value);

        const response = { metric, alert: alert || null };

        // If alert was created, emit via WebSocket
        if (alert && req.app.get('io')) {
            req.app.get('io').emit('alertCreated', alert);
        }

        // Emit metric update event
        if (req.app.get('io')) {
            req.app.get('io').emit('metricUpdate', { modelId, type, value, timestamp: metric.timestamp });
        }

        res.status(201).json(response);
    } catch (err) {
        next(err);
    }
});

// Rule evaluation engine
function evaluateRules(model, type, value) {
    const thresholds = {
        accuracy: { operator: '<', threshold: 0.90, severity: 'critical', title: 'Accuracy Drop Detected' },
        precision: { operator: '<', threshold: 0.85, severity: 'high', title: 'Precision Below Threshold' },
        recall: { operator: '<', threshold: 0.80, severity: 'high', title: 'Recall Below Threshold' },
        latency: { operator: '>', threshold: 200, severity: 'high', title: 'High Latency Warning' },
        drift_score: { operator: '>', threshold: 0.25, severity: 'high', title: 'Data Drift Detected' },
        hallucination_rate: { operator: '>', threshold: 0.10, severity: 'critical', title: 'Hallucination Spike' },
        toxicity_score: { operator: '>', threshold: 0.03, severity: 'critical', title: 'Toxicity Alert' },
        cost_per_request: { operator: '>', threshold: 0.008, severity: 'medium', title: 'Cost Overrun' },
        data_quality: { operator: '<', threshold: 0.93, severity: 'medium', title: 'Data Quality Issue' },
    };

    const rule = thresholds[type];
    if (!rule) return null;

    const breached = rule.operator === '<' ? value < rule.threshold : value > rule.threshold;
    if (!breached) return null;

    return store.createAlert({
        modelId: model._id,
        modelName: model.name,
        title: rule.title,
        message: `${type} ${rule.operator === '<' ? 'dropped below' : 'exceeded'} ${rule.threshold} (current: ${value})`,
        severity: rule.severity,
        rule: `${type} ${rule.operator} ${rule.threshold}`,
    });
}

export default router;
