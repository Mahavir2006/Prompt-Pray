// ============================================================
// In-Memory Mock Database
// Used when MongoDB is not available. Provides the same API
// surface so all modules work identically.
// ============================================================

import crypto from 'crypto';

const generateId = () => crypto.randomUUID();
const now = () => new Date();

// --------------- Seed Data ---------------

const ROLES = ['admin', 'analyst', 'viewer'];

const USERS = [
    { _id: generateId(), email: 'admin@observability.ai', password: '$2a$10$XQCg1z4YR1S6MhCr0lEEVOzFlwXfqGTI9Gdz0FPdq6JFBfkBWssHu', name: 'Admin User', role: 'admin', createdAt: now() },
    { _id: generateId(), email: 'analyst@observability.ai', password: '$2a$10$XQCg1z4YR1S6MhCr0lEEVOzFlwXfqGTI9Gdz0FPdq6JFBfkBWssHu', name: 'Jane Analyst', role: 'analyst', createdAt: now() },
    { _id: generateId(), email: 'viewer@observability.ai', password: '$2a$10$XQCg1z4YR1S6MhCr0lEEVOzFlwXfqGTI9Gdz0FPdq6JFBfkBWssHu', name: 'View Only', role: 'viewer', createdAt: now() },
];

const MODEL_TYPES = ['ml', 'llm'];
const ML_MODELS = [
    { _id: generateId(), name: 'Fraud Detection v3.2', type: 'ml', environment: 'production', status: 'active', description: 'Real-time transaction fraud scoring model', version: '3.2.1', createdAt: new Date(Date.now() - 90 * 86400000) },
    { _id: generateId(), name: 'Credit Risk Classifier', type: 'ml', environment: 'production', status: 'active', description: 'Consumer credit risk assessment', version: '2.1.0', createdAt: new Date(Date.now() - 180 * 86400000) },
    { _id: generateId(), name: 'AML Transaction Monitor', type: 'ml', environment: 'staging', status: 'active', description: 'Anti-money laundering pattern detection', version: '1.8.3', createdAt: new Date(Date.now() - 60 * 86400000) },
    { _id: generateId(), name: 'Customer Churn Predictor', type: 'ml', environment: 'production', status: 'degraded', description: 'Predicts customer churn probability', version: '4.0.0', createdAt: new Date(Date.now() - 120 * 86400000) },
];

const LLM_MODELS = [
    { _id: generateId(), name: 'Customer Support Bot', type: 'llm', environment: 'production', status: 'active', description: 'GPT-4 powered customer service assistant', version: '2.0.0', createdAt: new Date(Date.now() - 45 * 86400000) },
    { _id: generateId(), name: 'Document Summarizer', type: 'llm', environment: 'production', status: 'active', description: 'Legal document summarization pipeline', version: '1.3.0', createdAt: new Date(Date.now() - 30 * 86400000) },
    { _id: generateId(), name: 'Compliance Q&A Engine', type: 'llm', environment: 'staging', status: 'active', description: 'Regulatory compliance query answering', version: '0.9.1', createdAt: new Date(Date.now() - 15 * 86400000) },
];

const ALL_MODELS = [...ML_MODELS, ...LLM_MODELS];

// ML metric types
const ML_METRIC_TYPES = ['accuracy', 'precision', 'recall', 'f1_score', 'latency', 'throughput', 'drift_score', 'data_quality'];
// LLM metric types
const LLM_METRIC_TYPES = ['token_usage', 'latency', 'hallucination_rate', 'toxicity_score', 'cost_per_request', 'throughput', 'context_relevance'];

const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ALERT_STATUSES = ['active', 'acknowledged', 'resolved'];

// --------------- Generate Time-Series Metrics ---------------

