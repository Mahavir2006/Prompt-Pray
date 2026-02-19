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
const RISK_TIERS = ['Low', 'Medium', 'High'];
const DEPLOYMENT_ENVS = ['dev', 'uat', 'prod'];
const MODEL_STATUSES = ['active', 'paused', 'retired'];

const ML_MODELS = [
    {
        _id: generateId(), name: 'Fraud Detection v3.2', type: 'ml', model_type: 'ML', environment: 'production', deployment_env: 'prod', status: 'active',
        description: 'Real-time transaction fraud scoring model', version: '3.2.1', use_case: 'Transaction fraud scoring', business_unit: 'Risk Management', risk_tier: 'High',
        owner: USERS[1].name, approved_by: USERS[0].name, approval_date: new Date(Date.now() - 95 * 86400000), createdAt: new Date(Date.now() - 90 * 86400000), updatedAt: new Date(Date.now() - 10 * 86400000),
        baselines: { accuracy: 0.94, latency: 45, throughput: 1200, drift_score: 0.05, data_quality: 0.99 }
    },
    {
        _id: generateId(), name: 'Credit Risk Classifier', type: 'ml', model_type: 'ML', environment: 'production', deployment_env: 'prod', status: 'active',
        description: 'Consumer credit risk assessment', version: '2.1.0', use_case: 'Credit decisioning', business_unit: 'Lending', risk_tier: 'High',
        owner: USERS[1].name, approved_by: USERS[0].name, approval_date: new Date(Date.now() - 185 * 86400000), createdAt: new Date(Date.now() - 180 * 86400000), updatedAt: new Date(Date.now() - 30 * 86400000),
        baselines: { accuracy: 0.88, latency: 120, throughput: 400, drift_score: 0.12, data_quality: 0.95 }
    },
    {
        _id: generateId(), name: 'AML Transaction Monitor', type: 'ml', model_type: 'ML', environment: 'staging', deployment_env: 'uat', status: 'active',
        description: 'Anti-money laundering pattern detection', version: '1.8.3', use_case: 'AML compliance screening', business_unit: 'Compliance', risk_tier: 'High',
        owner: USERS[1].name, approved_by: null, approval_date: null, createdAt: new Date(Date.now() - 60 * 86400000), updatedAt: new Date(Date.now() - 5 * 86400000),
        baselines: { accuracy: 0.82, latency: 200, throughput: 800, drift_score: 0.08, data_quality: 0.92 }
    },
    {
        _id: generateId(), name: 'Customer Churn Predictor', type: 'ml', model_type: 'ML', environment: 'production', deployment_env: 'prod', status: 'degraded',
        description: 'Predicts customer churn probability', version: '4.0.0', use_case: 'Customer retention', business_unit: 'Marketing', risk_tier: 'Medium',
        owner: USERS[1].name, approved_by: USERS[0].name, approval_date: new Date(Date.now() - 125 * 86400000), createdAt: new Date(Date.now() - 120 * 86400000), updatedAt: new Date(Date.now() - 2 * 86400000),
        baselines: { accuracy: 0.76, latency: 85, throughput: 1500, drift_score: 0.22, data_quality: 0.88 }
    },
];

const LLM_MODELS = [
    {
        _id: generateId(), name: 'Customer Support Bot', type: 'llm', model_type: 'LLM', environment: 'production', deployment_env: 'prod', status: 'active',
        description: 'GPT-4 powered customer service assistant', version: '2.0.0', use_case: 'Customer support automation', business_unit: 'Operations', risk_tier: 'Medium',
        owner: USERS[1].name, approved_by: USERS[0].name, approval_date: new Date(Date.now() - 50 * 86400000), createdAt: new Date(Date.now() - 45 * 86400000), updatedAt: new Date(Date.now() - 3 * 86400000),
        baselines: { token_usage: 1200, latency: 450, hallucination_rate: 0.02, toxicity_score: 0.001, cost_per_request: 0.005 }
    },
    {
        _id: generateId(), name: 'Document Summarizer', type: 'llm', model_type: 'LLM', environment: 'production', deployment_env: 'prod', status: 'active',
        description: 'Legal document summarization pipeline', version: '1.3.0', use_case: 'Legal document processing', business_unit: 'Legal', risk_tier: 'Medium',
        owner: USERS[1].name, approved_by: USERS[0].name, approval_date: new Date(Date.now() - 35 * 86400000), createdAt: new Date(Date.now() - 30 * 86400000), updatedAt: new Date(Date.now() - 7 * 86400000),
        baselines: { token_usage: 4500, latency: 1200, hallucination_rate: 0.05, toxicity_score: 0.005, cost_per_request: 0.015 }
    },
    {
        _id: generateId(), name: 'Compliance Q&A Engine', type: 'llm', model_type: 'LLM', environment: 'staging', deployment_env: 'uat', status: 'active',
        description: 'Regulatory compliance query answering', version: '0.9.1', use_case: 'Regulatory compliance queries', business_unit: 'Compliance', risk_tier: 'Low',
        owner: USERS[1].name, approved_by: null, approval_date: null, createdAt: new Date(Date.now() - 15 * 86400000), updatedAt: new Date(Date.now() - 1 * 86400000),
        baselines: { token_usage: 800, latency: 300, hallucination_rate: 0.08, toxicity_score: 0.002, cost_per_request: 0.003 }
    },
];

