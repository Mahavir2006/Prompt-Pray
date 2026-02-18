// Base URL: empty for local dev (Vite proxy), set VITE_API_URL for production
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
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
    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: { ...getHeaders(), ...options.headers },
    });

    if (res.status === 401) {
        localStorage.removeItem('obs_token');
        localStorage.removeItem('obs_user');
        window.location.href = '/login';
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

// Models
export const modelsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/models${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/models/${id}`),
};

// Metrics
export const metricsAPI = {
    get: (modelId, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/metrics/${modelId}${qs ? '?' + qs : ''}`);
    },
    ingest: (data) => request('/api/metrics/ingest', { method: 'POST', body: JSON.stringify(data) }),
};

// Alerts
export const alertsAPI = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/alerts${qs ? '?' + qs : ''}`);
    },
    stats: () => request('/api/alerts/stats'),
    get: (id) => request(`/api/alerts/${id}`),
    resolve: (id) => request(`/api/alerts/${id}/resolve`, { method: 'PATCH' }),
    acknowledge: (id) => request(`/api/alerts/${id}/acknowledge`, { method: 'PATCH' }),
};

// Governance
export const governanceAPI = {
    logs: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`/api/governance/logs${qs ? '?' + qs : ''}`);
    },
    actions: () => request('/api/governance/actions'),
    export: (data) => request('/api/governance/export', { method: 'POST', body: JSON.stringify(data) }),
};
