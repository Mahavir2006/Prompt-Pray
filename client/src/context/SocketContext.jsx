import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
};

export function SocketProvider({ children }) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);
    const queryClient = useQueryClient();
    const { isAuthenticated, token } = useAuth();
    const pollingRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Skip WebSocket if using demo token (no backend) or on Vercel
        const isDemoMode = token?.startsWith('demo_');
        if (isDemoMode) {
            console.log('[WS] Demo mode — skipping WebSocket, using polling fallback');
            setConnected(false);
            // Polling fallback for demo mode
            pollingRef.current = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['overview'] });
                queryClient.invalidateQueries({ queryKey: ['alerts'] });
            }, 30000);
            return () => {
                if (pollingRef.current) clearInterval(pollingRef.current);
            };
        }

        // Connect to the backend WebSocket URL
        const wsUrl = API_URL || window.location.origin;
        const socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WS] Connected');
            setConnected(true);
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        });

        socket.on('disconnect', () => {
            console.log('[WS] Disconnected — activating polling fallback');
            setConnected(false);
            pollingRef.current = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['overview'] });
                queryClient.invalidateQueries({ queryKey: ['alerts'] });
            }, 30000);
        });

        // Give up after max reconnection attempts
        socket.on('reconnect_failed', () => {
            console.log('[WS] Reconnection failed — falling back to polling');
            setConnected(false);
        });

        // --- Event: metricUpdate ---
        socket.on('metricUpdate', (data) => {
            setLastEvent({ type: 'metricUpdate', data, timestamp: Date.now() });
            queryClient.invalidateQueries({ queryKey: ['overview'] });
            queryClient.invalidateQueries({ queryKey: ['metrics', data.modelId] });
        });

        // --- Event: alertCreated ---
        socket.on('alertCreated', (alert) => {
            setLastEvent({ type: 'alertCreated', data: alert, timestamp: Date.now() });
            queryClient.setQueryData(['alerts'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: [alert, ...(old.data || [])].slice(0, 50),
                    total: (old.total || 0) + 1,
                };
            });
            queryClient.invalidateQueries({ queryKey: ['alertStats'] });
            queryClient.invalidateQueries({ queryKey: ['overview'] });
        });

        // --- Event: alertResolved ---
        socket.on('alertResolved', ({ alertId }) => {
            setLastEvent({ type: 'alertResolved', data: { alertId }, timestamp: Date.now() });
            queryClient.setQueryData(['alerts'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: old.data.map(a => a._id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['alertStats'] });
            queryClient.invalidateQueries({ queryKey: ['overview'] });
        });

        return () => {
            socket.disconnect();
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isAuthenticated, token, queryClient]);

    const subscribe = useCallback((modelId) => {
        socketRef.current?.emit('subscribe:model', modelId);
    }, []);

    const unsubscribe = useCallback((modelId) => {
        socketRef.current?.emit('unsubscribe:model', modelId);
    }, []);

    return (
        <SocketContext.Provider value={{ connected, lastEvent, subscribe, unsubscribe }}>
            {children}
        </SocketContext.Provider>
    );
}

