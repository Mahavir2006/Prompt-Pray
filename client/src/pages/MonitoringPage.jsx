import { useState, useMemo, memo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactEChartsCore from 'echarts-for-react';
import { modelsAPI, metricsAPI } from '../api';
import { useFilters } from '../context/FilterContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

// Memoized chart with theme awareness
const MetricChart = memo(function MetricChart({ title, data, color }) {
    const { isDark } = useTheme();

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? '#1a1a1a' : '#fdf8f0',
            borderColor: isDark ? '#383838' : '#e8d5b5',
            textStyle: { color: isDark ? '#fef9c3' : '#332b1e', fontSize: 11 },
            formatter: (params) => {
                const p = params[0];
                const date = new Date(p.name);
                return `<div style="font-size:11px"><strong>${date.toLocaleString()}</strong><br/>
          Avg: ${p.data.toFixed(4)}</div>`;
            }
        },
        grid: { top: 10, right: 15, bottom: 25, left: 55 },
        xAxis: {
            type: 'category',
            data: (data || []).map(d => d.timestamp),
            axisLabel: {
                color: isDark ? '#666666' : '#9c8d74',
                fontSize: 9,
                formatter: (v) => {
                    const d = new Date(v);
                    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                }
            },
            axisLine: { lineStyle: { color: isDark ? '#383838' : '#e8d5b5' } },
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: isDark ? '#666666' : '#9c8d74', fontSize: 10 },
            splitLine: { lineStyle: { color: isDark ? '#252525' : '#f5e6cc' } },
        },
        series: [{
            type: 'line',
            data: (data || []).map(d => d.avg),
            smooth: true,
            lineStyle: { color, width: 2 },
            symbol: 'none',
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: color + '30' },
                        { offset: 1, color: color + '05' },
                    ],
                },
            },
        }],
    }), [data, color, isDark]);

    return (
        <div className="glass-card p-4">
            <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-faint)' }}>{title}</h4>
            {data && data.length > 0 ? (
                <ReactEChartsCore option={option} style={{ height: 180 }} opts={{ renderer: 'svg' }} />
            ) : (
                <div className="h-[180px] flex items-center justify-center text-xs" style={{ color: 'var(--text-faint)' }}>No data available</div>
            )}
        </div>
    );
});

// Metric snapshot card
const SnapshotCard = memo(function SnapshotCard({ label, value, unit }) {
    const formatValue = (v) => {
        if (v === undefined || v === null) return '--';
        if (typeof v === 'number') {
            if (v < 1) return (v * 100).toFixed(1) + '%';
            if (v > 100) return v.toFixed(0);
            return v.toFixed(2);
        }
        return v;
    };

    return (
        <div className="rounded-lg p-3 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
            <p className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{label.replace(/_/g, ' ')}</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {formatValue(value)} {unit && <span className="text-xs font-normal" style={{ color: 'var(--text-faint)' }}>{unit}</span>}
            </p>
        </div>
    );
});

const METRIC_COLORS = {
    accuracy: '#22c55e', precision: '#3b82f6', recall: '#8b5cf6', f1_score: '#ec4899',
    latency: '#f97316', throughput: '#06b6d4', drift_score: '#ef4444', data_quality: '#10b981',
    token_usage: '#f59e0b', hallucination_rate: '#ef4444', toxicity_score: '#dc2626',
    cost_per_request: '#f97316', context_relevance: '#8b5cf6',
};

