import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useStore';

let socket: Socket | null = null;

export function useNotifications() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  const connectSocket = useCallback(() => {
    if (!token || socket?.connected) return;

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    socket = io(`${backendUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ Notifications WebSocket connected');
    });

    socket.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      
      // Optionally show a toast notification
      // toast.info(notification.title);
    });

    socket.on('unreadCount', (count) => {
      console.log('📊 Unread count updated:', count);
      
      // Update the unread count in cache
      queryClient.setQueryData(['notifications', 'unread-count'], count);
    });

    socket.on('disconnect', () => {
      console.log('❌ Notifications WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return socket;
  }, [token, queryClient]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }, []);

  useEffect(() => {
    if (token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [token, connectSocket, disconnectSocket]);

  return { socket };
}
