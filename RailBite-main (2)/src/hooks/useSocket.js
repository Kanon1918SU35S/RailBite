import { useEffect, useRef, useCallback, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

/**
 * Custom hook for Socket.IO real-time connection.
 *
 * Usage:
 *   const { socket, isConnected, joinOrder, leaveOrder } = useSocket();
 *
 *   // Listen for order status updates
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on('orderStatusUpdate', (data) => { ... });
 *     return () => socket.off('orderStatusUpdate');
 *   }, [socket]);
 */
export function useSocket() {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('railbiteToken');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket.IO] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket.IO] Connection error:', err.message);
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, []);

    const joinOrder = useCallback((orderId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('joinOrder', orderId);
        }
    }, []);

    const leaveOrder = useCallback((orderId) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('leaveOrder', orderId);
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        joinOrder,
        leaveOrder
    };
}

export default useSocket;