const ALL_MODELS = [...ML_MODELS, ...LLM_MODELS];

// Generate version history for each model
function generateVersionHistory() {
    const histories = {};
    for (const model of ALL_MODELS) {
        const versions = [];
        const vParts = model.version.split('.').map(Number);
        // Generate 2-4 previous versions
        const numVersions = 2 + Math.floor(Math.random() * 3);
        for (let i = numVersions; i >= 0; i--) {
            const major = vParts[0];
            const minor = Math.max(0, vParts[1] - i);
            const patch = i === 0 ? vParts[2] : Math.floor(Math.random() * 5);
            const versionStr = `${major}.${minor}.${patch}`;
            const daysAgo = 30 * (i + 1) + Math.floor(Math.random() * 30);
            versions.push({
                _id: generateId(),
                version: versionStr,
                created_at: new Date(Date.now() - daysAgo * 86400000),
                created_by: USERS[Math.floor(Math.random() * 2)].name,
                change_summary: i === 0
                    ? 'Current production version'
                    : `Version ${versionStr} — ${['Performance improvements', 'Feature update', 'Bug fixes', 'Threshold tuning', 'Data pipeline update'][Math.floor(Math.random() * 5)]}`,
                status: i === 0 ? model.status : 'retired',
                immutable: true,
            });
        }
        histories[model._id] = versions;
    }
    return histories;
}

// ML metric types
const ML_METRIC_TYPES = ['accuracy', 'precision', 'recall', 'f1_score', 'latency', 'throughput', 'drift_score', 'data_quality'];
// LLM metric types
const LLM_METRIC_TYPES = ['token_usage', 'latency', 'hallucination_rate', 'toxicity_score', 'cost_per_request', 'throughput', 'context_relevance', 'answer_relevance'];

const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];
// Banking-grade: OPEN -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED
const ALERT_STATUSES = ['open', 'acknowledged', 'investigating', 'resolved'];
// Backward compatibility: 'active' maps to 'open'
const ALERT_STATUS_ALIAS = { active: 'open' };

// Valid state transitions (strict)
const VALID_TRANSITIONS = {
    open: ['acknowledged'],
    acknowledged: ['investigating'],
    investigating: ['resolved'],
};

// Source systems for data lineage
const SOURCE_SYSTEMS = ['kafka-stream-prod', 'batch-etl-dwh', 'api-gateway-west', 'api-gateway-east', 'event-bus-core', 'datalake-s3'];
const AGGREGATION_METHODS = ['raw', 'avg_1m', 'avg_5m', 'p95_1m', 'sum_1h', 'median_5m'];
const RETENTION_POLICIES = ['30d', '90d', '180d', '365d', '7y'];

// --------------- Generate Time-Series Metrics (Random Walk) ---------------

// Helper to get bounded random walk value
function walkValue(current, min, max, volatility) {
    const delta = (Math.random() - 0.5) * volatility;
    let next = current + delta;
    if (next < min) next = min + (min - next);
    if (next > max) next = max - (next - max);
    return next;
}

function generateMetrics() {
    const metrics = [];
    const nowMs = Date.now();
    const hoursBack = 72; // 3 days of data

    for (const model of ALL_MODELS) {
        const metricTypes = model.type === 'ml' ? ML_METRIC_TYPES : LLM_METRIC_TYPES;
        // Use defined baseline or defaults
        const baselines = model.baselines || {};

        for (const type of metricTypes) {
            const sourceSystem = SOURCE_SYSTEMS[Math.floor(Math.random() * SOURCE_SYSTEMS.length)];
            const aggregationMethod = AGGREGATION_METHODS[Math.floor(Math.random() * AGGREGATION_METHODS.length)];
            const retentionPolicy = RETENTION_POLICIES[Math.floor(Math.random() * RETENTION_POLICIES.length)];

            // Initialize current value based on baseline or defaults
            let currentValue = baselines[type];
            if (currentValue === undefined) {
                // Generics defaults if no baseline set
                switch (type) {
                    case 'accuracy': currentValue = 0.85; break;
                    case 'precision': currentValue = 0.82; break;
                    case 'recall': currentValue = 0.80; break;
                    case 'f1_score': currentValue = 0.81; break;
                    case 'latency': currentValue = 100; break;
                    case 'throughput': currentValue = 500; break;
                    case 'drift_score': currentValue = 0.1; break;
                    case 'data_quality': currentValue = 0.95; break;
                    case 'token_usage': currentValue = 1000; break;
                    case 'hallucination_rate': currentValue = 0.05; break;
                    case 'toxicity_score': currentValue = 0.01; break;
                    case 'cost_per_request': currentValue = 0.005; break;
                    case 'context_relevance': currentValue = 0.8; break;
                    case 'answer_relevance': currentValue = 0.85; break;
                    default: currentValue = 50;
                }
            }

            // Define volatility (how much it can change per step) and bounds
            let volatility = currentValue * 0.05; // 5% shift max
            let min = 0;
            let max = 1;

            if (['latency', 'throughput', 'token_usage'].includes(type)) {
                volatility = currentValue * 0.15; // Higher volatility for counts/latency
                max = 10000;
            } else if (['cost_per_request'].includes(type)) {
                volatility = 0.001;
                max = 1;
            }

            // Generate history walking forward
            for (let h = hoursBack; h >= 0; h--) {
                const timestamp = new Date(nowMs - h * 3600000);

                // Apply random walk for next value
                currentValue = walkValue(currentValue, min, max, volatility);

                metrics.push({
                    _id: generateId(),
                    modelId: model._id,
                    type,
                    value: Math.round(currentValue * 10000) / 10000,
                    timestamp,
                    environment: model.environment,
                    // Data lineage fields
                    source_system: sourceSystem,
                    ingestion_time: new Date(timestamp.getTime() - Math.random() * 60000),
                    aggregation_method: aggregationMethod,
                    retention_policy: retentionPolicy,
                });
            }
        }
    }
    return metrics;
}

