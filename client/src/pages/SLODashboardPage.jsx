import { useQuery } from '@tanstack/react-query';
import { sloAPI } from '../api';
import ReactECharts from 'echarts-for-react';

const STATUS_COLORS = { healthy: '#22c55e', at_risk: '#f59e0b', breached: '#ef4444' };
const STATUS_LABELS = { healthy: 'Healthy', at_risk: 'At Risk', breached: 'Breached' };

export default function SLODashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['slos'],
        queryFn: () => sloAPI.list(),
    });

    const slos = data?.data || [];
    const summary = {
        total: slos.length,
        healthy: slos.filter(s => s.status === 'healthy').length,
        at_risk: slos.filter(s => s.status === 'at_risk').length,
        breached: slos.filter(s => s.status === 'breached').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">SLA / SLO Dashboard</h1>
                <p className="text-sm text-white/50 mt-1">Service level objectives & error budget tracking</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total SLOs" value={summary.total} color="#8b5cf6" />
                <SummaryCard label="Healthy" value={summary.healthy} color="#22c55e" />
                <SummaryCard label="At Risk" value={summary.at_risk} color="#f59e0b" />
                <SummaryCard label="Breached" value={summary.breached} color="#ef4444" />
            </div>

            {/* SLO Cards */}
            {isLoading ? (
                <div className="glass-card p-12 text-center text-white/40">Loading SLOs…</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slos.map(slo => <SLOCard key={slo._id} slo={slo} />)}
                </div>
            )}
        </div>
    );
}

function SummaryCard({ label, value, color }) {
    return (
        <div className="glass-card p-4">
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        </div>
    );
}

function SLOCard({ slo }) {
    const statusColor = STATUS_COLORS[slo.status];
    const budgetPercent = slo.error_budget > 0 ? Math.round((slo.error_budget_remaining / slo.error_budget) * 100) : 0;

    const gaugeOption = {
        series: [{
            type: 'gauge',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 4,
            radius: '100%',
            center: ['50%', '60%'],
            pointer: { show: false },
            progress: {
                show: true,
                overlap: false,
                roundCap: true,
                clip: false,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                            { offset: 0, color: statusColor },
                            { offset: 1, color: slo.status === 'healthy' ? '#3b82f6' : statusColor },
                        ],
                    },
                },
            },
            axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.06)']] } },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            detail: {
                fontSize: 22,
                fontWeight: 'bold',
                color: '#fff',
                offsetCenter: [0, '0%'],
                formatter: `${budgetPercent}%`,
            },
            title: {
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                offsetCenter: [0, '25%'],
            },
            data: [{ value: budgetPercent, name: 'Budget Left' }],
        }],
    };

    const burnOption = {
        grid: { top: 5, right: 5, bottom: 20, left: 30 },
        xAxis: {
            type: 'category',
            data: generateBurnLabels(),
            axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        },
        yAxis: {
            type: 'value',
            max: 100,
            axisLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', formatter: '{value}%' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        },
        series: [{
            data: generateBurnData(slo),
            type: 'line',
            smooth: true,
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${statusColor}40` }, { offset: 1, color: 'transparent' }] } },
            lineStyle: { color: statusColor, width: 2 },
            symbol: 'none',
        }],
        tooltip: { trigger: 'axis', formatter: (p) => `${p[0].name}: ${p[0].value}% remaining` },
    };

    return (
        <div className="glass-card p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white">{slo.service_name}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{slo.metric} — Target: {slo.target}{slo.metric_unit}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                    {STATUS_LABELS[slo.status]}
                </span>
            </div>

            {/* Gauge + Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="h-32">
                    <ReactECharts option={gaugeOption} style={{ height: '100%' }} opts={{ renderer: 'canvas' }} />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                    <div className="text-xs">
                        <span className="text-white/40 block">Current Value</span>
                        <span className="text-white font-bold text-lg">{slo.current_value}{slo.metric_unit}</span>
                    </div>
                    <div className="text-xs">
                        <span className="text-white/40 block">Burn Rate</span>
                        <span className="font-bold" style={{ color: slo.current_burn_rate > 0.8 ? '#ef4444' : slo.current_burn_rate > 0.5 ? '#f59e0b' : '#22c55e' }}>
                            {Math.round(slo.current_burn_rate * 100)}%
                        </span>
                    </div>
                    <div className="text-xs">
                        <span className="text-white/40 block">Window</span>
                        <span className="text-white font-medium">{slo.evaluation_window}</span>
                    </div>
                </div>
            </div>

            {/* Error Budget Burn-down */}
            <div>
                <h4 className="text-xs text-white/50 mb-1 font-semibold">Error Budget Burn-down</h4>
                <div className="h-28">
                    <ReactECharts option={burnOption} style={{ height: '100%' }} opts={{ renderer: 'canvas' }} />
                </div>
            </div>

            {/* Budget Bar */}
            <div>
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                    <span>Error Budget: {slo.error_budget_remaining}% / {slo.error_budget}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${budgetPercent}%`, backgroundColor: statusColor }} />
                </div>
            </div>
        </div>
    );
}

function generateBurnLabels() {
    const labels = [];
    for (let i = 30; i >= 0; i -= 5) labels.push(`${i}d ago`);
    labels.push('Now');
    return labels;
}

function generateBurnData(slo) {
    const points = [];
    const startBudget = 100;
    const dailyBurn = slo.current_burn_rate * 100 / 30;
    for (let i = 0; i <= 6; i++) {
        points.push(Math.max(0, Math.round(startBudget - dailyBurn * i * 5)));
    }
    return points;
}
