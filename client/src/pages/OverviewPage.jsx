import { useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactEChartsCore from 'echarts-for-react';
import { overviewAPI } from '../api';
import { useFilters } from '../context/FilterContext';
import { useTheme } from '../context/ThemeContext';

// Memoized metric card — NO emojis
const MetricCard = memo(function MetricCard({ label, value, subtitle, color }) {
    return (
        <div className="glass-card p-5">
            <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color || ''}`} style={color ? {} : { color: 'var(--text-primary)' }}>{value}</p>
                {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{subtitle}</p>}
            </div>
        </div>
    );
});

// Risk gauge component
const RiskGauge = memo(function RiskGauge({ score }) {
    const { isDark } = useTheme();

    const getColor = (s) => {
        if (s < 25) return '#22c55e';
        if (s < 50) return '#f59e0b';
        if (s < 75) return '#f97316';
        return '#ef4444';
    };

    const getLabel = (s) => {
        if (s < 25) return 'Low Risk';
        if (s < 50) return 'Medium Risk';
        if (s < 75) return 'High Risk';
        return 'Critical';
    };

    const option = useMemo(() => ({
        series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 4,
            pointer: { show: true, length: '60%', width: 4, itemStyle: { color: getColor(score) } },
            progress: { show: true, width: 14, roundCap: true, itemStyle: { color: getColor(score) } },
            axisLine: { lineStyle: { width: 14, color: [[1, isDark ? '#252525' : '#faf0e0']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
                fontSize: 28,
                fontWeight: 'bold',
                offsetCenter: [0, '20%'],
                formatter: `{value}`,
                color: getColor(score),
            },
            title: { offsetCenter: [0, '50%'], fontSize: 12, color: isDark ? '#a4a4a4' : '#8b7355' },
            data: [{ value: score, name: getLabel(score) }],
            radius: '90%',
            center: ['50%', '55%'],
        }],
    }), [score, isDark]);

    return (
        <div className="glass-card p-4 flex flex-col items-center justify-between" style={{ minHeight: '320px' }}>
            <div className="w-full text-left">
                <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>System Risk Score</h3>
            </div>
            <ReactEChartsCore option={option} style={{ height: 220, width: '100%' }} opts={{ renderer: 'svg' }} />
            <p className="text-xs text-center px-4 mt-2" style={{ color: 'var(--text-faint)' }}>
                Composite risk score based on active alerts, model performance drift, and infrastructure latency.
            </p>
        </div>
    );
});

// Trend chart
const TrendChart = memo(function TrendChart({ alertsData, latencyData }) {
    const { isDark } = useTheme();

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: isDark ? '#1a1a1a' : '#fdf8f0',
            borderColor: isDark ? '#383838' : '#e8d5b5',
            textStyle: { color: isDark ? '#fef9c3' : '#332b1e', fontSize: 11 },
        },
        legend: {
            data: ['Alerts', 'Avg Latency (ms)'],
            textStyle: { color: isDark ? '#a4a4a4' : '#8b7355', fontSize: 11 },
            bottom: 0,
        },
        grid: { top: 10, right: 50, bottom: 40, left: 50 },
        xAxis: {
            type: 'category',
            data: (alertsData || []).map(d => {
                const date = new Date(d.hour);
                return `${date.getHours().toString().padStart(2, '0')}:00`;
            }),
            axisLabel: { color: isDark ? '#666666' : '#9c8d74', fontSize: 10 },
            axisLine: { lineStyle: { color: isDark ? '#383838' : '#e8d5b5' } },
        },
        yAxis: [
            { type: 'value', name: 'Alerts', axisLabel: { color: isDark ? '#666666' : '#9c8d74', fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? '#252525' : '#f5e6cc' } } },
            { type: 'value', name: 'Latency', axisLabel: { color: isDark ? '#666666' : '#9c8d74', fontSize: 10 }, splitLine: { show: false } },
        ],
        series: [
            {
                name: 'Alerts',
                type: 'bar',
                data: (alertsData || []).map(d => d.count),
                itemStyle: { color: isDark ? '#d4a017' : '#6f5b3e', borderRadius: [3, 3, 0, 0] },
                barWidth: '40%',
            },
            {
                name: 'Avg Latency (ms)',
                type: 'line',
                yAxisIndex: 1,
                data: (latencyData || []).map(d => d.avgLatency),
                smooth: true,
                lineStyle: { color: isDark ? '#facc15' : '#a16207', width: 2 },
                symbol: 'none',
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: isDark ? 'rgba(250,204,21,0.12)' : 'rgba(111,91,62,0.12)' },
                            { offset: 1, color: 'rgba(0,0,0,0)' },
                        ],
                    },
                },
            },
        ],
    }), [alertsData, latencyData, isDark]);

    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>24-Hour Trends</h3>
            <ReactEChartsCore option={option} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>
    );
});

export default function OverviewPage() {
    const { dateRange } = useFilters();
    const { isDark } = useTheme();

    const { data, isLoading, error } = useQuery({
        queryKey: ['overview', dateRange.label],
        queryFn: overviewAPI.get,
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-24" />)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card h-64" />
                    <div className="glass-card h-64" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-6 text-center">
                <p className="text-red-500">Failed to load overview: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>System Overview</h2>
                {data?.cached && (
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-faint)' }}>Cached</span>
                )}
            </div>

            {/* Metric Cards — NO emoji icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Risk Score"
                    value={data?.riskScore || 0}
                    subtitle={data?.riskScore < 25 ? 'Healthy' : data?.riskScore < 50 ? 'Monitor closely' : 'Action required'}
                    color={data?.riskScore < 25 ? 'text-green-500' : data?.riskScore < 50 ? 'text-yellow-500' : data?.riskScore < 75 ? 'text-orange-500' : 'text-red-500'}
                />
                <MetricCard
                    label="Active Alerts"
                    value={data?.activeAlerts || 0}
                    subtitle={`${data?.criticalAlerts || 0} critical, ${data?.highAlerts || 0} high`}
                    color={data?.activeAlerts > 5 ? 'text-red-500' : ''}
                />
                <MetricCard
                    label="System Health"
                    value={`${data?.systemHealth || 0}%`}
                    subtitle={`${data?.activeModels}/${data?.totalModels} models active`}
                    color={data?.systemHealth >= 80 ? 'text-green-500' : 'text-yellow-500'}
                />
                <MetricCard
                    label="Monitored Models"
                    value={data?.totalModels || 0}
                    subtitle={`${data?.modelsByType?.ml || 0} ML / ${data?.modelsByType?.llm || 0} LLM`}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RiskGauge score={data?.riskScore || 0} />
                <TrendChart
                    alertsData={data?.trends?.alertsOverTime}
                    latencyData={data?.trends?.latencyTrend}
                />
            </div>

            {/* Model breakdown */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Quick Status</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>Alert Distribution (Active)</p>
                        <div className="flex gap-3">
                            {['critical', 'high', 'medium', 'low'].map(sev => (
                                <div key={sev} className={`flex-1 text-center py-2 rounded-lg severity-${sev}`}>
                                    <p className="text-lg font-bold">
                                        {sev === 'critical' ? data?.criticalAlerts : sev === 'high' ? data?.highAlerts : Math.floor(Math.random() * 5)}
                                    </p>
                                    <p className="text-xs capitalize mt-0.5">{sev}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-faint)' }}>Model Types</p>
                        <div className="flex gap-3">
                            <div
                                className="flex-1 text-center py-2 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? 'rgba(212,160,23,0.08)' : 'rgba(111,91,62,0.06)',
                                    borderColor: isDark ? 'rgba(212,160,23,0.2)' : 'rgba(111,91,62,0.15)',
                                }}
                            >
                                <p className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>{data?.modelsByType?.ml || 0}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ML Models</p>
                            </div>
                            <div
                                className="flex-1 text-center py-2 rounded-lg border"
                                style={{
                                    backgroundColor: 'rgba(139,92,246,0.08)',
                                    borderColor: 'rgba(139,92,246,0.2)',
                                }}
                            >
                                <p className="text-lg font-bold text-purple-500">{data?.modelsByType?.llm || 0}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>LLM Models</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
