import { useState, useMemo, memo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactEChartsCore from 'echarts-for-react';
import { loanAPI } from '../api';
import { useTheme } from '../context/ThemeContext';

/* ─────── Constants ─────── */
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const OCCUPATION_OPTIONS = ['Engineer', 'Doctor', 'Teacher', 'Accountant', 'Lawyer', 'Artist', 'Entrepreneur', 'Student', 'Retired', 'Other'];
const EDUCATION_OPTIONS = ["High School", "Associate's", "Bachelor's", "Master's", "PhD"];
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];

const INITIAL_FORM = {
    age: 30, gender: 'Male', occupation: 'Engineer',
    education_level: "Bachelor's", marital_status: 'Single',
    income: 60000, credit_score: 700,
};

/* ─────── Small Sub-Components ─────── */
const StatCard = memo(function StatCard({ label, value, color, subtitle }) {
    return (
        <div className="glass-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{subtitle}</p>}
        </div>
    );
});

/* ─────── Confidence Gauge ─────── */
const ConfidenceGauge = memo(function ConfidenceGauge({ value, approved }) {
    const { isDark } = useTheme();
    const color = approved ? '#22c55e' : '#ef4444';

    const option = useMemo(() => ({
        series: [{
            type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 100,
            pointer: { show: true, length: '55%', width: 4, itemStyle: { color } },
            progress: { show: true, width: 12, roundCap: true, itemStyle: { color } },
            axisLine: { lineStyle: { width: 12, color: [[1, isDark ? '#252525' : '#f0e6d2']] } },
            axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
            detail: {
                fontSize: 24, fontWeight: 'bold', offsetCenter: [0, '20%'],
                formatter: '{value}%', color,
            },
            title: { offsetCenter: [0, '55%'], fontSize: 12, color: isDark ? '#a4a4a4' : '#8b7355' },
            data: [{ value: Math.round(value * 100), name: approved ? 'Approved' : 'Denied' }],
        }],
    }), [value, approved, isDark, color]);

    return <ReactEChartsCore option={option} style={{ height: 200 }} opts={{ renderer: 'svg' }} />;
});

/* ─────── Feature Importance Chart ─────── */
const FeatureImportanceChart = memo(function FeatureImportanceChart({ importances }) {
    const { isDark } = useTheme();
    if (!importances || Object.keys(importances).length === 0) return null;

    // Sort descending, take top 12
    const sorted = Object.entries(importances).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const names = sorted.map(([n]) => n.replace(/_/g, ' '));
    const values = sorted.map(([, v]) => v);

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            backgroundColor: isDark ? '#1a1a1a' : '#fdf8f0',
            borderColor: isDark ? '#383838' : '#e8d5b5',
            textStyle: { color: isDark ? '#fef9c3' : '#332b1e', fontSize: 11 },
        },
        grid: { top: 10, right: 20, bottom: 5, left: 10, containLabel: true },
        xAxis: {
            type: 'value',
            axisLabel: { color: isDark ? '#666' : '#9c8d74', fontSize: 10 },
            splitLine: { lineStyle: { color: isDark ? '#252525' : '#f5e6cc' } },
        },
        yAxis: {
            type: 'category', data: names.reverse(),
            axisLabel: { color: isDark ? '#a4a4a4' : '#6f5b3e', fontSize: 10 },
            axisLine: { lineStyle: { color: isDark ? '#383838' : '#e8d5b5' } },
        },
        series: [{
            type: 'bar', data: values.reverse(), barWidth: '60%',
            itemStyle: {
                borderRadius: [0, 4, 4, 0],
                color: {
                    type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                        { offset: 0, color: isDark ? '#d4a017' : '#6f5b3e' },
                        { offset: 1, color: isDark ? '#facc15' : '#b8960b' },
                    ],
                },
            },
        }],
    }), [names, values, isDark]);

    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Feature Importance</h3>
            <ReactEChartsCore option={option} style={{ height: 320 }} opts={{ renderer: 'svg' }} />
        </div>
    );
});

