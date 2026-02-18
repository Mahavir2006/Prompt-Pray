import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Demo accounts for client-side fallback when no backend is available
const DEMO_USERS = {
    'admin@observability.ai': { id: 'usr_admin_001', email: 'admin@observability.ai', name: 'Admin User', role: 'admin' },
    'analyst@observability.ai': { id: 'usr_analyst_001', email: 'analyst@observability.ai', name: 'Analyst User', role: 'analyst' },
    'viewer@observability.ai': { id: 'usr_viewer_001', email: 'viewer@observability.ai', name: 'Viewer User', role: 'viewer' },
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('obs_token'));
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('obs_token');
        const savedUser = localStorage.getItem('obs_user');
        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            // Try the real API first
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('obs_token', data.token);
            localStorage.setItem('obs_user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            return data;
        } catch (apiError) {
            // Fallback: demo mode when no backend is available
            const demoUser = DEMO_USERS[email];
            if (demoUser && password === 'password123') {
                const demoToken = 'demo_' + btoa(JSON.stringify({ id: demoUser.id, email: demoUser.email, role: demoUser.role }));
                localStorage.setItem('obs_token', demoToken);
                localStorage.setItem('obs_user', JSON.stringify(demoUser));
                setToken(demoToken);
                setUser(demoUser);
                return { token: demoToken, user: demoUser };
            }
            throw new Error('Invalid credentials');
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('obs_token');
        localStorage.removeItem('obs_user');
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
