import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const SEV_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6b7280' };
const STATUS_COLORS = { open: '#f59e0b', closed: '#22c55e' };

export default function IncidentsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const canEdit = user?.role === 'admin' || user?.role === 'analyst';

    const { data, isLoading } = useQuery({
        queryKey: ['incidents', statusFilter],
        queryFn: () => incidentsAPI.list(statusFilter ? { status: statusFilter } : {}),
    });

    const { data: detail } = useQuery({
        queryKey: ['incident', selectedId],
        queryFn: () => incidentsAPI.get(selectedId),
        enabled: !!selectedId,
    });

    const createMutation = useMutation({
        mutationFn: (d) => incidentsAPI.create(d),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); setShowCreate(false); },
    });

    const closeMutation = useMutation({
        mutationFn: (id) => incidentsAPI.close(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incidents'] }); queryClient.invalidateQueries({ queryKey: ['incident', selectedId] }); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...data }) => incidentsAPI.update(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incident', selectedId] }); },
    });

    const incidents = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">Incident Management</h1>
                    <p className="text-sm text-brown-900/50 dark:text-gold-100/50 mt-1">Track, investigate, and resolve operational incidents with full audit trail</p>
                </div>
                {canEdit && (
                    <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-brown-900 dark:text-gold-100 shadow-lg shadow-red-500/20 transition-all">
                        + Create Incident
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showCreate && <CreateIncidentForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} onCancel={() => setShowCreate(false)} />}

            {/* Filters */}
            <div className="flex gap-3">
                {['', 'open', 'closed'].map(s => (
                    <button key={s || 'all'} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-white/10 text-brown-900 dark:text-gold-100 ring-1 ring-white/20' : 'text-brown-900/40 dark:text-gold-100/40 hover:text-brown-900/70 dark:text-gold-100/70'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List */}
                <div className="lg:col-span-2 space-y-3">
                    {isLoading ? (
                        <div className="glass-card p-12 text-center text-brown-900/40 dark:text-gold-100/40">Loading incidents…</div>
                    ) : incidents.length === 0 ? (
                        <div className="glass-card p-12 text-center text-brown-900/40 dark:text-gold-100/40">No incidents found</div>
                    ) : incidents.map(inc => (
                        <div key={inc._id} onClick={() => setSelectedId(inc._id)}
                            className={`glass-card p-4 cursor-pointer transition-all hover:ring-1 hover:ring-amber-500/30 ${selectedId === inc._id ? 'ring-1 ring-amber-500/50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-brown-900 dark:text-gold-100 text-sm">{inc.title}</h3>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${SEV_COLORS[inc.severity]}20`, color: SEV_COLORS[inc.severity], border: `1px solid ${SEV_COLORS[inc.severity]}40` }}>{inc.severity}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${STATUS_COLORS[inc.status]}20`, color: STATUS_COLORS[inc.status], border: `1px solid ${STATUS_COLORS[inc.status]}40` }}>{inc.status}</span>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-brown-900/40 dark:text-gold-100/40">
                                <span>{new Date(inc.start_time).toLocaleString()}</span>
                                <span>{(inc.linked_alerts || []).length} linked alerts</span>
                                <span>By: {inc.created_by}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-1">
                    {detail ? (
                        <IncidentDetail
                            incident={detail}
                            canEdit={canEdit}
                            isAdmin={user?.role === 'admin'}
                            onClose={() => closeMutation.mutate(selectedId)}
                            onUpdateRCA={(rca) => updateMutation.mutate({ id: selectedId, root_cause: rca, timeline_event: 'RCA Updated', timeline_details: 'Root cause analysis updated' })}
                            isClosing={closeMutation.isPending}
                        />
                    ) : (
                        <div className="glass-card p-8 text-center text-brown-900/30 dark:text-gold-100/30">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5C3.312 17.333 4.274 19 5.814 19z" /></svg>
                            <p className="text-sm">Select an incident</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function IncidentDetail({ incident, canEdit, isAdmin, onClose, onUpdateRCA, isClosing }) {
    const [rca, setRca] = useState(incident.root_cause || '');

    return (
        <div className="glass-card p-5 space-y-5 sticky top-6">
            <div>
                <h2 className="text-lg font-bold text-brown-900 dark:text-gold-100">{incident.title}</h2>
                <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${SEV_COLORS[incident.severity]}20`, color: SEV_COLORS[incident.severity] }}>{incident.severity}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[incident.status]}20`, color: STATUS_COLORS[incident.status] }}>{incident.status}</span>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="text-sm font-semibold text-brown-900/70 dark:text-gold-100/70 mb-2">Timeline</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(incident.timeline || []).map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                            <div className="mt-1 w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                            <div>
                                <span className="text-brown-900 dark:text-gold-100 font-medium">{entry.event}</span>
                                <span className="text-brown-900/40 dark:text-gold-100/40 ml-2">{new Date(entry.timestamp).toLocaleString()}</span>
                                <p className="text-brown-900/50 dark:text-gold-100/50 mt-0.5">{entry.details} — {entry.user}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Linked Alerts */}
            {incident.linkedAlertDetails && incident.linkedAlertDetails.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-brown-900/70 dark:text-gold-100/70 mb-2">Linked Alerts</h3>
                    <div className="space-y-1">
                        {incident.linkedAlertDetails.map(a => (
                            <div key={a._id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                                <span className="text-brown-900/80 dark:text-gold-100/80">{a.title}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ color: SEV_COLORS[a.severity] }}>{a.severity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Root Cause Analysis */}
            <div>
                <h3 className="text-sm font-semibold text-brown-900/70 dark:text-gold-100/70 mb-2">Root Cause Analysis</h3>
                {canEdit && incident.status === 'open' ? (
                    <div className="space-y-2">
                        <textarea value={rca} onChange={e => setRca(e.target.value)} rows={4} placeholder="Enter root cause analysis…"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-brown-900 dark:text-gold-100 focus:ring-1 focus:ring-amber-500/50 focus:outline-none resize-none" />
                        <button onClick={() => onUpdateRCA(rca)} disabled={!rca.trim()}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 transition-all disabled:opacity-30">
                            Save RCA
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-brown-900/60 dark:text-gold-100/60 bg-white/5 rounded-lg p-3">{incident.root_cause || 'No RCA submitted yet'}</p>
                )}
            </div>

            {/* Close Incident */}
            {isAdmin && incident.status === 'open' && incident.root_cause && (
                <button onClick={onClose} disabled={isClosing}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 text-brown-900 dark:text-gold-100 hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50">
                    {isClosing ? 'Closing…' : '✓ Close Incident (RCA Complete)'}
                </button>
            )}
        </div>
    );
}

function CreateIncidentForm({ onSubmit, isLoading, onCancel }) {
    const [form, setForm] = useState({ title: '', severity: 'medium' });
    return (
        <div className="glass-card p-5 space-y-4">
            <h3 className="text-lg font-semibold text-brown-900 dark:text-gold-100">Create New Incident</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <label className="block text-xs text-brown-900/50 dark:text-gold-100/50 mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brown-900 dark:text-gold-100 focus:ring-1 focus:ring-amber-500/50 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-xs text-brown-900/50 dark:text-gold-100/50 mb-1">Severity</label>
                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-brown-900 dark:text-gold-100 focus:ring-1 focus:ring-amber-500/50 focus:outline-none">
                        {['critical', 'high', 'medium', 'low'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-brown-900/60 dark:text-gold-100/60 hover:text-brown-900 dark:text-gold-100">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isLoading || !form.title}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-600 to-amber-600 text-brown-900 dark:text-gold-100 disabled:opacity-50">
                    {isLoading ? 'Creating…' : 'Create'}
                </button>
            </div>
        </div>
    );
}
