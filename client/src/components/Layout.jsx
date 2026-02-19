import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { alertsAPI } from '../api';

const navItems = [
    { path: '/dashboard', label: 'Overview', end: true },
    { path: '/dashboard/ml-monitoring', label: 'ML Monitoring' },
    { path: '/dashboard/llm-monitoring', label: 'LLM Monitoring' },
    { path: '/dashboard/alerts', label: 'Alerts' },
    { path: '/dashboard/incidents', label: 'Incidents' },
    { path: '/dashboard/model-registry', label: 'Model Registry' },
    { path: '/dashboard/slo-dashboard', label: 'SLO Dashboard' },
    { path: '/dashboard/reports', label: 'Reports' },
    { path: '/dashboard/governance', label: 'Governance' },
];

// SVG icons (no emojis)
function NavIcon({ name }) {
    const icons = {
        Overview: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
        'ML Monitoring': (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
        'LLM Monitoring': (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
        ),
        Alerts: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
            </svg>
        ),
        Incidents: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        ),
        'Model Registry': (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        ),
        'SLO Dashboard': (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        ),
        Reports: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        ),
        Governance: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        ),
    };
    return icons[name] || null;
}

// Theme Toggle Switch component
function ThemeToggle() {
    const { isDark, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            className={`theme-toggle ${isDark ? 'theme-toggle-dark' : 'theme-toggle-light'}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
        >
            <div className={`theme-toggle-knob ${isDark ? 'theme-toggle-knob-dark' : 'theme-toggle-knob-light'}`}>
                {isDark ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth="2.5">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fef9c3" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                )}
            </div>
        </button>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const { dateRange, environment, dateRangeOptions, updateDateRange, updateEnvironment } = useFilters();
    const { connected } = useSocket();
    const { isDark } = useTheme();

    const { data: alertStats } = useQuery({
        queryKey: ['alertStats'],
        queryFn: alertsAPI.stats,
        refetchInterval: 60000,
    });

    const activeAlerts = alertStats?.active || 0;

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside className="w-64 flex flex-col flex-shrink-0 border-r" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-secondary)' }}>
                {/* Logo */}
                <div className="p-5 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{
                                background: isDark
                                    ? 'linear-gradient(135deg, #d4a017, #b8860b)'
                                    : 'linear-gradient(135deg, #6f5b3e, #5a4a32)',
                                color: isDark ? '#0d0d0d' : '#fef9c3',
                            }}
                        >
                            AI
                        </div>
                        <div>
                            <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                AI Observability
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Enterprise Platform</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200`
                            }
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? (isDark ? 'rgba(212,160,23,0.12)' : 'rgba(111,91,62,0.1)') : 'transparent',
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                border: isActive ? `1px solid ${isDark ? 'rgba(212,160,23,0.2)' : 'rgba(111,91,62,0.15)'}` : '1px solid transparent',
                            })}
                        >
                            <NavIcon name={item.label} />
                            <span>{item.label}</span>
                            {item.label === 'Alerts' && activeAlerts > 0 && (
                                <span
                                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: 'rgba(239,68,68,0.15)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239,68,68,0.25)',
                                    }}
                                >
                                    {activeAlerts}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Connection Status */}
                <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 live-dot' : 'bg-red-500'}`} />
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                            {connected ? 'Real-time connected' : 'Reconnecting...'}
                        </span>
                    </div>
                </div>

                {/* User info */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? 'rgba(212,160,23,0.15)' : 'rgba(111,91,62,0.1)',
                                color: 'var(--accent-primary)',
                            }}
                        >
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                            <p className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="hover:opacity-80 transition-opacity"
                            style={{ color: 'var(--text-faint)' }}
                            title="Logout"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" x2="9" y1="12" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header
                    className="h-14 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 border-b"
                    style={{
                        backgroundColor: isDark ? 'rgba(13,13,13,0.8)' : 'rgba(253,248,240,0.8)',
                        borderColor: 'var(--border-secondary)',
                    }}
                >
                    <div className="flex items-center gap-4">
                        {/* Date Range Filter */}
                        <select
                            value={dateRange.label}
                            onChange={(e) => updateDateRange(e.target.value)}
                            className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)',
                            }}
                        >
                            {dateRangeOptions.map((opt) => (
                                <option key={opt.label} value={opt.label}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Environment Filter */}
                        <select
                            value={environment}
                            onChange={(e) => updateEnvironment(e.target.value)}
                            className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                            style={{
                                backgroundColor: 'var(--bg-input)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)',
                            }}
                        >
                            <option value="all">All Environments</option>
                            <option value="production">Production</option>
                            <option value="staging">Staging</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Alert indicator */}
                        {activeAlerts > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                                style={{
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                                    {activeAlerts} active alerts
                                </span>
                            </div>
                        )}

                        {/* Live indicator */}
                        <div className="flex items-center gap-2">
                            <div className={`live-dot ${!connected ? '!bg-red-500' : ''}`} />
                            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>LIVE</span>
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
