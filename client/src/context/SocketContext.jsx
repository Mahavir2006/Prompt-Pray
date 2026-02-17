import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

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
    const { isAuthenticated } = useAuth();
    const pollingRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Establish single WebSocket connection
        const socket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WS] Connected');
            setConnected(true);
            // Clear polling fallback
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        });

        socket.on('disconnect', () => {
            console.log('[WS] Disconnected — activating polling fallback');
            setConnected(false);
            // Activate polling fallback
            pollingRef.current = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['overview'] });
                queryClient.invalidateQueries({ queryKey: ['alerts'] });
            }, 30000);
        });

        // --- Event: metricUpdate ---
        socket.on('metricUpdate', (data) => {
            setLastEvent({ type: 'metricUpdate', data, timestamp: Date.now() });
            // Invalidate overview cache
            queryClient.invalidateQueries({ queryKey: ['overview'] });
            // Invalidate specific model metrics
            queryClient.invalidateQueries({ queryKey: ['metrics', data.modelId] });
        });

        // --- Event: alertCreated ---
        socket.on('alertCreated', (alert) => {
            setLastEvent({ type: 'alertCreated', data: alert, timestamp: Date.now() });
            // Update alerts query cache — prepend new alert
            queryClient.setQueryData(['alerts'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: [alert, ...(old.data || [])].slice(0, 50),
                    total: (old.total || 0) + 1,
                };
            });
            // Invalidate alert stats and overview
            queryClient.invalidateQueries({ queryKey: ['alertStats'] });
            queryClient.invalidateQueries({ queryKey: ['overview'] });
        });

        // --- Event: alertResolved ---
        socket.on('alertResolved', ({ alertId }) => {
            setLastEvent({ type: 'alertResolved', data: { alertId }, timestamp: Date.now() });
            // Update the specific alert in cache
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
    }, [isAuthenticated, queryClient]);

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
