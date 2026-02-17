import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
    const { login } = useAuth();
    const { isDark } = useTheme();
    const [email, setEmail] = useState('admin@observability.ai');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4"
                        style={{
                            background: isDark
                                ? 'linear-gradient(135deg, #d4a017, #b8860b)'
                                : 'linear-gradient(135deg, #6f5b3e, #5a4a32)',
                            color: isDark ? '#0d0d0d' : '#fef9c3',
                            boxShadow: `0 8px 24px ${isDark ? 'rgba(212,160,23,0.25)' : 'rgba(111,91,62,0.2)'}`,
                        }}
                    >
                        AI
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AI Observability Platform</h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Enterprise-grade ML & LLM monitoring</p>
                </div>

                {/* Login Form */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: 'var(--bg-input)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)',
                                    '--tw-ring-color': 'var(--accent-primary)',
                                }}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: 'var(--bg-input)',
                                    border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)',
                                    '--tw-ring-color': 'var(--accent-primary)',
                                }}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full font-medium py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, #d4a017, #b8860b)'
                                    : 'linear-gradient(135deg, #6f5b3e, #5a4a32)',
                                color: isDark ? '#0d0d0d' : '#fef9c3',
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Demo credentials */}
                    <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                        <p className="text-xs text-center mb-3" style={{ color: 'var(--text-faint)' }}>Demo Accounts</p>
                        <div className="space-y-2">
                            {[
                                { email: 'admin@observability.ai', role: 'Admin' },
                                { email: 'analyst@observability.ai', role: 'Analyst' },
                                { email: 'viewer@observability.ai', role: 'Viewer' },
                            ].map((account) => (
                                <button
                                    key={account.email}
                                    onClick={() => { setEmail(account.email); setPassword('password123'); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(26,26,26,0.5)' : 'rgba(250,240,224,0.5)',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <span>{account.email}</span>
                                    <span
                                        className="px-2 py-0.5 rounded"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(56,56,56,0.5)' : 'rgba(232,213,181,0.5)',
                                            color: 'var(--text-faint)',
                                        }}
                                    >
                                        {account.role}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