function generateMetrics() {
    const metrics = [];
    const nowMs = Date.now();
    const hoursBack = 72; // 3 days of data

    for (const model of ALL_MODELS) {
        const metricTypes = model.type === 'ml' ? ML_METRIC_TYPES : LLM_METRIC_TYPES;
        for (const type of metricTypes) {
            for (let h = hoursBack; h >= 0; h--) {
                const timestamp = new Date(nowMs - h * 3600000);
                let value;

                switch (type) {
                    case 'accuracy': value = 0.92 + Math.random() * 0.06 - 0.02; break;
                    case 'precision': value = 0.88 + Math.random() * 0.08 - 0.03; break;
                    case 'recall': value = 0.85 + Math.random() * 0.1 - 0.04; break;
                    case 'f1_score': value = 0.87 + Math.random() * 0.08 - 0.03; break;
                    case 'latency': value = 50 + Math.random() * 150; break;
                    case 'throughput': value = 800 + Math.random() * 400; break;
                    case 'drift_score': value = Math.random() * 0.3; break;
                    case 'data_quality': value = 0.95 + Math.random() * 0.05 - 0.02; break;
                    case 'token_usage': value = 500 + Math.random() * 3000; break;
                    case 'hallucination_rate': value = Math.random() * 0.15; break;
                    case 'toxicity_score': value = Math.random() * 0.05; break;
                    case 'cost_per_request': value = 0.002 + Math.random() * 0.01; break;
                    case 'context_relevance': value = 0.7 + Math.random() * 0.25; break;
                    default: value = Math.random() * 100;
                }

                metrics.push({
                    _id: generateId(),
                    modelId: model._id,
                    type,
                    value: Math.round(value * 10000) / 10000,
                    timestamp,
                    environment: model.environment,
                });
            }
        }
    }
    return metrics;
}

// --------------- Generate Alerts ---------------

function generateAlerts() {
    const alerts = [];
    const messages = [
        { title: 'Accuracy Drop Detected', message: 'Model accuracy dropped below 90% threshold', severity: 'critical', rule: 'accuracy < 0.90' },
        { title: 'High Latency Warning', message: 'P95 latency exceeded 200ms for 15 minutes', severity: 'high', rule: 'latency_p95 > 200' },
        { title: 'Data Drift Detected', message: 'Feature drift score exceeded acceptable range', severity: 'high', rule: 'drift_score > 0.25' },
        { title: 'Throughput Degradation', message: 'Model throughput dropped below baseline', severity: 'medium', rule: 'throughput < 500' },
        { title: 'Hallucination Spike', message: 'Hallucination rate increased above 10%', severity: 'critical', rule: 'hallucination_rate > 0.10' },
        { title: 'Token Usage Anomaly', message: 'Token consumption 3x above daily average', severity: 'medium', rule: 'token_usage > 3x_avg' },
        { title: 'Toxicity Alert', message: 'Toxicity score exceeded safety threshold', severity: 'critical', rule: 'toxicity_score > 0.03' },
        { title: 'Cost Overrun', message: 'Per-request cost exceeds budget threshold', severity: 'high', rule: 'cost_per_request > 0.008' },
        { title: 'Data Quality Issue', message: 'Input data quality score below acceptable level', severity: 'medium', rule: 'data_quality < 0.93' },
        { title: 'Model Staleness', message: 'Model has not been retrained in 90+ days', severity: 'low', rule: 'days_since_retrain > 90' },
    ];

    for (let i = 0; i < 45; i++) {
        const template = messages[i % messages.length];
        const model = ALL_MODELS[Math.floor(Math.random() * ALL_MODELS.length)];
        const hoursAgo = Math.floor(Math.random() * 168); // within a week
        const createdAt = new Date(Date.now() - hoursAgo * 3600000);
        const isResolved = Math.random() > 0.4;

        alerts.push({
            _id: generateId(),
            modelId: model._id,
            modelName: model.name,
            title: template.title,
            message: template.message,
            severity: template.severity,
            rule: template.rule,
            status: isResolved ? 'resolved' : (Math.random() > 0.5 ? 'active' : 'acknowledged'),
            assignedTo: USERS[Math.floor(Math.random() * USERS.length)]._id,
            createdAt,
            updatedAt: isResolved ? new Date(createdAt.getTime() + Math.random() * 3600000 * 4) : createdAt,
            resolvedAt: isResolved ? new Date(createdAt.getTime() + Math.random() * 3600000 * 4) : null,
            resolvedBy: isResolved ? USERS[0]._id : null,
        });
    }

    return alerts.sort((a, b) => b.createdAt - a.createdAt);
}

// --------------- Generate Audit Logs ---------------