// --------------- Generate Alerts (with evidence + state history) ---------------

function generateAlerts() {
    const alerts = [];
    const messages = [
        { title: 'Accuracy Drop Detected', message: 'Model accuracy dropped below 90% threshold', severity: 'critical', rule: 'accuracy < 0.90', metric_name: 'accuracy', threshold: 0.90, operator: '<' },
        { title: 'High Latency Warning', message: 'P95 latency exceeded 200ms for 15 minutes', severity: 'high', rule: 'latency_p95 > 200', metric_name: 'latency', threshold: 200, operator: '>' },
        { title: 'Data Drift Detected', message: 'Feature drift score exceeded acceptable range', severity: 'high', rule: 'drift_score > 0.25', metric_name: 'drift_score', threshold: 0.25, operator: '>' },
        { title: 'Throughput Degradation', message: 'Model throughput dropped below baseline', severity: 'medium', rule: 'throughput < 500', metric_name: 'throughput', threshold: 500, operator: '<' },
        { title: 'Hallucination Spike', message: 'Hallucination rate increased above 10%', severity: 'critical', rule: 'hallucination_rate > 0.10', metric_name: 'hallucination_rate', threshold: 0.10, operator: '>' },
        { title: 'Token Usage Anomaly', message: 'Token consumption 3x above daily average', severity: 'medium', rule: 'token_usage > 3x_avg', metric_name: 'token_usage', threshold: 3000, operator: '>' },
        { title: 'Toxicity Alert', message: 'Toxicity score exceeded safety threshold', severity: 'critical', rule: 'toxicity_score > 0.03', metric_name: 'toxicity_score', threshold: 0.03, operator: '>' },
        { title: 'Cost Overrun', message: 'Per-request cost exceeds budget threshold', severity: 'high', rule: 'cost_per_request > 0.008', metric_name: 'cost_per_request', threshold: 0.008, operator: '>' },
        { title: 'Data Quality Issue', message: 'Input data quality score below acceptable level', severity: 'medium', rule: 'data_quality < 0.93', metric_name: 'data_quality', threshold: 0.93, operator: '<' },
        { title: 'Model Staleness', message: 'Model has not been retrained in 90+ days', severity: 'low', rule: 'days_since_retrain > 90', metric_name: 'days_since_retrain', threshold: 90, operator: '>' },
    ];

    for (let i = 0; i < 45; i++) {
        const template = messages[i % messages.length];
        const model = ALL_MODELS[Math.floor(Math.random() * ALL_MODELS.length)];
        const hoursAgo = Math.floor(Math.random() * 168); // within a week
        const createdAt = new Date(Date.now() - hoursAgo * 3600000);
        const isResolved = Math.random() > 0.4;
        const isInvestigating = !isResolved && Math.random() > 0.5;
        const isAcknowledged = !isResolved && !isInvestigating && Math.random() > 0.5;

        let status;
        if (isResolved) status = 'resolved';
        else if (isInvestigating) status = 'investigating';
        else if (isAcknowledged) status = 'acknowledged';
        else status = 'open';

        // Generate observed value (slightly beyond threshold to simulate breach)
        let observedValue;
        if (template.operator === '<') {
            observedValue = template.threshold * (0.85 + Math.random() * 0.1);
        } else {
            observedValue = template.threshold * (1.05 + Math.random() * 0.3);
        }
        observedValue = Math.round(observedValue * 10000) / 10000;

        // Build evidence snapshot (immutable)
        const evidence = {
            trigger_type: 'RULE',
            rule_id: `RULE_${template.metric_name.toUpperCase()}_${i}`,
            rule_description: template.message,
            metric_name: template.metric_name,
            threshold: template.threshold,
            operator: template.operator,
            observed_value: observedValue,
            evaluation_window: '15m',
            timestamp: createdAt,
            _immutable: true,
        };

        // Build state history
        const stateHistory = [
            { previous_state: null, new_state: 'open', user_id: 'system', timestamp: createdAt, comment: 'Alert triggered by rule evaluation' },
        ];
        if (status === 'acknowledged' || status === 'investigating' || status === 'resolved') {
            stateHistory.push({
                previous_state: 'open',
                new_state: 'acknowledged',
                user_id: USERS[1]._id,
                user_name: USERS[1].name,
                timestamp: new Date(createdAt.getTime() + Math.random() * 1800000),
                comment: 'Acknowledged — reviewing alert details',
            });
        }
        if (status === 'investigating' || status === 'resolved') {
            stateHistory.push({
                previous_state: 'acknowledged',
                new_state: 'investigating',
                user_id: USERS[1]._id,
                user_name: USERS[1].name,
                timestamp: new Date(createdAt.getTime() + 1800000 + Math.random() * 3600000),
                comment: 'Investigation started — checking root cause',
            });
        }
        if (status === 'resolved') {
            stateHistory.push({
                previous_state: 'investigating',
                new_state: 'resolved',
                user_id: USERS[0]._id,
                user_name: USERS[0].name,
                timestamp: new Date(createdAt.getTime() + 5400000 + Math.random() * 3600000),
                comment: 'Root cause identified and mitigated. Threshold adjusted.',
            });
        }

        alerts.push({
            _id: generateId(),
            modelId: model._id,
            modelName: model.name,
            title: template.title,
            message: template.message,
            severity: template.severity,
            rule: template.rule,
            status,
            evidence,
            stateHistory,
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
        { action: 'MODEL_REGISTERED', details: 'New model registered in registry' },
        { action: 'MODEL_APPROVED', details: 'Model approved for production deployment' },
        { action: 'INCIDENT_CREATED', details: 'New incident created from alert group' },
        { action: 'INCIDENT_CLOSED', details: 'Incident closed with root cause analysis' },
        { action: 'SLO_BREACH', details: 'SLO target breached — error budget consumed' },
        { action: 'REPORT_GENERATED', details: 'Regulatory compliance report generated' },
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
            _immutable: true,
        });
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// --------------- Generate Incidents ---------------

function generateIncidents(alerts) {
    const incidents = [];
    const openAlerts = alerts.filter(a => a.status !== 'resolved');
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

    // Create 5 incidents
    const incidentTemplates = [
        { title: 'Fraud Model Accuracy Degradation', severity: 'critical', status: 'open', root_cause: null },
        { title: 'High Latency Across Production Models', severity: 'high', status: 'open', root_cause: null },
        { title: 'Data Quality Pipeline Failure', severity: 'medium', status: 'closed', root_cause: 'ETL pipeline timeout due to upstream data source delay. Fixed by increasing connection pool and timeout settings.' },
        { title: 'Hallucination Rate Spike in Support Bot', severity: 'critical', status: 'closed', root_cause: 'Context window overflow due to increased conversation length. Fixed by implementing conversation truncation and summarization.' },
        { title: 'Cost Overrun on LLM Inference', severity: 'medium', status: 'open', root_cause: null },
    ];

    for (let i = 0; i < incidentTemplates.length; i++) {
        const tmpl = incidentTemplates[i];
        const startTime = new Date(Date.now() - (48 + i * 24) * 3600000);
        const endTime = tmpl.status === 'closed' ? new Date(startTime.getTime() + (6 + Math.random() * 18) * 3600000) : null;

        // Link 2-4 alerts
        const sourceAlerts = tmpl.status === 'closed' ? resolvedAlerts : openAlerts;
        const linkedAlerts = sourceAlerts.slice(i * 3, i * 3 + 2 + Math.floor(Math.random() * 3)).map(a => a._id);

        const timeline = [
            { timestamp: startTime, event: 'Incident Created', user: USERS[0].name, details: `Incident opened: ${tmpl.title}` },
            { timestamp: new Date(startTime.getTime() + 1800000), event: 'Alert Linked', user: USERS[1].name, details: `${linkedAlerts.length} related alerts linked` },
            { timestamp: new Date(startTime.getTime() + 3600000), event: 'Investigation Started', user: USERS[1].name, details: 'Investigating root cause' },
        ];

        if (tmpl.status === 'closed') {
            timeline.push(
                { timestamp: new Date(startTime.getTime() + 5 * 3600000), event: 'Root Cause Identified', user: USERS[1].name, details: 'Root cause analysis complete' },
                { timestamp: endTime, event: 'Incident Closed', user: USERS[0].name, details: 'Incident resolved and closed' },
            );
        }

        incidents.push({
            _id: generateId(),
            title: tmpl.title,
            severity: tmpl.severity,
            status: tmpl.status,
            linked_alerts: linkedAlerts,
            start_time: startTime,
            end_time: endTime,
            timeline,
            root_cause: tmpl.root_cause,
            mitigation_steps: tmpl.root_cause ? 'See root cause analysis for mitigation details. Follow-up actions assigned.' : null,
            approved_by: tmpl.status === 'closed' ? USERS[0].name : null,
            created_by: USERS[0].name,
            createdAt: startTime,
            updatedAt: endTime || new Date(),
        });
    }

    return incidents;
}

// --------------- Generate SLOs ---------------

function generateSLOs() {
    const slos = [];
    const templates = [
        { service: 'Fraud Detection API', metric: 'availability', target: 99.95, evaluation_window: '30d', unit: '%' },
        { service: 'Fraud Detection API', metric: 'latency_p99', target: 200, evaluation_window: '30d', unit: 'ms' },
        { service: 'Credit Risk API', metric: 'availability', target: 99.9, evaluation_window: '30d', unit: '%' },
        { service: 'LLM Inference Gateway', metric: 'error_rate', target: 0.5, evaluation_window: '7d', unit: '%' },
        { service: 'LLM Inference Gateway', metric: 'latency_p95', target: 500, evaluation_window: '7d', unit: 'ms' },
        { service: 'Data Pipeline', metric: 'freshness', target: 99.0, evaluation_window: '24h', unit: '%' },
        { service: 'Model Registry API', metric: 'availability', target: 99.99, evaluation_window: '30d', unit: '%' },
    ];

    for (const tmpl of templates) {
        const errorBudget = 100 - tmpl.target;
        const burnRate = 0.1 + Math.random() * 0.9;
        const currentValue = tmpl.metric === 'error_rate'
            ? tmpl.target * (0.5 + Math.random() * 0.8)
            : tmpl.metric.includes('latency')
                ? tmpl.target * (0.6 + Math.random() * 0.5)
                : tmpl.target - (Math.random() * errorBudget * 1.5);

        const isBreached = tmpl.metric === 'error_rate'
            ? currentValue > tmpl.target
            : tmpl.metric.includes('latency')
                ? currentValue > tmpl.target
                : currentValue < tmpl.target;

        slos.push({
            _id: generateId(),
            service_id: tmpl.service.toLowerCase().replace(/\s+/g, '-'),
            service_name: tmpl.service,
            metric: tmpl.metric,
            metric_unit: tmpl.unit,
            target: tmpl.target,
            current_value: Math.round(currentValue * 100) / 100,
            evaluation_window: tmpl.evaluation_window,
            error_budget: Math.round(errorBudget * 100) / 100,
            error_budget_remaining: Math.max(0, Math.round((errorBudget * (1 - burnRate)) * 100) / 100),
            current_burn_rate: Math.round(burnRate * 100) / 100,
            status: isBreached ? 'breached' : burnRate > 0.8 ? 'at_risk' : 'healthy',
            linked_alerts: [],
            linked_incidents: [],
            createdAt: new Date(Date.now() - 90 * 86400000),
            updatedAt: new Date(),
        });
    }

    return slos;
}

// --------------- Sensitive field masking ---------------

const SENSITIVE_FIELDS = ['ipAddress', 'email', 'password'];
function maskValue(value, field) {
    if (!value) return value;
    if (field === 'ipAddress') return value.replace(/\d+\.\d+$/, 'xxx.xxx');
    if (field === 'email') {
        const [local, domain] = String(value).split('@');
        return `${local.slice(0, 2)}***@${domain}`;
    }
    return '***MASKED***';
}

// ============= MOCK STORE =============

class MockStore {
    constructor() {
        this.users = [...USERS];
        this.models = [...ALL_MODELS];
        this.versionHistory = generateVersionHistory();
        this.metrics = generateMetrics();
        this.alerts = generateAlerts();
        this.auditLogs = generateAuditLogs();
        this.incidents = generateIncidents(this.alerts);
        this.slos = generateSLOs();

        // Link some alerts/incidents to SLOs
        for (const slo of this.slos) {
            const relAlerts = this.alerts
                .filter(a => a.status !== 'resolved')
                .slice(0, Math.floor(Math.random() * 3));
            slo.linked_alerts = relAlerts.map(a => a._id);
        }

        console.log(`[MockStore] Initialized: ${this.users.length} users, ${this.models.length} models, ${this.metrics.length} metrics, ${this.alerts.length} alerts, ${this.auditLogs.length} audit logs, ${this.incidents.length} incidents, ${this.slos.length} SLOs`);
    }

    // --- Users ---
    findUserByEmail(email) {
        return this.users.find(u => u.email === email) || null;
    }

    findUserById(id) {
        return this.users.find(u => u._id === id) || null;
    }

    // --- Models (Model Registry) ---
    getModels(filters = {}) {
        let result = [...this.models];
        if (filters.type) result = result.filter(m => m.type === filters.type);
        if (filters.environment) result = result.filter(m => m.environment === filters.environment);
        if (filters.status) result = result.filter(m => m.status === filters.status);
        if (filters.risk_tier) result = result.filter(m => m.risk_tier === filters.risk_tier);
        if (filters.deployment_env) result = result.filter(m => m.deployment_env === filters.deployment_env);
        if (filters.business_unit) result = result.filter(m => m.business_unit === filters.business_unit);
        return result;
    }

    getModelById(id) {
        return this.models.find(m => m._id === id) || null;
    }

    registerModel(data) {
        const model = {
            _id: generateId(),
            name: data.name,
            type: data.type || 'ml',
            model_type: data.model_type || 'ML',
            environment: data.environment || 'staging',
            deployment_env: data.deployment_env || 'dev',
            status: 'paused', // Must be approved to become active
            description: data.description || '',
            version: data.version || '0.1.0',
            use_case: data.use_case || '',
            business_unit: data.business_unit || '',
            risk_tier: data.risk_tier || 'Low',
            owner: data.owner || '',
            approved_by: null,
            approval_date: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.models.push(model);
        this.versionHistory[model._id] = [{
            _id: generateId(),
            version: model.version,
            created_at: new Date(),
            created_by: data.owner || 'system',
            change_summary: 'Initial registration',
            status: 'paused',
            immutable: true,
        }];
        return model;
    }

    approveModel(id, approvedBy) {
        const model = this.getModelById(id);
        if (!model) return null;
        model.approved_by = approvedBy;
        model.approval_date = new Date();
        model.status = 'active';
        model.updatedAt = new Date();
        return model;
    }

    updateModel(id, data) {
        const model = this.getModelById(id);
        if (!model) return null;
        // Only allow updating non-immutable fields
        const allowed = ['description', 'use_case', 'business_unit', 'risk_tier', 'owner', 'deployment_env', 'status'];
        for (const key of allowed) {
            if (data[key] !== undefined) model[key] = data[key];
        }
        model.updatedAt = new Date();

        // If version changed, create new version entry (immutable versions)
        if (data.version && data.version !== model.version) {
            model.version = data.version;
            if (!this.versionHistory[id]) this.versionHistory[id] = [];
            this.versionHistory[id].push({
                _id: generateId(),
                version: data.version,
                created_at: new Date(),
                created_by: data.updated_by || 'system',
                change_summary: data.change_summary || 'Version update',
                status: model.status,
                immutable: true,
            });
        }
        return model;
    }

    getVersionHistory(modelId) {
        return this.versionHistory[modelId] || [];
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

    getLastMetric(modelId, type) {
        return this.metrics
            .filter(m => m.modelId === modelId && m.type === type)
            .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
    }

    addMetric(metric) {
        const entry = {
            _id: generateId(),
            ...metric,
            timestamp: new Date(),
            source_system: metric.source_system || 'api-ingest',
            ingestion_time: new Date(),
            aggregation_method: metric.aggregation_method || 'raw',
            retention_policy: metric.retention_policy || '90d',
        };
        this.metrics.push(entry);
        return entry;
    }

    getMetricLineage(modelId, metricType) {
        const sample = this.metrics.find(m => m.modelId === modelId && m.type === metricType);
        if (!sample) return null;
        return {
            metric_id: sample._id,
            metric_type: metricType,
            modelId,
            source_system: sample.source_system,
            ingestion_time: sample.ingestion_time,
            aggregation_method: sample.aggregation_method,
            retention_policy: sample.retention_policy,
            environment: sample.environment,
            total_data_points: this.metrics.filter(m => m.modelId === modelId && m.type === metricType).length,
            earliest: this.metrics.filter(m => m.modelId === modelId && m.type === metricType).sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp,
            latest: this.metrics.filter(m => m.modelId === modelId && m.type === metricType).sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp,
        };
    }

    // --- Alerts ---
    getAlerts(filters = {}) {
        let result = [...this.alerts];
        if (filters.status) {
            const normalizedStatus = ALERT_STATUS_ALIAS[filters.status] || filters.status;
            // Support 'active' as alias for 'open' for backward compat
            if (normalizedStatus === 'active' || normalizedStatus === 'open') {
                result = result.filter(a => a.status === 'open');
            } else {
                result = result.filter(a => a.status === normalizedStatus);
            }
        }
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
            (a.status === 'open' || a.status === 'active')
        );
        if (existing) return existing;

        const entry = {
            _id: generateId(),
            ...alert,
            status: 'open',
            evidence: alert.evidence || null,
            stateHistory: [{
                previous_state: null,
                new_state: 'open',
                user_id: 'system',
                timestamp: new Date(),
                comment: 'Alert triggered by rule evaluation',
            }],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alerts.unshift(entry);
        return entry;
    }

    // Strict state machine transition
    transitionAlertState(id, newState, userId, userName, comment) {
        const alert = this.alerts.find(a => a._id === id);
        if (!alert) return { error: 'Alert not found' };

        const currentState = alert.status;
        const validNext = VALID_TRANSITIONS[currentState];
        if (!validNext || !validNext.includes(newState)) {
            return { error: `Invalid transition: ${currentState} → ${newState}. Valid: ${(validNext || []).join(', ') || 'none'}` };
        }

        // Mandatory comment on resolve
        if (newState === 'resolved' && (!comment || !comment.trim())) {
            return { error: 'Comment is mandatory when resolving an alert' };
        }

        alert.status = newState;
        alert.updatedAt = new Date();
        if (newState === 'resolved') {
            alert.resolvedAt = new Date();
            alert.resolvedBy = userId;
        }
        if (newState === 'acknowledged') {
            alert.assignedTo = userId;
        }

        if (!alert.stateHistory) alert.stateHistory = [];
        alert.stateHistory.push({
            previous_state: currentState,
            new_state: newState,
            user_id: userId,
            user_name: userName,
            timestamp: new Date(),
            comment: comment || '',
        });

        return alert;
    }

    resolveAlert(id, userId, comment) {
        return this.transitionAlertState(id, 'resolved', userId, '', comment || 'Resolved');
    }

    acknowledgeAlert(id, userId) {
        return this.transitionAlertState(id, 'acknowledged', userId, '', 'Acknowledged');
    }

    investigateAlert(id, userId, userName, comment) {
        return this.transitionAlertState(id, 'investigating', userId, userName, comment || 'Investigation started');
    }

    getActiveAlertCount() {
        return this.alerts.filter(a => a.status === 'open' || a.status === 'active').length;
    }

    getAlertEvidence(id) {
        const alert = this.alerts.find(a => a._id === id);
        if (!alert) return null;
        return alert.evidence || null;
    }

    getAlertHistory(id) {
        const alert = this.alerts.find(a => a._id === id);
        if (!alert) return null;
        return alert.stateHistory || [];
    }

    // --- Incidents ---
    getIncidents(filters = {}) {
        let result = [...this.incidents];
        if (filters.status) result = result.filter(i => i.status === filters.status);
        if (filters.severity) result = result.filter(i => i.severity === filters.severity);

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const total = result.length;
        return {
            data: result.slice((page - 1) * limit, page * limit),
            total, page, limit,
            pages: Math.ceil(total / limit),
        };
    }

    getIncidentById(id) {
        return this.incidents.find(i => i._id === id) || null;
    }

    createIncident(data) {
        const incident = {
            _id: generateId(),
            title: data.title,
            severity: data.severity || 'medium',
            status: 'open',
            linked_alerts: data.linked_alerts || [],
            start_time: new Date(),
            end_time: null,
            timeline: [{
                timestamp: new Date(),
                event: 'Incident Created',
                user: data.created_by || 'system',
                details: `Incident opened: ${data.title}`,
            }],
            root_cause: null,
            mitigation_steps: null,
            approved_by: null,
            created_by: data.created_by || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.incidents.unshift(incident);
        return incident;
    }

    updateIncident(id, data, userName) {
        const incident = this.incidents.find(i => i._id === id);
        if (!incident) return null;

        if (data.root_cause !== undefined) incident.root_cause = data.root_cause;
        if (data.mitigation_steps !== undefined) incident.mitigation_steps = data.mitigation_steps;
        if (data.severity) incident.severity = data.severity;
        if (data.linked_alerts) incident.linked_alerts = data.linked_alerts;

        if (data.timeline_event) {
            incident.timeline.push({
                timestamp: new Date(),
                event: data.timeline_event,
                user: userName || 'system',
                details: data.timeline_details || '',
            });
        }

        incident.updatedAt = new Date();
        return incident;
    }

    closeIncident(id, userId, userName) {
        const incident = this.incidents.find(i => i._id === id);
        if (!incident) return { error: 'Incident not found' };
        if (!incident.root_cause) return { error: 'Root cause analysis is required before closing' };

        incident.status = 'closed';
        incident.end_time = new Date();
        incident.approved_by = userName;
        incident.updatedAt = new Date();
        incident.timeline.push({
            timestamp: new Date(),
            event: 'Incident Closed',
            user: userName,
            details: 'Incident resolved and closed with RCA',
        });
        return incident;
    }

    // --- SLOs ---
    getSLOs(filters = {}) {
        let result = [...this.slos];
        if (filters.status) result = result.filter(s => s.status === filters.status);
        if (filters.service_id) result = result.filter(s => s.service_id === filters.service_id);
        return result;
    }

    getSLOById(id) {
        return this.slos.find(s => s._id === id) || null;
    }

    createSLO(data) {
        const errorBudget = 100 - data.target;
        const slo = {
            _id: generateId(),
            service_id: data.service_id,
            service_name: data.service_name || data.service_id,
            metric: data.metric,
            metric_unit: data.metric_unit || '%',
            target: data.target,
            current_value: data.target,
            evaluation_window: data.evaluation_window || '30d',
            error_budget: Math.round(errorBudget * 100) / 100,
            error_budget_remaining: Math.round(errorBudget * 100) / 100,
            current_burn_rate: 0,
            status: 'healthy',
            linked_alerts: [],
            linked_incidents: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.slos.push(slo);
        return slo;
    }

    updateSLO(id, data) {
        const slo = this.slos.find(s => s._id === id);
        if (!slo) return null;
        if (data.target !== undefined) {
            slo.target = data.target;
            slo.error_budget = Math.round((100 - data.target) * 100) / 100;
        }
        if (data.evaluation_window) slo.evaluation_window = data.evaluation_window;
        slo.updatedAt = new Date();
        return slo;
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
        const entry = { _id: generateId(), ...log, timestamp: new Date(), _immutable: true };
        this.auditLogs.unshift(entry);
        return entry;
    }

    // --- Field Masking ---
    maskSensitiveFields(obj, role) {
        if (role === 'admin') return obj;
        if (!obj || typeof obj !== 'object') return obj;
        const masked = Array.isArray(obj) ? [...obj] : { ...obj };
        for (const field of SENSITIVE_FIELDS) {
            if (masked[field] !== undefined) {
                masked[field] = maskValue(masked[field], field);
            }
        }
        return masked;
    }

    // --- Overview / Risk Score ---
    computeOverview() {
        const activeAlerts = this.getActiveAlertCount();
        const criticalAlerts = this.alerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'critical').length;
        const highAlerts = this.alerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'high').length;

        // Weighted risk score: critical=25, high=15, medium=5, low=1 (max 100)
        // Scaled down to be less sensitive (allowing more alerts before hitting 100)
        const riskRaw = (criticalAlerts * 25) + (highAlerts * 15) +
            (this.alerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'medium').length * 5) +
            (this.alerts.filter(a => (a.status === 'open' || a.status === 'active') && a.severity === 'low').length * 1) +
            15; // Base risk baseline

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

        // SLO health summary
        const sloSummary = {
            total: this.slos.length,
            healthy: this.slos.filter(s => s.status === 'healthy').length,
            at_risk: this.slos.filter(s => s.status === 'at_risk').length,
            breached: this.slos.filter(s => s.status === 'breached').length,
        };

        // Incident summary
        const incidentSummary = {
            total: this.incidents.length,
            open: this.incidents.filter(i => i.status === 'open').length,
            closed: this.incidents.filter(i => i.status === 'closed').length,
        };

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
            sloSummary,
            incidentSummary,
            lastUpdated: new Date().toISOString(),
        };
    }

    // --- Reports ---
    generateModelInventoryReport(filters = {}) {
        let models = this.getModels(filters);
        return models.map(m => ({
            model_id: m._id,
            model_name: m.name,
            model_type: m.model_type,
            version: m.version,
            use_case: m.use_case,
            business_unit: m.business_unit,
            risk_tier: m.risk_tier,
            owner: m.owner,
            approved_by: m.approved_by || 'Pending',
            approval_date: m.approval_date ? m.approval_date.toISOString() : 'N/A',
            deployment_env: m.deployment_env,
            status: m.status,
            created_at: m.createdAt.toISOString(),
        }));
    }

    generateAlertIncidentSummary(filters = {}) {
        let alerts = [...this.alerts];
        if (filters.startDate) alerts = alerts.filter(a => a.createdAt >= new Date(filters.startDate));
        if (filters.endDate) alerts = alerts.filter(a => a.createdAt <= new Date(filters.endDate));

        const summary = {
            total_alerts: alerts.length,
            by_status: {
                open: alerts.filter(a => a.status === 'open').length,
                acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
                investigating: alerts.filter(a => a.status === 'investigating').length,
                resolved: alerts.filter(a => a.status === 'resolved').length,
            },
            by_severity: {
                critical: alerts.filter(a => a.severity === 'critical').length,
                high: alerts.filter(a => a.severity === 'high').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                low: alerts.filter(a => a.severity === 'low').length,
            },
            total_incidents: this.incidents.length,
            open_incidents: this.incidents.filter(i => i.status === 'open').length,
            avg_resolution_time: this._calcAvgResolutionTime(alerts),
            alerts: alerts.map(a => ({
                alert_id: a._id,
                title: a.title,
                severity: a.severity,
                status: a.status,
                model: a.modelName,
                rule: a.rule,
                created_at: a.createdAt.toISOString(),
                resolved_at: a.resolvedAt ? a.resolvedAt.toISOString() : 'N/A',
            })),
        };
        return summary;
    }

    generateSLABreachReport(filters = {}) {
        const slos = this.slos.filter(s => s.status === 'breached' || s.status === 'at_risk');
        return {
            total_breaches: slos.filter(s => s.status === 'breached').length,
            total_at_risk: slos.filter(s => s.status === 'at_risk').length,
            slos: slos.map(s => ({
                service: s.service_name,
                metric: s.metric,
                target: s.target,
                current_value: s.current_value,
                error_budget_remaining: s.error_budget_remaining,
                burn_rate: s.current_burn_rate,
                status: s.status,
                evaluation_window: s.evaluation_window,
            })),
        };
    }

    generateGovernanceReport(filters = {}) {
        const logs = this.getAuditLogs({ ...filters, limit: 10000 });
        const actionCounts = {};
        for (const l of logs.data) {
            actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
        }
        return {
            total_events: logs.total,
            period: { start: filters.startDate || 'all', end: filters.endDate || 'all' },
            by_action: actionCounts,
            by_role: {
                admin: logs.data.filter(l => l.userRole === 'admin').length,
                analyst: logs.data.filter(l => l.userRole === 'analyst').length,
                viewer: logs.data.filter(l => l.userRole === 'viewer').length,
            },
            recent_events: logs.data.slice(0, 50).map(l => ({
                timestamp: l.timestamp.toISOString(),
                action: l.action,
                user: l.userName,
                role: l.userRole,
                details: l.details,
                model: l.modelName || 'N/A',
            })),
        };
    }

    _calcAvgResolutionTime(alerts) {
        const resolved = alerts.filter(a => a.resolvedAt);
        if (resolved.length === 0) return 'N/A';
        const totalMs = resolved.reduce((sum, a) => sum + (new Date(a.resolvedAt) - new Date(a.createdAt)), 0);
        const avgHours = Math.round(totalMs / resolved.length / 3600000 * 10) / 10;
        return `${avgHours}h`;
    }
}

// Singleton
const store = new MockStore();
export default store;
