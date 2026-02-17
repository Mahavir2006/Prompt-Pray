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
                    {/* Latest Metrics Snapshot */}
                    <div>
                        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Current Metrics</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                            {metricsSnapshot?.metrics && Object.entries(metricsSnapshot.metrics).map(([key, metric]) => (
                                <SnapshotCard key={key} label={key} value={metric.value} />
                            ))}
                        </div>
                    </div>

                    {/* Time-Series Charts */}
                    <div>
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
            )}
        </div>
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