function generateAuditLogs() {
    const logs = [];
    const actions = [
        { action: 'MODEL_DEPLOYED', details: 'Model deployed to production environment' },
        { action: 'ALERT_RESOLVED', details: 'Alert manually resolved by admin' },
        { action: 'THRESHOLD_UPDATED', details: 'Alert threshold configuration modified' },
        { action: 'USER_LOGIN', details: 'User authenticated via SSO' },
        { action: 'EXPORT_INITIATED', details: 'Compliance report export started' },
        { action: 'MODEL_RETRAINED', details: 'Model retrained with new dataset' },
        { action: 'ROLE_CHANGED', details: 'User role updated by admin' },
        { action: 'CONFIG_CHANGED', details: 'System configuration modified' },
        { action: 'DATA_ACCESSED', details: 'Sensitive data access logged' },
        { action: 'ALERT_ACKNOWLEDGED', details: 'Alert acknowledged by analyst' },
    ];

    for (let i = 0; i < 100; i++) {
        const template = actions[i % actions.length];
        const user = USERS[Math.floor(Math.random() * USERS.length)];
        const model = ALL_MODELS[Math.floor(Math.random() * ALL_MODELS.length)];

        logs.push({
            _id: generateId(),
            action: template.action,
            details: template.details,
            userId: user._id,
            userName: user.name,
            userRole: user.role,
            modelId: model._id,
            modelName: model.name,
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 720) * 3600000),
            changes: template.action.includes('CHANGED') ? { field: 'threshold', oldValue: '0.9', newValue: '0.85' } : null,
        });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// ============= MOCK STORE =============

class MockStore {
    constructor() {
        this.users = [...USERS];
        this.models = [...ALL_MODELS];
        this.metrics = generateMetrics();
        this.alerts = generateAlerts();
        this.auditLogs = generateAuditLogs();
        console.log(`[MockStore] Initialized: ${this.users.length} users, ${this.models.length} models, ${this.metrics.length} metrics, ${this.alerts.length} alerts, ${this.auditLogs.length} audit logs`);
    }

    // --- Users ---
    findUserByEmail(email) {
        return this.users.find(u => u.email === email) || null;
    }

    findUserById(id) {
        return this.users.find(u => u._id === id) || null;
    }

    // --- Models ---
    getModels(filters = {}) {
        let result = [...this.models];
        if (filters.type) result = result.filter(m => m.type === filters.type);
        if (filters.environment) result = result.filter(m => m.environment === filters.environment);
        if (filters.status) result = result.filter(m => m.status === filters.status);
        return result;
    }

    getModelById(id) {
        return this.models.find(m => m._id === id) || null;
    }

    // --- Metrics ---
    getMetrics(filters = {}) {
        let result = [...this.metrics];
        if (filters.modelId) result = result.filter(m => m.modelId === filters.modelId);
        if (filters.type) result = result.filter(m => m.type === filters.type);
        if (filters.startDate) result = result.filter(m => m.timestamp >= new Date(filters.startDate));
        if (filters.endDate) result = result.filter(m => m.timestamp <= new Date(filters.endDate));
        if (filters.environment) result = result.filter(m => m.environment === filters.environment);
        return result;
    }

