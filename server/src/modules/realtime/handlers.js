import store from '../../config/mockStore.js';

// Simulated real-time metric generation
let simulationInterval = null;

export function setupRealtimeHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[WS] Client connected: ${socket.id}`);

        // Send initial connection status
        socket.emit('connected', {
            message: 'Connected to AI Observability Platform',
            timestamp: new Date().toISOString(),
        });

        // Handle client subscribing to specific model updates
        socket.on('subscribe:model', (modelId) => {
            socket.join(`model:${modelId}`);
            console.log(`[WS] ${socket.id} subscribed to model:${modelId}`);
        });

        socket.on('unsubscribe:model', (modelId) => {
            socket.leave(`model:${modelId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[WS] Client disconnected: ${socket.id}`);
        });
    });

    // Start metric simulation (emits updates every 10 seconds)
    startMetricSimulation(io);
}

function startMetricSimulation(io) {
    if (simulationInterval) clearInterval(simulationInterval);

    const models = store.getModels();
    const mlMetricTypes = ['accuracy', 'latency', 'throughput', 'drift_score'];
    const llmMetricTypes = ['latency', 'token_usage', 'hallucination_rate', 'cost_per_request'];

    simulationInterval = setInterval(() => {
        // Pick a random model
        const model = models[Math.floor(Math.random() * models.length)];
        const metricTypes = model.type === 'ml' ? mlMetricTypes : llmMetricTypes;
        const type = metricTypes[Math.floor(Math.random() * metricTypes.length)];

        // Get last value for random walk
        const lastMetric = store.getLastMetric(model._id, type);
        let currentValue = lastMetric ? lastMetric.value : 0.5;

        // Define volatility (how much it can change per step) and bounds
        let volatility = currentValue * 0.05; // 5% shift max
        let min = 0;
        let max = 1;

        if (['latency', 'throughput', 'token_usage'].includes(type)) {
            volatility = currentValue * 0.15;
            max = 10000;
        } else if (['cost_per_request'].includes(type)) {
            volatility = 0.001;
            max = 1;
        }

        // Apply random walk
        const delta = (Math.random() - 0.5) * volatility;
        let value = currentValue + delta;

        // Clamp logic
        if (value < min) value = min + (min - value);
        if (value > max) value = max - (value - max);

        value = Math.round(value * 10000) / 10000;

        // Store metric
        const metric = store.addMetric({ modelId: model._id, type, value, environment: model.environment });

        // Emit to all clients
        io.emit('metricUpdate', {
            modelId: model._id,
            modelName: model.name,
            type,
            value,
            timestamp: metric.timestamp,
        });

        // Emit to model-specific room
        io.to(`model:${model._id}`).emit('modelMetricUpdate', {
            type,
            value,
            timestamp: metric.timestamp,
        });

        // Check threshold and potentially create alert
        const alert = checkThreshold(model, type, value);
        if (alert) {
            io.emit('alertCreated', alert);
        }

    }, 10000); // Every 10 seconds

    console.log('[WS] Metric simulation started (10s interval)');
}

function checkThreshold(model, type, value) {
    const rules = {
        accuracy: { op: '<', threshold: 0.89, severity: 'critical' },
        latency: { op: '>', threshold: 190, severity: 'high' },
        drift_score: { op: '>', threshold: 0.28, severity: 'high' },
        hallucination_rate: { op: '>', threshold: 0.12, severity: 'critical' },
        toxicity_score: { op: '>', threshold: 0.03, severity: 'critical' },
        cost_per_request: { op: '>', threshold: 0.009, severity: 'medium' },
    };

    const rule = rules[type];
    if (!rule) return null;

    const breached = rule.op === '<' ? value < rule.threshold : value > rule.threshold;
    if (!breached) return null;

    // Only create alert ~30% of time to avoid flooding
    if (Math.random() > 0.3) return null;

    return store.createAlert({
        modelId: model._id,
        modelName: model.name,
        title: `${type} threshold breach`,
        message: `${type} = ${value} (threshold: ${rule.threshold})`,
        severity: rule.severity,
        rule: `${type} ${rule.op} ${rule.threshold}`,
    });
}

export function stopSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
}
