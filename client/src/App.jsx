import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

// Route-based lazy loading
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const MLMonitoringPage = lazy(() => import('./pages/MLMonitoringPage'));
const LLMMonitoringPage = lazy(() => import('./pages/LLMMonitoringPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const GovernancePage = lazy(() => import('./pages/GovernancePage'));

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingFallback />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={
                    <Suspense fallback={<LoadingFallback />}>
                        <OverviewPage />
                    </Suspense>
                } />
                <Route path="ml-monitoring" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <MLMonitoringPage />
                    </Suspense>
                } />
                <Route path="llm-monitoring" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <LLMMonitoringPage />
                    </Suspense>
                } />
                <Route path="alerts" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <AlertsPage />
                    </Suspense>
                } />
                <Route path="governance" element={
                    <Suspense fallback={<LoadingFallback />}>
                        <GovernancePage />
                    </Suspense>
                } />
            </Route>
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
    );
}
