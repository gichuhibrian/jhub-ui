import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProjectMessage } from '@/services/conversationService';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export function useConversationSocket(projectId: string | undefined, token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<ProjectMessage | null>(null);
  const [messageUpdate, setMessageUpdate] = useState<any>(null);
  const [reactionUpdate, setReactionUpdate] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId || !token) return;

    // Create socket connection
    const socket = io(`${SOCKET_URL}/conversations`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to conversations socket');
      setIsConnected(true);
      socket.emit('joinProject', projectId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from conversations socket');
      setIsConnected(false);
    });

    socket.on('newMessage', (message: ProjectMessage) => {
      setNewMessage(message);
    });

    socket.on('messageUpdated', (data: any) => {
      setMessageUpdate(data);
    });

    socket.on('reactionUpdated', (data: any) => {
      setReactionUpdate(data);
    });

    socket.on('userTyping', (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => new Set(prev).add(data.userName));
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userName);
          return next;
        });
      }, 3000);
    });

    socket.on('userStoppedTyping', (data: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        // Remove by userId (we'd need to track userId->userName mapping)
        return next;
      });
    });

    return () => {
      if (socket) {
        socket.emit('leaveProject', projectId);
        socket.disconnect();
      }
    };
  }, [projectId, token]);

  const sendTyping = (userName: string) => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('typing', { projectId, userName });
    }
  };

  const sendStopTyping = () => {
    if (socketRef.current && projectId) {
      socketRef.current.emit('stopTyping', projectId);
    }
  };

  return {
    isConnected,
    newMessage,
    messageUpdate,
    reactionUpdate,
    typingUsers: Array.from(typingUsers),
    sendTyping,
    sendStopTyping,
  };
}
