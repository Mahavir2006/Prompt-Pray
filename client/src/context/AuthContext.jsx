import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

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
        const res = await fetch('/api/auth/login', {
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
