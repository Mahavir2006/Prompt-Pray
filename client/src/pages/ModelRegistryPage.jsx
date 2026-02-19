import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };
const STATUS_COLORS = { active: '#22c55e', paused: '#f59e0b', retired: '#6b7280', degraded: '#ef4444' };
const ENV_COLORS = { prod: '#ef4444', uat: '#f59e0b', dev: '#3b82f6' };

export default function ModelRegistryPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedModel, setSelectedModel] = useState(null);
    const [filters, setFilters] = useState({ risk_tier: '', deployment_env: '', status: '' });
    const [showRegister, setShowRegister] = useState(false);
    const isAdmin = user?.role === 'admin';

    const { data, isLoading } = useQuery({
        queryKey: ['models', filters],
        queryFn: () => modelsAPI.list(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
    });

    const { data: detail, isLoading: detailLoading } = useQuery({
        queryKey: ['model', selectedModel],
        queryFn: () => modelsAPI.get(selectedModel),
        enabled: !!selectedModel,
    });

    const approveMutation = useMutation({
        mutationFn: (id) => modelsAPI.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            queryClient.invalidateQueries({ queryKey: ['model', selectedModel] });
        },
    });

    const registerMutation = useMutation({
        mutationFn: (data) => modelsAPI.register(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            setShowRegister(false);
        },
    });

    const models = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Model Registry</h1>
                    <p className="text-sm text-white/50 mt-1">Banking-grade model risk management & governance</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowRegister(!showRegister)} className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-purple-500/20 transition-all">
                        + Register Model
                    </button>
                )}
            </div>

            {/* Register Form */}
            {showRegister && <RegisterForm onSubmit={registerMutation.mutate} isLoading={registerMutation.isPending} onCancel={() => setShowRegister(false)} />}

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <FilterSelect label="Risk Tier" value={filters.risk_tier} options={['', 'High', 'Medium', 'Low']} onChange={v => setFilters(f => ({ ...f, risk_tier: v }))} />
                <FilterSelect label="Environment" value={filters.deployment_env} options={['', 'prod', 'uat', 'dev']} onChange={v => setFilters(f => ({ ...f, deployment_env: v }))} />
                <FilterSelect label="Status" value={filters.status} options={['', 'active', 'paused', 'retired']} onChange={v => setFilters(f => ({ ...f, status: v }))} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Model List */}
                <div className="lg:col-span-2 space-y-3">
                    {isLoading ? (
                        <div className="glass-card p-12 text-center text-white/40">Loading models…</div>
                    ) : models.length === 0 ? (
                        <div className="glass-card p-12 text-center text-white/40">No models found</div>
                    ) : models.map(model => (
                        <div key={model._id} onClick={() => setSelectedModel(model._id)}
                            className={`glass-card p-4 cursor-pointer transition-all hover:ring-1 hover:ring-purple-500/30 ${selectedModel === model._id ? 'ring-1 ring-cyan-500/50' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">{model.name}</h3>
                                    <p className="text-xs text-white/50 mt-1">{model.use_case || model.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge text={model.risk_tier} color={RISK_COLORS[model.risk_tier]} />
                                    <Badge text={model.deployment_env} color={ENV_COLORS[model.deployment_env]} />
                                    <Badge text={model.status} color={STATUS_COLORS[model.status]} />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-3 text-xs text-white/40">
                                <span>v{model.version}</span>
                                <span>{model.model_type}</span>
                                <span>{model.business_unit}</span>
                                <span>Owner: {model.owner}</span>
                                {model.approved_by ? <span className="text-green-400">✓ Approved</span> : <span className="text-amber-400">⏳ Pending</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-1">
                    {selectedModel && detail ? (
                        <ModelDetailPanel model={detail} isAdmin={isAdmin} onApprove={() => approveMutation.mutate(selectedModel)} isApproving={approveMutation.isPending} loading={detailLoading} />
                    ) : (
                        <div className="glass-card p-8 text-center text-white/30">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <p className="text-sm">Select a model to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* === Sub-components === */

function ModelDetailPanel({ model, isAdmin, onApprove, isApproving, loading }) {
    if (loading) return <div className="glass-card p-8 text-center text-white/40">Loading…</div>;

    return (
        <div className="glass-card p-5 space-y-5 sticky top-6">
            <div>
                <h2 className="text-lg font-bold text-white">{model.name}</h2>
                <p className="text-xs text-white/50 mt-1">{model.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InfoField label="Type" value={model.model_type} />
                <InfoField label="Version" value={`v${model.version}`} />
                <InfoField label="Risk Tier" value={model.risk_tier} color={RISK_COLORS[model.risk_tier]} />
                <InfoField label="Status" value={model.status} color={STATUS_COLORS[model.status]} />
                <InfoField label="Environment" value={model.deployment_env?.toUpperCase()} />
                <InfoField label="Business Unit" value={model.business_unit} />
                <InfoField label="Owner" value={model.owner} />
                <InfoField label="Approved By" value={model.approved_by || '—'} />
            </div>

            {/* Approval Action */}
            {isAdmin && !model.approved_by && (
                <button onClick={onApprove} disabled={isApproving}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all disabled:opacity-50">
                    {isApproving ? 'Approving…' : '✓ Approve for Production'}
                </button>
            )}

            {/* Version History */}
            {model.versionHistory && model.versionHistory.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-2">Version History</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {model.versionHistory.map((v, i) => (
                            <div key={v._id || i} className="flex items-start gap-3 text-xs">
                                <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                                <div>
                                    <span className="text-white font-medium">v{v.version}</span>
                                    <span className="text-white/40 ml-2">{new Date(v.created_at).toLocaleDateString()}</span>
                                    <p className="text-white/50 mt-0.5">{v.change_summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function RegisterForm({ onSubmit, isLoading, onCancel }) {
    const [form, setForm] = useState({ name: '', model_type: 'ML', type: 'ml', description: '', version: '0.1.0', use_case: '', business_unit: '', risk_tier: 'Low', owner: '', deployment_env: 'dev' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="glass-card p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">Register New Model</h3>
            <div className="grid grid-cols-2 gap-3">
                <FormInput label="Model Name" value={form.name} onChange={v => set('name', v)} required />
                <FormSelect label="Type" value={form.model_type} options={['ML', 'LLM', 'Rules', 'External_API']} onChange={v => { set('model_type', v); set('type', v === 'LLM' ? 'llm' : 'ml'); }} />
                <FormInput label="Version" value={form.version} onChange={v => set('version', v)} />
                <FormSelect label="Risk Tier" value={form.risk_tier} options={['Low', 'Medium', 'High']} onChange={v => set('risk_tier', v)} />
                <FormInput label="Use Case" value={form.use_case} onChange={v => set('use_case', v)} />
                <FormInput label="Business Unit" value={form.business_unit} onChange={v => set('business_unit', v)} />
                <FormInput label="Owner" value={form.owner} onChange={v => set('owner', v)} />
                <FormSelect label="Environment" value={form.deployment_env} options={['dev', 'uat', 'prod']} onChange={v => set('deployment_env', v)} />
            </div>
            <FormInput label="Description" value={form.description} onChange={v => set('description', v)} full />
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                <button onClick={() => onSubmit(form)} disabled={isLoading || !form.name}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 text-white disabled:opacity-50">
                    {isLoading ? 'Registering…' : 'Register'}
                </button>
            </div>
        </div>
    );
}

function Badge({ text, color }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
            {text}
        </span>
    );
}

function InfoField({ label, value, color }) {
    return (
        <div className="text-xs">
            <span className="text-white/40 block">{label}</span>
            <span className="text-white font-medium" style={color ? { color } : {}}>{value || '—'}</span>
        </div>
    );
}

function FilterSelect({ label, value, options, onChange }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:ring-1 focus:ring-purple-500/50 focus:outline-none">
            <option value="">{label}: All</option>
            {options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

function FormInput({ label, value, onChange, required, full }) {
    return (
        <div className={full ? 'col-span-2' : ''}>
            <label className="block text-xs text-white/50 mb-1">{label}{required && ' *'}</label>
            <input value={value} onChange={e => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500/50 focus:outline-none" />
        </div>
    );
}

function FormSelect({ label, value, options, onChange }) {
    return (
        <div>
            <label className="block text-xs text-white/50 mb-1">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-purple-500/50 focus:outline-none">
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}