    getAggregatedMetrics(modelId, type, startDate, endDate, bucketHours = 1) {
        const filtered = this.getMetrics({ modelId, type, startDate, endDate });
        const buckets = new Map();

        for (const m of filtered) {
            const bucketKey = Math.floor(m.timestamp.getTime() / (bucketHours * 3600000));
            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, { sum: 0, count: 0, min: Infinity, max: -Infinity, timestamp: new Date(bucketKey * bucketHours * 3600000) });
            }
            const b = buckets.get(bucketKey);
            b.sum += m.value;
            b.count++;
            b.min = Math.min(b.min, m.value);
            b.max = Math.max(b.max, m.value);
        }

        return Array.from(buckets.values())
            .map(b => ({
                timestamp: b.timestamp,
                avg: Math.round((b.sum / b.count) * 10000) / 10000,
                min: Math.round(b.min * 10000) / 10000,
                max: Math.round(b.max * 10000) / 10000,
                count: b.count,
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    getLatestMetrics(modelId) {
        const types = this.models.find(m => m._id === modelId)?.type === 'ml' ? ML_METRIC_TYPES : LLM_METRIC_TYPES;
        const latest = {};
        for (const type of types) {
            const metric = this.metrics
                .filter(m => m.modelId === modelId && m.type === type)
                .sort((a, b) => b.timestamp - a.timestamp)[0];
            if (metric) latest[type] = metric;
        }
        return latest;
    }

    addMetric(metric) {
        const entry = { _id: generateId(), ...metric, timestamp: new Date() };
        this.metrics.push(entry);
        return entry;
    }

    // --- Alerts ---
    getAlerts(filters = {}) {
        let result = [...this.alerts];
        if (filters.status) result = result.filter(a => a.status === filters.status);
        if (filters.severity) result = result.filter(a => a.severity === filters.severity);
        if (filters.modelId) result = result.filter(a => a.modelId === filters.modelId);

        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const total = result.length;
        const start = (page - 1) * limit;

        return {
            data: result.slice(start, start + limit),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    getAlertById(id) {
        return this.alerts.find(a => a._id === id) || null;
    }

    createAlert(alert) {
        // Prevent duplicate active alerts for same model and rule
        const existing = this.alerts.find(a =>
            a.modelId === alert.modelId &&
            a.rule === alert.rule &&
            a.status === 'active'
        );
        if (existing) return existing;

        const entry = {
            _id: generateId(),
            ...alert,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alerts.unshift(entry);
        return entry;
    }

    resolveAlert(id, userId) {
        const alert = this.alerts.find(a => a._id === id);
        if (!alert) return null;
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolvedBy = userId;
        alert.updatedAt = new Date();
        return alert;
    }

    acknowledgeAlert(id, userId) {
        const alert = this.alerts.find(a => a._id === id);
        if (!alert) return null;
        alert.status = 'acknowledged';
        alert.assignedTo = userId;
        alert.updatedAt = new Date();
        return alert;
    }

    getActiveAlertCount() {
        return this.alerts.filter(a => a.status === 'active').length;
    }

    // --- Audit Logs ---
    getAuditLogs(filters = {}) {
        let result = [...this.auditLogs];
        if (filters.action) result = result.filter(l => l.action === filters.action);
        if (filters.userId) result = result.filter(l => l.userId === filters.userId);
        if (filters.startDate) result = result.filter(l => l.timestamp >= new Date(filters.startDate));
        if (filters.endDate) result = result.filter(l => l.timestamp <= new Date(filters.endDate));

        const page = filters.page || 1;
        const limit = filters.limit || 25;
        const total = result.length;

        return {
            data: result.slice((page - 1) * limit, page * limit),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    addAuditLog(log) {
        const entry = { _id: generateId(), ...log, timestamp: new Date() };
        this.auditLogs.unshift(entry);
        return entry;
    }

    // --- Overview / Risk Score ---
    computeOverview() {
        const activeAlerts = this.getActiveAlertCount();
        const criticalAlerts = this.alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
        const highAlerts = this.alerts.filter(a => a.status === 'active' && a.severity === 'high').length;

        // Weighted risk score: critical=40, high=25, medium=10, low=5 (max 100)
        const riskRaw = (criticalAlerts * 40) + (highAlerts * 25) +
            (this.alerts.filter(a => a.status === 'active' && a.severity === 'medium').length * 10) +
            (this.alerts.filter(a => a.status === 'active' && a.severity === 'low').length * 5);
        const riskScore = Math.min(100, riskRaw);

        // System health
        const totalModels = this.models.length;
        const activeModels = this.models.filter(m => m.status === 'active').length;
        const healthPercent = Math.round((activeModels / totalModels) * 100);

        // Trend data (last 24h, bucketed by hour)
        const last24h = new Date(Date.now() - 24 * 3600000);
        const alertsOverTime = [];
        for (let h = 0; h < 24; h++) {
            const bucketStart = new Date(last24h.getTime() + h * 3600000);
            const bucketEnd = new Date(bucketStart.getTime() + 3600000);
            const count = this.alerts.filter(a => a.createdAt >= bucketStart && a.createdAt < bucketEnd).length;
            alertsOverTime.push({ hour: bucketStart.toISOString(), count });
        }

        // Avg latency trend
        const latencyMetrics = this.metrics
            .filter(m => m.type === 'latency' && m.timestamp >= last24h)
            .sort((a, b) => a.timestamp - b.timestamp);

        const latencyBuckets = [];
        for (let h = 0; h < 24; h++) {
            const bucketStart = new Date(last24h.getTime() + h * 3600000);
            const bucketEnd = new Date(bucketStart.getTime() + 3600000);
            const bucket = latencyMetrics.filter(m => m.timestamp >= bucketStart && m.timestamp < bucketEnd);
            const avg = bucket.length > 0 ? bucket.reduce((s, m) => s + m.value, 0) / bucket.length : 0;
            latencyBuckets.push({ hour: bucketStart.toISOString(), avgLatency: Math.round(avg * 100) / 100 });
        }

        return {
            riskScore,
            activeAlerts,
            criticalAlerts,
            highAlerts,
            systemHealth: healthPercent,
            totalModels,
            activeModels,
            modelsByType: {
                ml: this.models.filter(m => m.type === 'ml').length,
                llm: this.models.filter(m => m.type === 'llm').length,
            },
            trends: {
                alertsOverTime,
                latencyTrend: latencyBuckets,
            },
            lastUpdated: new Date().toISOString(),
        };
    }
}

// Singleton
const store = new MockStore();
export default store;
