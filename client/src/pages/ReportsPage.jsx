import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportsAPI } from '../api';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const REPORTS = [
    { key: 'model-inventory', title: 'Model Inventory', desc: 'Complete registry of all models with risk tiers, ownership, and approval status', icon: '🏗️', gradient: 'from-purple-600 to-blue-600', api: 'modelInventory' },
    { key: 'alert-incident-summary', title: 'Alert & Incident Summary', desc: 'Aggregated alert metrics, incident counts, and mean-time-to-resolution', icon: '🚨', gradient: 'from-red-600 to-amber-600', api: 'alertIncidentSummary' },
    { key: 'sla-breach', title: 'SLA Breach Report', desc: 'All breached and at-risk SLOs with error budget consumption details', icon: '📉', gradient: 'from-amber-600 to-orange-600', api: 'slaBreach' },
    { key: 'governance-activity', title: 'Governance Activity', desc: 'Audit trail summary with action breakdowns and user activity logs', icon: '🔐', gradient: 'from-green-600 to-teal-600', api: 'governanceActivity' },
];

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [generating, setGenerating] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewType, setPreviewType] = useState(null);

    const generateMutation = useMutation({
        mutationFn: async ({ apiKey, format }) => {
            const params = { ...dateRange, format };
            return reportsAPI[apiKey](Object.fromEntries(Object.entries(params).filter(([, v]) => v)));
        },
    });

    const handleGenerate = async (report, format) => {
        setGenerating(report.key);
        try {
            if (format === 'csv' || format === 'pdf') {
                // Direct download via browser
                const token = localStorage.getItem('obs_token');
                const params = new URLSearchParams({ ...dateRange, format });
                const url = `${BASE_URL}/api/reports/${report.key}?${params}`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${report.key}_report.${format}`;
                a.click();
                URL.revokeObjectURL(a.href);
            } else {
                // JSON preview
                const data = await generateMutation.mutateAsync({ apiKey: report.api, format: '' });
                setPreviewData(data);
                setPreviewType(report.title);
            }
        } catch (err) {
            console.error('Report generation failed:', err);
        }
        setGenerating(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">Regulatory & Compliance Reports</h1>
                <p className="text-sm text-white/50 mt-1">Generate audit-ready reports — all exports are logged in the governance trail</p>
            </div>

            {/* Date Range Filter */}
            <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                <span className="text-sm text-white/50">Date Range:</span>
                <input type="date" value={dateRange.startDate} onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-teal-500/50 focus:outline-none" />
                <span className="text-white/30">→</span>
                <input type="date" value={dateRange.endDate} onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-teal-500/50 focus:outline-none" />
            </div>

            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REPORTS.map(report => (
                    <div key={report.key} className="glass-card p-5 space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-3xl">{report.icon}</span>
                            <div>
                                <h3 className="text-sm font-bold text-white">{report.title}</h3>
                                <p className="text-xs text-white/40 mt-1">{report.desc}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleGenerate(report, '')} disabled={generating === report.key}
                                className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10">
                                {generating === report.key ? 'Generating…' : '👁 Preview'}
                            </button>
                            <button onClick={() => handleGenerate(report, 'csv')} disabled={generating === report.key}
                                className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10">
                                📄 CSV
                            </button>
                            <button onClick={() => handleGenerate(report, 'pdf')} disabled={generating === report.key}
                                className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-all bg-gradient-to-r ${report.gradient} hover:opacity-90 shadow-lg`}>
                                📋 PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Panel */}
            {previewData && (
                <div className="glass-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Preview: {previewType}</h3>
                        <button onClick={() => setPreviewData(null)} className="text-white/40 hover:text-white text-xs">✕ Close</button>
                    </div>
                    <pre className="text-xs text-white/60 bg-black/30 rounded-lg p-4 max-h-80 overflow-auto font-mono whitespace-pre-wrap">
                        {JSON.stringify(previewData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
