// Base URL: empty for local dev (Vite proxy), set VITE_API_URL for production
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
console.log('[API] BASE_URL:', BASE_URL);

// Centralized API helper with auth headers
const getHeaders = () => {
    const token = localStorage.getItem('obs_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

async function request(url, options = {}) {
    let res;
    try {
        res = await fetch(`${BASE_URL}${url}`, {
            ...options,
            headers: { ...getHeaders(), ...options.headers },
        });
    } catch (networkError) {
        // Network failure (server down, CORS blocked, no internet)
        throw new Error('Network error — unable to reach the server');
    }

    if (res.status === 401) {
        // Only force-logout for real tokens; demo tokens should not redirect
        const token = localStorage.getItem('obs_token');
        if (token && !token.startsWith('demo_')) {
            localStorage.removeItem('obs_token');
            localStorage.removeItem('obs_user');
            window.location.href = '/login';
        }
        throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth
export const authAPI = {
    login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/api/auth/me'),
    refresh: () => request('/api/auth/refresh', { method: 'POST' }),
};

// Overview
export const overviewAPI = {
    get: () => request('/api/overview'),
};

// Models (Model Registry)
export const modelsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/models${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/models/${id}`),
    register: (data) => request('/api/models', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    approve: (id) => request(`/api/models/${id}/approve`, { method: 'PATCH' }),
    versions: (id) => request(`/api/models/${id}/versions`),
};

// Metrics
export const metricsAPI = {
    get: (modelId, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/metrics/${modelId}${qs ? '?' + qs : ''}`);
    },
    ingest: (data) => request('/api/metrics/ingest', { method: 'POST', body: JSON.stringify(data) }),
    lineage: (modelId, type) => request(`/api/metrics/${modelId}/lineage?type=${type}`),
};

// Alerts (with state machine + evidence)
export const alertsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/alerts${qs ? '?' + qs : ''}`);
    },
    stats: () => request('/api/alerts/stats'),
    get: (id) => request(`/api/alerts/${id}`),
    acknowledge: (id) => request(`/api/alerts/${id}/acknowledge`, { method: 'PATCH' }),
    investigate: (id, comment) => request(`/api/alerts/${id}/investigate`, { method: 'PATCH', body: JSON.stringify({ comment }) }),
    resolve: (id, comment) => request(`/api/alerts/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ comment }) }),
    evidence: (id) => request(`/api/alerts/${id}/evidence`),
    history: (id) => request(`/api/alerts/${id}/history`),
};

// Incidents
export const incidentsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/incidents${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/incidents/${id}`),
    create: (data) => request('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    close: (id) => request(`/api/incidents/${id}/close`, { method: 'PATCH' }),
    exportCSV: (id) => request(`/api/incidents/${id}/export`),
};

// SLOs
export const sloAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/slos${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/slos/${id}`),
    create: (data) => request('/api/slos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/slos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Reports
export const reportsAPI = {
    modelInventory: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/reports/model-inventory${qs ? '?' + qs : ''}`);
    },
    alertIncidentSummary: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/reports/alert-incident-summary${qs ? '?' + qs : ''}`);
    },
    slaBreach: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/reports/sla-breach${qs ? '?' + qs : ''}`);
    },
    governanceActivity: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/reports/governance-activity${qs ? '?' + qs : ''}`);
    },
};

// Governance
export const governanceAPI = {
    logs: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/governance/logs${qs ? '?' + qs : ''}`);
    },
    actions: () => request('/api/governance/actions'),
    export: (data) => request('/api/governance/export', { method: 'POST', body: JSON.stringify(data) }),
    sensitiveAccess: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/governance/sensitive-access${qs ? '?' + qs : ''}`);
    },
};

// Loan Prediction ML API
export const loanAPI = {
    predict: (data) => request('/api/loan/predict', { method: 'POST', body: JSON.stringify(data) }),
    predictBatch: (applications) => request('/api/loan/predict/batch', { method: 'POST', body: JSON.stringify({ applications }) }),
    modelInfo: () => request('/api/loan/model/info'),
    modelSummary: () => request('/api/loan/model/summary'),
    health: () => request('/api/loan/health'),
    train: () => request('/api/loan/train', { method: 'POST' }),
};
