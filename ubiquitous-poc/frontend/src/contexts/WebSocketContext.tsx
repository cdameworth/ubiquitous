import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  connected: boolean;
  subscribeToEvent: (event: string, callback: (data: any) => void) => void;
  unsubscribeFromEvent: (event: string, callback: (data: any) => void) => void;
  send: (data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  subscribeToEvent: () => {},
  unsubscribeFromEvent: () => {},
  send: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const listeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connectWebSocket = () => {
      try {
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          reconnectAttempts = 0;
        };

        newSocket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          setConnected(false);
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        };

        newSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnected(false);
        };

        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const eventType = data.type || 'message';
            
            // Notify all listeners for this event type
            const eventListeners = listeners.current.get(eventType);
            if (eventListeners) {
              eventListeners.forEach(callback => callback(data));
            }
            
            // Log specific event types
            if (eventType === 'metrics_update') {
              console.log('Metrics update received:', data);
            } else if (eventType === 'alert') {
              console.log('Alert received:', data);
            } else if (eventType === 'system_update') {
              console.log('System update received:', data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        setSocket(newSocket);
        return newSocket;
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnected(false);
        return null;
      }
    };

    const ws = connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, []);

  const subscribeToEvent = useCallback((event: string, callback: (data: any) => void) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, new Set());
    }
    listeners.current.get(event)!.add(callback);
  }, []);

  const unsubscribeFromEvent = useCallback((event: string, callback: (data: any) => void) => {
    const eventListeners = listeners.current.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        listeners.current.delete(event);
      }
    }
  }, []);

  const send = useCallback((data: any) => {
    if (socket && connected && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }, [socket, connected]);

  return (
    <WebSocketContext.Provider value={{ socket, connected, subscribeToEvent, unsubscribeFromEvent, send }}>
      {children}
    </WebSocketContext.Provider>
  );
};