/* ─────── Confusion Matrix ─────── */
const ConfusionMatrix = memo(function ConfusionMatrix({ matrix }) {
    const { isDark } = useTheme();
    if (!matrix || matrix.length < 2) return null;

    const labels = ['Denied', 'Approved'];
    const data = [];
    const maxVal = Math.max(...matrix.flat());
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            data.push([j, i, matrix[i][j]]);
        }
    }

    const option = useMemo(() => ({
        tooltip: {
            position: 'top',
            formatter: (p) => `Actual: ${labels[p.value[1]]}<br/>Predicted: ${labels[p.value[0]]}<br/>Count: ${p.value[2]}`,
            backgroundColor: isDark ? '#1a1a1a' : '#fdf8f0',
            textStyle: { color: isDark ? '#fef9c3' : '#332b1e', fontSize: 11 },
        },
        grid: { top: 30, right: 10, bottom: 40, left: 80 },
        xAxis: {
            type: 'category', data: labels, name: 'Predicted', nameLocation: 'middle', nameGap: 25,
            axisLabel: { color: isDark ? '#a4a4a4' : '#6f5b3e', fontSize: 11 },
            nameTextStyle: { color: isDark ? '#a4a4a4' : '#8b7355', fontSize: 11 },
        },
        yAxis: {
            type: 'category', data: labels, name: 'Actual', nameLocation: 'middle', nameGap: 55,
            axisLabel: { color: isDark ? '#a4a4a4' : '#6f5b3e', fontSize: 11 },
            nameTextStyle: { color: isDark ? '#a4a4a4' : '#8b7355', fontSize: 11 },
        },
        visualMap: {
            min: 0, max: maxVal, show: false, inRange: {
                color: isDark
                    ? ['#1a1a1a', '#3b2e10', '#6f5b3e', '#d4a017', '#facc15']
                    : ['#fdf8f0', '#f5e6cc', '#d4a017', '#b8860b', '#6f5b3e'],
            },
        },
        series: [{
            type: 'heatmap', data,
            label: { show: true, color: isDark ? '#fef9c3' : '#332b1e', fontSize: 16, fontWeight: 'bold' },
            itemStyle: { borderRadius: 4, borderColor: isDark ? '#0d0d0d' : '#fdf8f0', borderWidth: 3 },
        }],
    }), [matrix, isDark]);

    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Confusion Matrix</h3>
            <ReactEChartsCore option={option} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
        </div>
    );
});

