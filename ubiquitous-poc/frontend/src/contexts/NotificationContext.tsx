import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: NotificationType, title: string, message?: string, duration?: number) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearAllNotifications: () => {},
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      duration,
    };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
};

const NotificationDisplay: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            backgroundColor: getBackgroundColor(notification.type),
            color: 'white',
            padding: '12px 16px',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '300px',
            maxWidth: '400px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {getIcon(notification.type)} {notification.title}
            </div>
            {notification.message && (
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                {notification.message}
              </div>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 0 0 12px',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

function getBackgroundColor(type: NotificationType): string {
  switch (type) {
    case 'success': return '#48bb78';
    case 'error': return '#f56565';
    case 'warning': return '#ed8936';
    case 'info': return '#4299e1';
    default: return '#718096';
  }
}

function getIcon(type: NotificationType): string {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ⓘ';
    default: return '';
  }
}