export default function MonitoringPage({ modelType, title }) {
    const [selectedModelId, setSelectedModelId] = useState(null);
    const { dateRange } = useFilters();
    const { subscribe, unsubscribe } = useSocket();
    const { isDark } = useTheme();

    const { data: modelsData, isLoading: modelsLoading } = useQuery({
        queryKey: ['models', modelType],
        queryFn: () => modelsAPI.list({ type: modelType }),
    });

    const models = modelsData?.data || [];

    useEffect(() => {
        if (models.length > 0 && !selectedModelId) {
            setSelectedModelId(models[0]._id);
        }
    }, [models, selectedModelId]);

    useEffect(() => {
        if (selectedModelId) {
            subscribe(selectedModelId);
            return () => unsubscribe(selectedModelId);
        }
    }, [selectedModelId, subscribe, unsubscribe]);

    const { data: metricsSnapshot } = useQuery({
        queryKey: ['metrics', selectedModelId, 'snapshot'],
        queryFn: () => metricsAPI.get(selectedModelId),
        enabled: !!selectedModelId,
    });

    const metricTypes = modelType === 'ml'
        ? ['accuracy', 'precision', 'recall', 'f1_score', 'latency', 'throughput', 'drift_score', 'data_quality']
        : ['token_usage', 'latency', 'hallucination_rate', 'toxicity_score', 'cost_per_request', 'throughput', 'context_relevance'];

    const [visibleCharts, setVisibleCharts] = useState(4);
    const displayedTypes = metricTypes.slice(0, visibleCharts);

    const [viewMode, setViewMode] = useState('performance'); // 'performance' | 'lineage'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            </div>

            {/* Model Selector */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {modelsLoading ? (
                    <div className="flex gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="glass-card h-16 w-48 animate-pulse" />)}
                    </div>
                ) : (
                    models.map((model) => (
                        <button
                            key={model._id}
                            onClick={() => setSelectedModelId(model._id)}
                            className="flex-shrink-0 px-4 py-3 rounded-lg border transition-all text-left"
                            style={{
                                backgroundColor: selectedModelId === model._id
                                    ? (isDark ? 'rgba(212,160,23,0.12)' : 'rgba(111,91,62,0.08)')
                                    : 'var(--bg-card)',
                                borderColor: selectedModelId === model._id
                                    ? (isDark ? 'rgba(212,160,23,0.3)' : 'rgba(111,91,62,0.2)')
                                    : 'var(--border-secondary)',
                                color: selectedModelId === model._id ? 'var(--accent-primary)' : 'var(--text-muted)',
                            }}
                        >
                            <p className="text-sm font-medium">{model.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${model.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-xs capitalize">{model.environment} / v{model.version}</span>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {selectedModelId && (
                <>
                    {/* Tabs */}
                    <div className="flex border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                        <button
                            onClick={() => setViewMode('performance')}
                            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${viewMode === 'performance' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Performance & Quality
                        </button>
                        <button
                            onClick={() => setViewMode('lineage')}
                            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${viewMode === 'lineage' ? 'border-purple-500 text-purple-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            Data Lineage
                        </button>
                    </div>

                    {viewMode === 'performance' ? (
                        <>
                            {/* Latest Metrics Snapshot */}
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Current Metrics</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                    {metricsSnapshot?.metrics && Object.entries(metricsSnapshot.metrics).map(([key, metric]) => (
                                        <SnapshotCard key={key} label={key} value={metric.value} />
                                    ))}
                                </div>
                            </div>

                            {/* Time-Series Charts */}
                            <div className="mt-6">
                                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Time-Series Metrics</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {displayedTypes.map((type) => (
                                        <ChartWrapper
                                            key={type}
                                            modelId={selectedModelId}
                                            type={type}
                                            dateRange={dateRange}
                                            color={METRIC_COLORS[type] || '#3b82f6'}
                                        />
                                    ))}
                                </div>
                                {visibleCharts < metricTypes.length && (
                                    <button
                                        onClick={() => setVisibleCharts(v => v + 4)}
                                        className="mt-4 w-full py-2 text-sm rounded-lg border transition-colors"
                                        style={{
                                            color: 'var(--accent-primary)',
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border-secondary)',
                                        }}
                                    >
                                        Load more charts ({metricTypes.length - visibleCharts} remaining)
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mt-4">
                            <LineageView modelId={selectedModelId} metricTypes={metricTypes} />
                        </div>
                    )}
                </>
            )}
        </div >
    );
}

function ChartWrapper({ modelId, type, dateRange, color }) {
    const { data } = useQuery({
        queryKey: ['metrics', modelId, type, dateRange.label],
        queryFn: () => metricsAPI.get(modelId, { type, startDate: dateRange.startDate, endDate: dateRange.endDate, bucket: '1' }),
        enabled: !!modelId,
        staleTime: 30000,
    });

    return (
        <MetricChart
            title={type.replace(/_/g, ' ')}
            data={data?.data}
            color={color}
        />
    );
}

function LineageView({ modelId, metricTypes }) {
    const [selectedType, setSelectedType] = useState(metricTypes[0]);
    const { isDark } = useTheme();

    const { data: lineage, isLoading } = useQuery({
        queryKey: ['lineage', modelId, selectedType],
        queryFn: () => metricsAPI.lineage(modelId, selectedType),
        enabled: !!modelId && !!selectedType,
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Data Provenance & Lineage</h3>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="text-xs rounded-lg px-3 py-1.5 focus:outline-none border"
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    {metricTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
            </div>

            {isLoading ? (
                <div className="glass-card p-12 text-center text-xs" style={{ color: 'var(--text-faint)' }}>Loading lineage data...</div>
            ) : lineage ? (
                <div className="glass-card p-6 space-y-6 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Source Details</h4>

                            <LineageItem label="Source System" value={lineage.source_system} icon="🔌" />
                            <LineageItem label="Ingestion Time" value={new Date(lineage.ingestion_time).toLocaleString()} icon="⏱️" />
                            <LineageItem label="Environment" value={lineage.environment?.toUpperCase()} icon="🌍" />
                            <LineageItem label="Retention Policy" value={lineage.retention_policy} icon="💾" />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Processing Metadata</h4>

                            <LineageItem label="Aggregation Method" value={lineage.aggregation_method} icon="∑" />
                            <LineageItem label="Metric ID" value={lineage.metric_id} icon="🆔" mono />
                            <LineageItem label="Total Data Points" value={lineage.total_data_points} icon="📊" />
                            <div className="pt-2">
                                <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>Data Range</div>
                                <div className="text-xs font-mono p-2 rounded border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)', color: 'var(--text-secondary)' }}>
                                    {new Date(lineage.earliest).toLocaleDateString()} — {new Date(lineage.latest).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                            <span>🔒</span>
                            <span>Immutable Audit Record • Action LOGGED_AS: DATA_ACCESSED</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-8 text-center text-xs" style={{ color: 'var(--text-faint)' }}>No lineage data found for this metric.</div>
            )}
        </div>
    );
}

function LineageItem({ label, value, icon, mono }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-base opacity-70">{icon}</div>
            <div>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className={`text-sm font-medium ${mono ? 'font-mono text-xs mt-0.5' : ''}`} style={{ color: 'var(--text-primary)' }}>{value || 'N/A'}</p>
            </div>
        </div>
    );
}
