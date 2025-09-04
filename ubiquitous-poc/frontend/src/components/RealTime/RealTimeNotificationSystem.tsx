import React, { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Alert,
  Progress,
  NumberFormatter,
  Transition,
  Paper
} from '@mantine/core';
import {
  IconBell,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconShield,
  IconCurrencyDollar,
  IconTrendingUp,
  IconClock,
  IconTarget
} from '@tabler/icons-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { realTimeDataService, RealTimeVisualizationData } from '../../services/RealTimeDataService';

interface NotificationItem {
  id: string;
  type: 'scenario' | 'system' | 'alert';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
  scenarioId?: string;
  stepIndex?: number;
  businessImpact?: number;
  read: boolean;
  autoClose?: boolean;
}

interface RealTimeNotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoCloseDelay?: number;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

const RealTimeNotificationSystem: React.FC<RealTimeNotificationSystemProps> = ({
  position = 'top-right',
  maxNotifications = 5,
  autoCloseDelay = 8000,
  isOpen = false,
  onToggle,
  onUnreadCountChange
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  // Controlled by parent component now
  const isExpanded = isOpen;
  const { addNotification } = useNotification();
  const { subscribeToEvent, unsubscribeFromEvent } = useWebSocket();

  useEffect(() => {
    // Define callback functions for WebSocket events
    const handleScenarioUpdate = (data: any) => {
      addScenarioNotification(data);
    };

    const handleScenarioComplete = (data: any) => {
      addScenarioCompletionNotification(data);
    };

    const handleSystemUpdateEvent = (data: any) => {
      handleSystemUpdate(data);
    };

    // Subscribe to WebSocket scenario updates
    subscribeToEvent('scenario_update', handleScenarioUpdate);
    subscribeToEvent('scenario_complete', handleScenarioComplete);
    subscribeToEvent('system_update', handleSystemUpdateEvent);

    // Subscribe to real-time data service for visualization alerts
    const unsubscribeRealTime = realTimeDataService.subscribeToVisualization('alerts', (data) => {
      handleVisualizationAlerts(data);
    });

    return () => {
      unsubscribeFromEvent('scenario_update', handleScenarioUpdate);
      unsubscribeFromEvent('scenario_complete', handleScenarioComplete);
      unsubscribeFromEvent('system_update', handleSystemUpdateEvent);
      unsubscribeRealTime();
    };
  }, [subscribeToEvent, unsubscribeFromEvent]);

  // Auto-close notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => {
        const now = Date.now();
        return prev.filter(notification => {
          if (notification.autoClose && (now - notification.timestamp) > autoCloseDelay) {
            return false;
          }
          return true;
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoCloseDelay]);

  const addScenarioNotification = (data: any) => {
    const notification: NotificationItem = {
      id: `scenario-${data.scenarioId}-${data.stepIndex}-${Date.now()}`,
      type: 'scenario',
      severity: 'info',
      title: `Scenario Step ${data.stepIndex + 1}`,
      message: data.step?.description || `Advanced to step ${data.stepIndex + 1}`,
      timestamp: Date.now(),
      scenarioId: data.scenarioId,
      stepIndex: data.stepIndex,
      businessImpact: data.step?.impact?.financial,
      read: false,
      autoClose: true
    };

    addNotificationToQueue(notification);
    
    // Also add to Mantine notification system for important updates
    if (data.stepIndex === 0 || data.step?.impact?.financial > 1000000) {
      addNotification({
        type: 'info',
        title: notification.title,
        message: notification.message,
        autoClose: true
      });
    }
  };

  const addScenarioCompletionNotification = (data: any) => {
    const notification: NotificationItem = {
      id: `complete-${data.scenarioId}-${Date.now()}`,
      type: 'scenario',
      severity: 'success',
      title: 'Scenario Complete',
      message: `${data.summary?.title || 'Scenario completed successfully'}`,
      timestamp: Date.now(),
      scenarioId: data.scenarioId,
      businessImpact: data.summary?.total_value,
      read: false,
      autoClose: false
    };

    addNotificationToQueue(notification);
    
    // Always show completion in main notification system
    addNotification({
      type: 'success',
      title: notification.title,
      message: notification.message,
      autoClose: false
    });
  };

  const handleSystemUpdate = (data: any) => {
    // Only create notifications for significant system changes
    if (data.data?.cpu_utilization > 90 || data.data?.memory_usage > 95) {
      const notification: NotificationItem = {
        id: `system-${Date.now()}`,
        type: 'system',
        severity: data.data.cpu_utilization > 95 ? 'critical' : 'warning',
        title: 'System Resource Alert',
        message: `High resource usage: CPU ${data.data.cpu_utilization?.toFixed(1)}%, Memory ${data.data.memory_usage?.toFixed(1)}%`,
        timestamp: Date.now(),
        read: false,
        autoClose: true
      };

      addNotificationToQueue(notification);
    }
  };

  const handleVisualizationAlerts = (data: RealTimeVisualizationData) => {
    if (data.alerts) {
      data.alerts.forEach(alert => {
        const notification: NotificationItem = {
          id: `alert-${alert.timestamp}-${Math.random()}`,
          type: 'alert',
          severity: alert.severity,
          title: `${alert.severity.toUpperCase()} Alert`,
          message: alert.message,
          timestamp: alert.timestamp,
          read: false,
          autoClose: alert.severity !== 'critical'
        };

        addNotificationToQueue(notification);
      });
    }
  };

  const addNotificationToQueue = (notification: NotificationItem) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (notification: NotificationItem) => {
    switch (notification.type) {
      case 'scenario':
        return <IconTarget size={16} />;
      case 'system':
        return <IconTrendingUp size={16} />;
      case 'alert':
        return notification.severity === 'critical' ? <IconAlertTriangle size={16} /> : <IconInfoCircle size={16} />;
      default:
        return <IconBell size={16} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'success': return 'green';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Mark all as read when panel opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    }
  }, [isOpen]);
  
  const positionStyles = {
    'top-right': { top: 70, right: 20 },
    'top-left': { top: 70, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card
      shadow="xl"
      padding="md"
      radius="md"
      withBorder
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: 380,
        maxHeight: '70vh',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 31, 63, 0.2)',
        transition: 'all 0.3s ease'
      }}
    >
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBell size={20} color="var(--mantine-color-cg-navy-6)" />
            <Text size="sm" fw={600} c="cg-navy.6">
              Live Updates
            </Text>
            {unreadCount > 0 && (
              <Badge color="red" size="sm" circle>
                {unreadCount}
              </Badge>
            )}
          </Group>
          
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => onToggle?.(false)}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>

        {/* Notifications List */}
        <Stack gap="sm">
            {notifications.length > 0 && (
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed">
                  {notifications.length} notifications
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={clearAllNotifications}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            )}

            <ScrollArea style={{ maxHeight: '50vh' }}>
              <Stack gap="xs">
                {notifications.map((notification, index) => (
                  <Transition
                    key={notification.id}
                    mounted={true}
                    transition="slide-left"
                    duration={300}
                    timingFunction="ease-out"
                  >
                    {(styles) => (
                      <Paper
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                          ...styles,
                          backgroundColor: notification.read ? 'var(--mantine-color-gray-0)' : 'white',
                          borderColor: notification.read ? 'var(--mantine-color-gray-3)' : `var(--mantine-color-${getSeverityColor(notification.severity)}-3)`,
                          cursor: 'pointer'
                        }}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Group justify="space-between" align="flex-start" gap="sm">
                          <Group gap="xs" align="flex-start">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color={getSeverityColor(notification.severity)}
                            >
                              {getNotificationIcon(notification)}
                            </ActionIcon>
                            
                            <Stack gap="xs" style={{ flex: 1 }}>
                              <Group justify="space-between" align="center">
                                <Text size="xs" fw={600} c={getSeverityColor(notification.severity)}>
                                  {notification.title}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </Text>
                              </Group>
                              
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {notification.message}
                              </Text>
                              
                              {notification.businessImpact && notification.businessImpact > 0 && (
                                <Group gap="xs">
                                  <IconCurrencyDollar size={12} color="var(--mantine-color-green-6)" />
                                  <NumberFormatter
                                    value={notification.businessImpact}
                                    prefix="$"
                                    thousandSeparator=","
                                    decimalScale={0}
                                    style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--mantine-color-green-6)' }}
                                  />
                                </Group>
                              )}
                            </Stack>
                          </Group>
                          
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="gray"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <IconX size={10} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    )}
                  </Transition>
                ))}
                
                {notifications.length === 0 && (
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap="xs" align="center">
                      <IconBell size={24} color="var(--mantine-color-gray-5)" />
                      <Text size="sm" c="dimmed" ta="center">
                        No active notifications
                      </Text>
                      <Text size="xs" c="dimmed" ta="center">
                        Real-time updates will appear here
                      </Text>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </ScrollArea>
        </Stack>
      </Stack>
    </Card>
  );
};

export default RealTimeNotificationSystem;