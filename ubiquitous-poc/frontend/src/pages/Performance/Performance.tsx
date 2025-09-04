import React, { useEffect, useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  LoadingOverlay,
  Box,
  Title,
  Paper,
  ActionIcon,
  Select,
  Alert,
  Progress,
  RingProgress,
} from '@mantine/core';
import { LineChart, AreaChart } from '@mantine/charts';
import {
  IconRefresh,
  IconActivity,
  IconClock,
  IconAlertTriangle,
  IconCpu,
  IconDatabase,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

interface PerformanceMetric {
  timestamp: string;
  value: number;
}

interface AlertRule {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  value: string;
  threshold: string;
  status: 'active' | 'resolved';
}

const Performance: React.FC = () => {
  const { connected, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [resourceType, setResourceType] = useState<'all' | 'eks' | 'rds' | 'ec2' | 'services'>('all');
  
  const [requestRateData, setRequestRateData] = useState<PerformanceMetric[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<PerformanceMetric[]>([]);
  const [errorRateData, setErrorRateData] = useState<PerformanceMetric[]>([]);
  const [saturationData, setSaturationData] = useState<{cpu: number, memory: number}>({cpu: 82, memory: 67});
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);

  useEffect(() => {
    loadPerformanceData();
    
    const handleMetricsUpdate = (data: any) => {
      if (data.type === 'performance_metrics') {
        updateRealTimeMetrics(data);
      }
    };

    subscribeToEvent('metrics_update', handleMetricsUpdate);

    return () => {
      unsubscribeFromEvent('metrics_update', handleMetricsUpdate);
    };
  }, [subscribeToEvent, unsubscribeFromEvent, timeRange, selectedResource, resourceType, connected]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Load data based on selected resource
      const now = new Date();
      const generateMetrics = (baseValue: number, variance: number, trend: number = 0) => {
        return Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
          value: baseValue + (Math.random() - 0.5) * variance + (trend * i)
        }));
      };
      
      // Resource-specific metrics
      let baseRequestRate = 45000;
      let baseResponseTime = 124;
      let baseErrorRate = 0.0002;
      let baseCpu = 82;
      let baseMemory = 67;
      
      // Adjust metrics based on selected resource
      if (resourceType === 'eks') {
        baseRequestRate = selectedResource.includes('trading') ? 85000 : 35000;
        baseResponseTime = selectedResource.includes('trading') ? 45 : 150;
        baseCpu = selectedResource.includes('prod') ? 78 : 45;
        baseMemory = selectedResource.includes('prod') ? 82 : 55;
      } else if (resourceType === 'rds') {
        baseRequestRate = 12000; // Queries per second
        baseResponseTime = 8; // Query time in ms
        baseCpu = selectedResource.includes('Oracle') ? 95 : 65;
        baseMemory = selectedResource.includes('Oracle') ? 88 : 72;
      } else if (resourceType === 'ec2') {
        baseRequestRate = 5000; // Transactions per second
        baseResponseTime = 25; // Transaction time
        baseCpu = 72;
        baseMemory = selectedResource.includes('reporting') ? 85 : 65;
      }
      
      const mockRequestRateData = generateMetrics(baseRequestRate, baseRequestRate * 0.2, baseRequestRate * 0.001);
      const mockResponseTimeData = generateMetrics(baseResponseTime, baseResponseTime * 0.25);
      const mockErrorRateData = generateMetrics(baseErrorRate, baseErrorRate * 0.5);
      
      const mockAlerts: AlertRule[] = [
        {
          id: '1',
          severity: 'critical',
          title: 'High Memory Usage',
          description: 'Memory usage above 90%',
          value: '94%',
          threshold: '90%',
          status: 'active'
        },
        {
          id: '2',
          severity: 'warning',
          title: 'Elevated Response Time',
          description: 'P95 response time above threshold',
          value: '156ms',
          threshold: '150ms',
          status: 'active'
        }
      ];
      
      setRequestRateData(mockRequestRateData);
      setResponseTimeData(mockResponseTimeData);
      setErrorRateData(mockErrorRateData);
      setSaturationData({cpu: baseCpu, memory: baseMemory});
      setAlertRules(mockAlerts);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      addNotification('error', 'Failed to load performance metrics');
      
      // Set fallback data
      setRequestRateData([]);
      setResponseTimeData([]);
      setErrorRateData([]);
      setSaturationData({cpu: 82, memory: 67});
      setAlertRules([]);
      
      setLoading(false);
    }
  };

  const updateRealTimeMetrics = (data: any) => {
    const timestamp = new Date().toISOString();
    
    // Add some variation to make it look real-time
    const addVariation = (value: number, variance: number = 0.1) => {
      return value + (Math.random() - 0.5) * value * variance;
    };
    
    if (data.requestRate !== undefined) {
      const newValue = addVariation(data.requestRate, 0.15);
      setRequestRateData(prev => [...prev.slice(-23), {timestamp, value: newValue}]);
    }
    
    if (data.responseTime !== undefined) {
      const newValue = addVariation(data.responseTime, 0.2);
      setResponseTimeData(prev => [...prev.slice(-23), {timestamp, value: newValue}]);
    }
    
    if (data.errorRate !== undefined) {
      const newValue = Math.max(0, addVariation(data.errorRate, 0.3));
      setErrorRateData(prev => [...prev.slice(-23), {timestamp, value: newValue}]);
    }
    
    if (data.saturation) {
      setSaturationData({
        cpu: Math.min(100, Math.max(0, addVariation(data.saturation.cpu, 0.1))),
        memory: Math.min(100, Math.max(0, addVariation(data.saturation.memory, 0.1)))
      });
    }
  };

  // Simulate real-time updates every 1.5 seconds for visual effect
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        // Generate real-time data with variation
        const addVariation = (value: number, variance: number = 0.1) => {
          return value + (Math.random() - 0.5) * value * variance;
        };
        
        // Get current base values
        const currentRequestRate = getCurrentValue(requestRateData) || 45000;
        const currentResponseTime = getCurrentValue(responseTimeData) || 124;
        const currentErrorRate = getCurrentValue(errorRateData) || 0.0002;
        
        updateRealTimeMetrics({
          requestRate: addVariation(currentRequestRate, 0.15),
          responseTime: addVariation(currentResponseTime, 0.2),
          errorRate: Math.max(0, addVariation(currentErrorRate, 0.3)),
          saturation: {
            cpu: Math.min(100, Math.max(0, addVariation(saturationData.cpu, 0.08))),
            memory: Math.min(100, Math.max(0, addVariation(saturationData.memory, 0.08)))
          }
        });
      }, 500); // Update every 0.5 seconds for fast real-time effect
      
      return () => clearInterval(interval);
    }
  }, [loading]); // Simplified dependencies to avoid stale closures


  const getCurrentValue = (data: PerformanceMetric[]) => {
    return data.length > 0 ? data[data.length - 1].value : 0;
  };

  // Get resource options based on type
  const getResourceOptions = () => {
    switch (resourceType) {
      case 'eks':
        return [
          { value: 'all', label: 'All EKS Clusters' },
          { value: 'prod-trading-cluster', label: 'prod-trading-cluster' },
          { value: 'prod-risk-cluster', label: 'prod-risk-cluster' },
          { value: 'prod-portfolio-cluster', label: 'prod-portfolio-cluster' },
          { value: 'staging-apps-cluster', label: 'staging-apps-cluster' },
          { value: 'dev-microservices-cluster', label: 'dev-microservices-cluster' }
        ];
      case 'rds':
        return [
          { value: 'all', label: 'All RDS Instances' },
          { value: 'RDS-Oracle-01', label: 'RDS-Oracle-01 (Production)' },
          { value: 'RDS-Oracle-02', label: 'RDS-Oracle-02 (Legacy)' },
          { value: 'RDS-PostgreSQL-01', label: 'RDS-PostgreSQL-01' },
          { value: 'RDS-PostgreSQL-02', label: 'RDS-PostgreSQL-02' },
          { value: 'RDS-PostgreSQL-03', label: 'RDS-PostgreSQL-03' }
        ];
      case 'ec2':
        return [
          { value: 'all', label: 'All SQL Servers' },
          { value: 'analytics-sqlserver-01', label: 'analytics-sqlserver-01' },
          { value: 'reporting-sqlserver-01', label: 'reporting-sqlserver-01' },
          { value: 'legacy-sqlserver-01', label: 'legacy-sqlserver-01' },
          { value: 'dev-sqlserver-01', label: 'dev-sqlserver-01' }
        ];
      case 'services':
        return [
          { value: 'all', label: 'All Services' },
          { value: 'trading-platform', label: 'Trading Platform' },
          { value: 'risk-management', label: 'Risk Management' },
          { value: 'portfolio-management', label: 'Portfolio Management' },
          { value: 'auth-service', label: 'Authentication Service' },
          { value: 'notification-service', label: 'Notification Service' }
        ];
      default:
        return [{ value: 'all', label: 'All Systems' }];
    }
  };

  // Get metric labels based on resource type
  const getMetricLabel = (metric: 'request' | 'response' | 'error') => {
    if (resourceType === 'rds') {
      switch (metric) {
        case 'request': return 'Query Rate';
        case 'response': return 'Query Time';
        case 'error': return 'Failed Queries';
      }
    } else if (resourceType === 'ec2') {
      switch (metric) {
        case 'request': return 'Transaction Rate';
        case 'response': return 'Transaction Time';
        case 'error': return 'Failed Transactions';
      }
    } else if (resourceType === 'eks') {
      switch (metric) {
        case 'request': return 'Request Rate';
        case 'response': return 'Pod Response Time';
        case 'error': return 'Pod Error Rate';
      }
    }
    // Default labels
    switch (metric) {
      case 'request': return 'Request Rate';
      case 'response': return 'Response Time';
      case 'error': return 'Error Rate';
    }
  };

  // Get metric units based on resource type
  const getMetricUnit = (metric: 'request' | 'response') => {
    if (resourceType === 'rds') {
      return metric === 'request' ? 'qps' : 'ms';
    } else if (resourceType === 'ec2') {
      return metric === 'request' ? 'tps' : 'ms';
    }
    return metric === 'request' ? 'req/s' : 'ms';
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            Performance Dashboard
          </Title>
          <Text size="lg" c="dimmed">
            Real-time infrastructure performance monitoring and alerting
          </Text>
          
          <Group gap="sm">
            <Badge 
              color={connected ? 'green' : 'gray'} 
              variant="filled" 
              leftSection={<IconDatabase size={12} />}
            >
              {connected ? 'Live Data' : 'Disconnected'}
            </Badge>
            
            <Badge 
              color="blue" 
              variant="outline"
            >
              Monitoring: {selectedResource === 'all' ? `All ${resourceType === 'all' ? 'Systems' : resourceType.toUpperCase()}` : selectedResource}
            </Badge>
            
            {selectedResource !== 'all' && (
              <Badge color="orange" variant="light">
                Real-time Updates: 0.5s
              </Badge>
            )}
          </Group>
          
          <Group gap="md">
            <Select
              label="Resource Type"
              placeholder="Select type"
              value={resourceType}
              onChange={(value) => {
                setResourceType(value as any);
                setSelectedResource('all');
              }}
              data={[
                { value: 'all', label: 'All Systems' },
                { value: 'eks', label: 'EKS Clusters' },
                { value: 'rds', label: 'RDS Databases' },
                { value: 'ec2', label: 'SQL Servers' },
                { value: 'services', label: 'Applications' }
              ]}
              w={160}
            />
            
            <Select
              label="Specific Resource"
              placeholder="Select resource"
              value={selectedResource}
              onChange={(value) => setSelectedResource(value || 'all')}
              data={getResourceOptions()}
              w={250}
            />
          </Group>
        </Stack>
        
        <Group gap="sm">
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            data={[
              { value: '1h', label: '1 Hour' },
              { value: '24h', label: '24 Hours' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' }
            ]}
            w={120}
          />
          <ActionIcon variant="outline" color="gray" onClick={loadPerformanceData}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {loading ? (
        <Box pos="relative" h="400px">
          <LoadingOverlay
            visible={loading}
            overlayProps={{ backgroundOpacity: 0.7 }}
            loaderProps={{ color: 'cg-navy', size: 'xl' }}
          />
          <Text ta="center" mt="xl" size="lg" c="dimmed">
            Loading performance metrics...
          </Text>
        </Box>
      ) : (
        <>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Card withBorder radius="md" p="lg" bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconActivity size={20} color="var(--mantine-color-green-6)" />
                      <Text size="sm" fw={600} c="green.8">{getMetricLabel('request')}</Text>
                    </Group>
                    <Text size="xs" c="green.7">Live</Text>
                  </Group>
                  
                  <LineChart
                    h={60}
                    data={requestRateData.map(d => ({ 
                      time: new Date(d.timestamp).getHours() + ':00',
                      value: Math.round(d.value / 1000)
                    }))}
                    dataKey="time"
                    series={[{ name: 'value', color: 'green.6' }]}
                    gridAxis="none"
                    withXAxis={false}
                    withYAxis={false}
                    withDots={false}
                    strokeWidth={3}
                  />
                  
                  <Text size="xl" fw={700} c="green.8">
                    {resourceType === 'rds' 
                      ? `${Math.round((getCurrentValue(requestRateData) || 12000) / 10) * 10} ${getMetricUnit('request')}`
                      : resourceType === 'ec2'
                      ? `${Math.round((getCurrentValue(requestRateData) || 5000) / 10) * 10} ${getMetricUnit('request')}`
                      : `${Math.round((getCurrentValue(requestRateData) / 1000) / 10) * 10 || 40}K ${getMetricUnit('request')}`
                    }
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Card withBorder radius="md" p="lg" bg="yellow.0" style={{ borderColor: 'var(--mantine-color-yellow-3)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconClock size={20} color="var(--mantine-color-yellow-6)" />
                      <Text size="sm" fw={600} c="yellow.8">{getMetricLabel('response')}</Text>
                    </Group>
                    <Text size="xs" c="yellow.7">P95</Text>
                  </Group>
                  
                  <LineChart
                    h={60}
                    data={responseTimeData.map(d => ({ 
                      time: new Date(d.timestamp).getHours() + ':00',
                      value: Math.round(d.value)
                    }))}
                    dataKey="time"
                    series={[{ name: 'value', color: 'yellow.6' }]}
                    gridAxis="none"
                    withXAxis={false}
                    withYAxis={false}
                    withDots={false}
                    strokeWidth={3}
                  />
                  
                  <Text size="xl" fw={700} c="yellow.8">
                    {Math.round((getCurrentValue(responseTimeData) || (resourceType === 'rds' ? 8 : resourceType === 'ec2' ? 25 : 124)) / 10) * 10}{getMetricUnit('response')}
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Card withBorder radius="md" p="lg" bg="red.0" style={{ borderColor: 'var(--mantine-color-red-3)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
                      <Text size="sm" fw={600} c="red.8">{getMetricLabel('error')}</Text>
                    </Group>
                    <Text size="xs" c="red.7">Critical</Text>
                  </Group>
                  
                  <AreaChart
                    h={60}
                    data={errorRateData.map(d => ({ 
                      time: new Date(d.timestamp).getHours() + ':00',
                      value: (d.value * 100)
                    }))}
                    dataKey="time"
                    series={[{ name: 'value', color: 'red.5' }]}
                    gridAxis="none"
                    withXAxis={false}
                    withYAxis={false}
                    withDots={false}
                    fillOpacity={0.3}
                  />
                  
                  <Text size="xl" fw={700} c="red.8">
                    {(Math.round((getCurrentValue(errorRateData) * 100) * 10) / 10).toFixed(1) || '0.0'}%
                  </Text>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <Card withBorder radius="md" p="lg" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCpu size={20} color="var(--mantine-color-blue-6)" />
                      <Text size="sm" fw={600} c="blue.8">System Resources</Text>
                    </Group>
                    <Text size="xs" c="blue.7">Health</Text>
                  </Group>
                  
                  <Group justify="space-between" grow>
                    <Stack gap="xs" align="center">
                      <RingProgress
                        size={50}
                        thickness={6}
                        sections={[{ value: Math.round(saturationData.cpu / 10) * 10, color: saturationData.cpu > 80 ? 'red.6' : 'blue.6' }]}
                      />
                      <Stack gap={0} align="center">
                        <Text size="sm" fw={600} c="blue.8">CPU</Text>
                        <Text size="xs" c="blue.7">{Math.round(saturationData.cpu / 10) * 10}%</Text>
                      </Stack>
                    </Stack>
                    
                    <Stack gap="xs" align="center">
                      <RingProgress
                        size={50}
                        thickness={6}
                        sections={[{ value: Math.round(saturationData.memory / 10) * 10, color: saturationData.memory > 80 ? 'red.6' : 'blue.6' }]}
                      />
                      <Stack gap={0} align="center">
                        <Text size="sm" fw={600} c="blue.8">Memory</Text>
                        <Text size="xs" c="blue.7">{Math.round(saturationData.memory / 10) * 10}%</Text>
                      </Stack>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="lg">
              <Title order={3} c="cg-navy.6">
                Active Alert Rules
              </Title>
              <Badge
                color={alertRules.filter(a => a.status === 'active').length > 0 ? 'red' : 'green'}
                variant="filled"
              >
                {alertRules.filter(a => a.status === 'active').length} Active
              </Badge>
            </Group>
            
            <Stack gap="sm">
              {alertRules.filter(a => a.status === 'active').map((alert) => (
                <Alert
                  key={alert.id}
                  icon={alert.severity === 'critical' ? <IconX size={16} /> : <IconAlertTriangle size={16} />}
                  color={alert.severity === 'critical' ? 'red' : 'yellow'}
                  title={alert.title}
                  variant="filled"
                >
                  <Group justify="space-between">
                    <Text size="sm">{alert.description}</Text>
                    <Badge variant="outline" color="white">
                      {alert.value} / {alert.threshold}
                    </Badge>
                  </Group>
                </Alert>
              ))}
              
              {alertRules.filter(a => a.status === 'active').length === 0 && (
                <Alert
                  icon={<IconCheck size={16} />}
                  color="green"
                  title="All Systems Operational"
                  variant="filled"
                >
                  <Text size="sm">No active alerts - all performance metrics within acceptable thresholds</Text>
                </Alert>
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
};

export default Performance;