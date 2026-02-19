import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Alert Status Colors & Labels
const SEVERITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
};

const STATUS_COLORS = {
    open: '#ef4444',
    acknowledged: '#f59e0b',
    investigating: '#8b5cf6',
    resolved: '#22c55e',
};

export default function AlertsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedAlertId, setSelectedAlertId] = useState(null);
    const [filters, setFilters] = useState({ status: 'open', severity: '' });

    // Real-time updates via Socket.IO
    useSocket((socket) => {
        socket.on('alertCreated', () => queryClient.invalidateQueries({ queryKey: ['alerts'] }));
        socket.on('alertResolved', () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            if (selectedAlertId) queryClient.invalidateQueries({ queryKey: ['alert', selectedAlertId] });
        });
    });

    const { data, isLoading } = useQuery({
        queryKey: ['alerts', filters],
        queryFn: () => alertsAPI.list(filters),
        keepPreviousData: true,
    });

    const alerts = data?.data || [];
    const activeAlert = alerts.find(a => a._id === selectedAlertId);

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                    Alert Management
                </h1>
                <p className="text-sm text-white/50">Real-time anomaly detection & incident response workflow</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['open', 'acknowledged', 'investigating', 'resolved'].map(status => (
                    <button
                        key={status}
                        onClick={() => { setFilters(f => ({ ...f, status })); setSelectedAlertId(null); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filters.status === status
                            ? 'bg-white/10 text-white ring-1 ring-white/20'
                            : 'text-white/40 hover:text-white/70'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Alert List */}
                <div className="lg:col-span-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center p-8 text-white/30 text-sm">Loading alerts...</div>
                    ) : alerts.length === 0 ? (
                        <div className="text-center p-8 text-white/30 text-sm">No alerts found</div>
                    ) : (
                        alerts.map(alert => (
                            <div
                                key={alert._id}
                                onClick={() => setSelectedAlertId(alert._id)}
                                className={`glass-card p-3 cursor-pointer transition-all border-l-4 ${selectedAlertId === alert._id ? 'bg-white/10' : 'hover:bg-white/5'
                                    }`}
                                style={{ borderLeftColor: SEVERITY_COLORS[alert.severity] }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-sm text-white truncate pr-2">{alert.title}</h3>
                                    <span className="text-[10px] text-white/40 whitespace-nowrap">
                                        {new Date(alert.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-white/60 line-clamp-2 mb-2">{alert.message}</p>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">
                                        {alert.modelName}
                                    </span>
                                    <span className="capitalize" style={{ color: STATUS_COLORS[alert.status] }}>
                                        {alert.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Alert Detail Panel */}
                <div className="lg:col-span-2 min-h-0">
                    {selectedAlertId && activeAlert ? (
                        <AlertDetailPanel alertId={selectedAlertId} />
                    ) : (
                        <div className="h-full glass-card flex flex-col items-center justify-center text-white/30">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>Select an alert to view details & evidence</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AlertDetailPanel({ alertId }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const canAction = user?.role === 'admin' || user?.role === 'analyst';
    const [comment, setComment] = useState('');

    const { data: alert } = useQuery({
        queryKey: ['alert', alertId],
        queryFn: () => alertsAPI.get(alertId),
    });

    const { data: evidence } = useQuery({
        queryKey: ['alert-evidence', alertId],
        queryFn: () => alertsAPI.evidence(alertId),
        enabled: !!alertId,
    });

    const { data: historyData } = useQuery({
        queryKey: ['alert-history', alertId],
        queryFn: () => alertsAPI.history(alertId),
        enabled: !!alertId,
    });

    const history = historyData?.data || [];

    const actionMutation = useMutation({
        mutationFn: ({ action, comment }) => {
            if (action === 'acknowledge') return alertsAPI.acknowledge(alertId);
            if (action === 'investigate') return alertsAPI.investigate(alertId, comment);
            if (action === 'resolve') return alertsAPI.resolve(alertId, comment);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['alert', alertId] });
            queryClient.invalidateQueries({ queryKey: ['alert-history', alertId] });
            setComment('');
        },
    });

    if (!alert) return <div className="glass-card p-8">Loading details...</div>;

    return (
        <div className="h-full glass-card overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">{alert.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                        <span>ID: {alert._id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>Model: {alert.modelName}</span>
                        <span>•</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${SEVERITY_COLORS[alert.severity]}20`, color: SEVERITY_COLORS[alert.severity], border: `1px solid ${SEVERITY_COLORS[alert.severity]}40` }}>
                        {alert.severity}
                    </span>
                    <span className="text-xs font-bold capitalize" style={{ color: STATUS_COLORS[alert.status] }}>
                        {alert.status}
                    </span>
                </div>
            </div>

            {/* Why This Alert (Evidence) */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-lg">🔍</span> Why This Alert Triggered
                </h3>
                {evidence ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-xs text-white/40 mb-1">Metric</span>
                            <span className="font-mono text-cyan-300">{evidence.metric_name}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-white/40 mb-1">Threshold Rule</span>
                            <span className="font-mono text-white/80">{evidence.metric_name} {evidence.operator} {evidence.threshold}</span>
                        </div>
                        <div className="col-span-2 bg-black/20 rounded p-3 border border-red-500/30">
                            <span className="block text-xs text-white/40 mb-1">Observed Value @ Trigger Time</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-red-400">{evidence.observed_value}</span>
                                <span className="text-xs text-red-400/70">
                                    ({evidence.operator === '>' ? '+' : ''}{((evidence.observed_value - evidence.threshold) / evidence.threshold * 100).toFixed(1)}% vs threshold)
                                </span>
                            </div>
                        </div>
                        <div className="col-span-2 text-xs text-white/40 mt-1 italic">
                            Evidence Snapshot ID: {evidence.rule_id} • Immutable Record
                        </div>
                    </div>
                ) : (
                    <p className="text-white/40 italic text-sm">Evidence snapshot loading or unavailable...</p>
                )}
            </div>

            {/* State Timeline */}
            <div>
                <h3 className="text-sm font-bold text-white mb-3">Audit Trail & Timeline</h3>
                <div className="space-y-4 pl-2 border-l-2 border-white/10 ml-2">
                    {history.map((entry, i) => (
                        <div key={i} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#1a1a1a] border-2 border-white/20" />
                            <div className="text-xs text-white/40 mb-0.5">{new Date(entry.timestamp).toLocaleString()}</div>
                            <div className="text-sm font-medium text-white mb-1">
                                {entry.previous_state ? (
                                    <span>
                                        <span className="capitalize text-white/60">{entry.previous_state}</span>
                                        {' → '}
                                        <span className="capitalize" style={{ color: STATUS_COLORS[entry.new_state] }}>{entry.new_state}</span>
                                    </span>
                                ) : (
                                    <span className="text-white/60">Alert Triggered</span>
                                )}
                            </div>
                            {entry.comment && <div className="text-xs text-white/70 bg-white/5 p-2 rounded italic">"{entry.comment}"</div>}
                            <div className="text-[10px] text-white/30 mt-1">User: {entry.user_name || 'System'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions Workflow */}
            {canAction && alert.status !== 'resolved' && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                    <h3 className="text-sm font-bold text-white">Transition Workflow</h3>

                    {/* Acknowledge Action */}
                    {alert.status === 'open' && (
                        <button
                            onClick={() => actionMutation.mutate({ action: 'acknowledge' })}
                            className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 rounded font-medium text-sm transition-all"
                        >
                            Mark as Acknowledged
                        </button>
                    )}

                    {/* Investigate Action */}
                    {alert.status === 'acknowledged' && (
                        <div className="space-y-2">
                            <input
                                placeholder="Investigation notes (optional)..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                                onClick={() => actionMutation.mutate({ action: 'investigate', comment })}
                                className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded font-medium text-sm transition-all"
                            >
                                Start Investigation
                            </button>
                        </div>
                    )}

                    {/* Resolve Action */}
                    {(alert.status === 'acknowledged' || alert.status === 'investigating') && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <input
                                placeholder="Resolution notes (MANDATORY)..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <button
                                onClick={() => actionMutation.mutate({ action: 'resolve', comment })}
                                disabled={!comment.trim()}
                                className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30 rounded font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Resolve Alert
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
