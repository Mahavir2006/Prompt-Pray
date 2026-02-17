import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { governanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ACTION_COLORS = {
    USER_LOGIN: 'text-blue-500 bg-blue-500/10',
    MODEL_DEPLOYED: 'text-green-500 bg-green-500/10',
    MODEL_RETRAINED: 'text-purple-500 bg-purple-500/10',
    ALERT_RESOLVED: 'text-emerald-500 bg-emerald-500/10',
    ALERT_ACKNOWLEDGED: 'text-yellow-600 bg-yellow-500/10',
    THRESHOLD_UPDATED: 'text-orange-500 bg-orange-500/10',
    EXPORT_INITIATED: 'text-cyan-500 bg-cyan-500/10',
    ROLE_CHANGED: 'text-pink-500 bg-pink-500/10',
    CONFIG_CHANGED: 'text-amber-500 bg-amber-500/10',
    DATA_ACCESSED: 'text-indigo-500 bg-indigo-500/10',
};

export default function GovernancePage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const { user } = useAuth();
    const { isDark } = useTheme();

    const { data: actionsData } = useQuery({
        queryKey: ['governanceActions'],
        queryFn: governanceAPI.actions,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['governanceLogs', page, actionFilter],
        queryFn: () => governanceAPI.logs({
            page,
            limit: 25,
            ...(actionFilter && { action: actionFilter }),
        }),
        keepPreviousData: true,
    });

    const exportMutation = useMutation({
        mutationFn: () => governanceAPI.export({ format: 'json' }),
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_log_export.json';
            a.click();
            URL.revokeObjectURL(url);
        },
    });

    const logs = data?.data || [];
    const totalPages = data?.pages || 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Governance & Compliance</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>Audit trail and compliance logs</p>
                </div>
                {user?.role !== 'viewer' && (
                    <button
                        onClick={() => exportMutation.mutate()}
                        disabled={exportMutation.isPending}
                        className="px-4 py-2 text-sm font-medium rounded-lg border disabled:opacity-50 transition-colors"
                        style={{
                            backgroundColor: isDark ? 'rgba(212,160,23,0.1)' : 'rgba(111,91,62,0.08)',
                            color: 'var(--accent-primary)',
                            borderColor: isDark ? 'rgba(212,160,23,0.2)' : 'rgba(111,91,62,0.15)',
                        }}
                    >
                        {exportMutation.isPending ? 'Exporting...' : 'Export Logs'}
                    </button>
                )}
            </div>

            <div className="flex gap-3">
                <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                    className="text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                    <option value="">All Actions</option>
                    {(actionsData?.actions || []).map((action) => (
                        <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="table-container">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                {['Timestamp', 'Action', 'User', 'Role', 'Details', 'Model', 'IP'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                        <td colSpan={7} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} /></td>
                                    </tr>
                                ))
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log._id}
                                        className="transition-colors"
                                        style={{ borderBottom: '1px solid var(--border-secondary)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-500/10'}`}
                                                style={!ACTION_COLORS[log.action] ? { color: 'var(--text-muted)' } : {}}
                                            >
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{log.userName}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs capitalize px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{log.userRole}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>{log.details}</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>{log.modelName || '--'}</td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-faint)' }}>{log.ipAddress}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                        Page {page} of {totalPages} -- {data?.total || 0} total records
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
        </div>
    );
}