/* ─────── Prediction Result Card ─────── */
function PredictionResult({ result }) {
    if (!result) return null;
    const approved = result.approved;
    return (
        <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -z-10"
                style={{ background: approved ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)' }} />

            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Prediction Result</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-lg font-bold"
                        style={{
                            backgroundColor: approved ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: approved ? '#22c55e' : '#ef4444',
                            border: `1px solid ${approved ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                        {approved ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        )}
                        Loan {result.prediction}
                    </div>
                    <div className="mt-3 flex justify-center gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
                        <span>Approved: <strong style={{ color: '#22c55e' }}>{(result.probability_approved * 100).toFixed(1)}%</strong></span>
                        <span>Denied: <strong style={{ color: '#ef4444' }}>{(result.probability_denied * 100).toFixed(1)}%</strong></span>
                    </div>
                </div>
                <ConfidenceGauge value={result.confidence} approved={approved} />
            </div>
        </div>
    );
}

/* ─────── Prediction History Table ─────── */
const PredictionHistory = memo(function PredictionHistory({ history }) {
    const { isDark } = useTheme();
    if (!history || history.length === 0) return null;

    return (
        <div className="glass-card p-5 overflow-x-auto">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Recent Predictions</h3>
            <table className="w-full text-xs">
                <thead>
                    <tr style={{ borderBottom: `1px solid var(--border-secondary)` }}>
                        {['#', 'Age', 'Gender', 'Occupation', 'Income', 'Credit', 'Result', 'Confidence'].map((h) => (
                            <th key={h} className="py-2 px-3 text-left font-medium uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, idx) => (
                        <tr key={idx} className="transition-colors" style={{ borderBottom: '1px solid var(--border-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(212,160,23,0.04)' : 'rgba(111,91,62,0.03)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td className="py-2 px-3" style={{ color: 'var(--text-faint)' }}>{history.length - idx}</td>
                            <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.input.age}</td>
                            <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.input.gender}</td>
                            <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.input.occupation}</td>
                            <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>${item.input.income?.toLocaleString()}</td>
                            <td className="py-2 px-3" style={{ color: 'var(--text-primary)' }}>{item.input.credit_score}</td>
                            <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: item.result.approved ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                        color: item.result.approved ? '#22c55e' : '#ef4444',
                                    }}>
                                    {item.result.prediction}
                                </span>
                            </td>
                            <td className="py-2 px-3" style={{ color: 'var(--accent-primary)' }}>{(item.result.confidence * 100).toFixed(1)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function LoanPredictionPage() {
    const { isDark } = useTheme();
    const [form, setForm] = useState(INITIAL_FORM);
    const [lastResult, setLastResult] = useState(null);
    const [predictionHistory, setPredictionHistory] = useState([]);

    // Fetch model summary for dashboard analytics
    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['loanModelSummary'],
        queryFn: loanAPI.modelSummary,
        staleTime: 120000,
        retry: 1,
    });

    // Mutation for prediction
    const predictMutation = useMutation({
        mutationFn: loanAPI.predict,
        onSuccess: (result) => {
            setLastResult(result);
            setPredictionHistory((prev) => [{ input: { ...form }, result }, ...prev].slice(0, 20));
        },
    });

    const handleChange = useCallback((field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        predictMutation.mutate({
            ...form,
            age: parseInt(form.age),
            income: parseFloat(form.income),
            credit_score: parseInt(form.credit_score),
        });
    };

    const tm = summary?.training_metrics || {};
    const modelAvailable = summary?.model_available;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Loan Prediction Dashboard</h2>
                {modelAvailable && (
                    <span className="text-xs px-3 py-1 rounded-full" style={{
                        backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e',
                        border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        Model Active
                    </span>
                )}
            </div>

            {/* ─── Model Performance Metrics ─── */}
            {summaryLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => <div key={i} className="glass-card h-20" />)}
                </div>
            ) : modelAvailable ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Accuracy" value={`${(tm.accuracy * 100).toFixed(1)}%`} color="#22c55e" subtitle={`CV F1: ${tm.cv_f1_mean?.toFixed(3) || '—'}`} />
                    <StatCard label="Precision" value={`${(tm.precision * 100).toFixed(1)}%`} color="#3b82f6" />
                    <StatCard label="Recall" value={`${(tm.recall * 100).toFixed(1)}%`} color="#8b5cf6" />
                    <StatCard label="F1 Score" value={`${(tm.f1 * 100).toFixed(1)}%`} color="#ec4899" />
                    <StatCard label="ROC-AUC" value={`${(tm.roc_auc * 100).toFixed(1)}%`} color={isDark ? '#facc15' : '#b8860b'} subtitle={`${summary.n_test} test samples`} />
                </div>
            ) : (
                <div className="glass-card p-6 text-center" style={{ color: 'var(--text-faint)' }}>
                    <p className="text-sm">Model not trained yet. Train the model first by running the pipeline.</p>
                </div>
            )}

            {/* ─── Main Grid: Form + Result ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loan Application Form */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Loan Application</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Age */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Age</label>
                                <input type="number" min={18} max={100} value={form.age}
                                    onChange={(e) => handleChange('age', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border transition-colors"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            {/* Gender */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Gender</label>
                                <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            {/* Occupation */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Occupation</label>
                                <select value={form.occupation} onChange={(e) => handleChange('occupation', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {OCCUPATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            {/* Education */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Education Level</label>
                                <select value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {EDUCATION_OPTIONS.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
                                </select>
                            </div>
                            {/* Marital Status */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Marital Status</label>
                                <select value={form.marital_status} onChange={(e) => handleChange('marital_status', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {MARITAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            {/* Income */}
                            <div>
                                <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>Annual Income ($)</label>
                                <input type="number" min={0} step={1000} value={form.income}
                                    onChange={(e) => handleChange('income', e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none border"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                        {/* Credit Score — full width slider + number */}
                        <div>
                            <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>
                                Credit Score: <span style={{ color: 'var(--accent-primary)' }}>{form.credit_score}</span>
                            </label>
                            <input type="range" min={300} max={850} value={form.credit_score}
                                onChange={(e) => handleChange('credit_score', parseInt(e.target.value))}
                                className="w-full accent-amber-500"
                            />
                            <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                                <span>300 (Poor)</span><span>580</span><span>670</span><span>740</span><span>850 (Excellent)</span>
                            </div>
                        </div>
                        {/* Submit */}
                        <button type="submit" disabled={predictMutation.isPending}
                            className="w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-200"
                            style={{
                                background: isDark ? 'linear-gradient(135deg, #d4a017, #b8860b)' : 'linear-gradient(135deg, #6f5b3e, #5a4a32)',
                                color: isDark ? '#0d0d0d' : '#fef9c3',
                                opacity: predictMutation.isPending ? 0.7 : 1,
                            }}>
                            {predictMutation.isPending ? 'Analyzing…' : 'Predict Loan Approval'}
                        </button>
                        {predictMutation.isError && (
                            <p className="text-xs text-red-500 mt-1">Error: {predictMutation.error?.message || 'Prediction failed. Is the ML API running?'}</p>
                        )}
                    </form>
                </div>

                {/* Prediction Result */}
                {lastResult ? (
                    <PredictionResult result={lastResult} />
                ) : (
                    <div className="glass-card p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
                        <div className="text-center" style={{ color: 'var(--text-faint)' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="mx-auto mb-3 opacity-40">
                                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 8v4l3 3" />
                            </svg>
                            <p className="text-sm">Submit an application to see the prediction</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Analytics Row: Feature Importance + Confusion Matrix ─── */}
            {modelAvailable && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FeatureImportanceChart importances={summary?.feature_importances} />
                    <ConfusionMatrix matrix={tm.confusion_matrix} />
                </div>
            )}

            {/* ─── Model Info Card ─── */}
            {modelAvailable && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Model Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InfoItem label="Algorithm" value="Random Forest" />
                        <InfoItem label="Trees" value={summary?.model_params?.n_estimators || '—'} />
                        <InfoItem label="Max Depth" value={summary?.model_params?.max_depth || '—'} />
                        <InfoItem label="Trained At" value={summary?.trained_at ? new Date(summary.trained_at).toLocaleDateString() : '—'} />
                        <InfoItem label="Training Samples" value={summary?.n_train?.toLocaleString() || '—'} />
                        <InfoItem label="Test Samples" value={summary?.n_test?.toLocaleString() || '—'} />
                        <InfoItem label="Class Weight" value={summary?.model_params?.class_weight || '—'} />
                        <InfoItem label="Features" value={summary?.features?.length || '—'} />
                    </div>
                </div>
            )}

            {/* ─── Prediction History ─── */}
            <PredictionHistory history={predictionHistory} />
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{String(value)}</p>
        </div>
    );
}
