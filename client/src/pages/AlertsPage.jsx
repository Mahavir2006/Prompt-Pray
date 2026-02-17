import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function SeverityBadge({ severity }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium severity-${severity}`}>
            {severity}
        </span>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium status-${status}`}>
            {status}
        </span>
    );
}

function TimeAgo({ date }) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let text;
    if (mins < 1) text = 'just now';
    else if (mins < 60) text = `${mins}m ago`;
    else if (hours < 24) text = `${hours}h ago`;
    else text = `${days}d ago`;
    return <span title={new Date(date).toLocaleString()}>{text}</span>;
}

function AlertPanel({ alert, onClose, onResolve, onAcknowledge, isResolving }) {
    const { isDark } = useTheme();
    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md border-l slide-panel overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{alert.title}</h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{alert.modelName}</p>
                        </div>
                        <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-faint)' }}>x</button>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <SeverityBadge severity={alert.severity} />
                        <StatusBadge status={alert.status} />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Message</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                        </div>
                        <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Rule</p>
                            <code className="text-sm px-2 py-1 rounded" style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-tertiary)' }}>{alert.rule}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Created</p>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(alert.createdAt).toLocaleString()}</p>
                            </div>
                            {alert.resolvedAt && (
                                <div>
                                    <p className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Resolved</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(alert.resolvedAt).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {alert.status !== 'resolved' && (
                        <div className="mt-8 space-y-3">
                            {alert.status === 'active' && (
                                <button
                                    onClick={() => onAcknowledge(alert._id)}
                                    className="w-full py-2 text-sm font-medium rounded-lg bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                                >
                                    Acknowledge
                                </button>
                            )}
                            <button
                                onClick={() => onResolve(alert._id)}
                                disabled={isResolving}
                                className="w-full py-2 text-sm font-medium rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                            >
                                {isResolving ? 'Resolving...' : 'Resolve Alert'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AlertsPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const queryClient = useQueryClient();
    const { isDark } = useTheme();

    const { data, isLoading } = useQuery({
        queryKey: ['alerts', page, statusFilter, severityFilter],
        queryFn: () => alertsAPI.list({
            page,
            limit: 20,
            ...(statusFilter && { status: statusFilter }),
            ...(severityFilter && { severity: severityFilter }),
        }),
        keepPreviousData: true,
    });

    const { data: stats } = useQuery({
        queryKey: ['alertStats'],
        queryFn: alertsAPI.stats,
    });

    const resolveMutation = useMutation({
        mutationFn: alertsAPI.resolve,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alertStats'] });
            queryClient.invalidateQueries({ queryKey: ['overview'] });
            setSelectedAlert(null);
        },
    });

    const acknowledgeMutation = useMutation({
        mutationFn: alertsAPI.acknowledge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alertStats'] });
        },
    });

    const alerts = data?.data || [];
    const totalPages = data?.pages || 1;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Alert Management</h2>

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-card p-3 text-center">
                        <p className="text-2xl font-bold text-red-500">{stats.active}</p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Active</p>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-500">{stats.acknowledged}</p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Acknowledged</p>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Resolved</p>
                    </div>
                    <div className="glass-card p-3 text-center">
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Total</p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                </select>
                <select
                    value={severityFilter}
                    onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                    className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="table-container">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Alert</th>
                                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Model</th>
                                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Severity</th>
                                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Status</th>
                                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                        <td colSpan={5} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} /></td>
                                    </tr>
                                ))
                            ) : (
                                alerts.map((alert) => (
                                    <tr
                                        key={alert._id}
                                        onClick={() => setSelectedAlert(alert)}
                                        className="cursor-pointer transition-colors"
                                        style={{ borderBottom: '1px solid var(--border-secondary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{alert.title}</p>
                                            <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: 'var(--text-faint)' }}>{alert.message}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{alert.modelName}</td>
                                        <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                                        <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}><TimeAgo date={alert.createdAt} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        Page {page} of {totalPages} -- {data?.total || 0} total alerts
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1 text-xs rounded disabled:opacity-30 border"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 text-xs rounded disabled:opacity-30 border"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {selectedAlert && (
                <AlertPanel
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    onResolve={(id) => resolveMutation.mutate(id)}
                    onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                    isResolving={resolveMutation.isPending}
                />
            )}
        </div>
    );
}
