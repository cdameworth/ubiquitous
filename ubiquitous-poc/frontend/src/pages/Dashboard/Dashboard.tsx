import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Grid,
  Text,
  Group,
  Stack,
  Badge,
  Select,
  Button,
  RingProgress,
  ActionIcon,
  LoadingOverlay,
  Timeline,
  Paper,
  Box,
  Title,
} from '@mantine/core';
import {
  IconHeart,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconZoomIn,
  IconZoomOut,
  IconRefresh,
  IconFileReport,
  IconEye,
} from '@tabler/icons-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

interface KPIMetric {
  title: string;
  value: string | number;
  trend: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: string;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'cost' | 'security' | 'performance' | 'incident';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

interface InfrastructureNode {
  id: string;
  type: string; // API returns various types like 'LoadBalancer', 'WebService', 'awsresource', etc.
  name: string;
  status: string; // API returns 'active', 'running', 'backing-up', etc.
  metrics: {
    cpu?: number;
    memory?: number;
    connections?: number;
    cost?: string | number;
  };
  cluster?: string;
  tier: string; // Required: 'web', 'app', 'loadbalancer', 'database', 'infrastructure'
}

interface Application {
  id: string;
  name: string;
  cluster: string;
  services: string[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { connected, subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [infrastructureNodes, setInfrastructureNodes] = useState<InfrastructureNode[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>('all');
  const [filteredNodes, setFilteredNodes] = useState<InfrastructureNode[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    const handleMetricsUpdate = (data: any) => {
      updateMetrics(data);
    };

    const handleAlert = (data: any) => {
      addNotification(data.severity || 'warning', data.title, data.message);
      addNewActivity(data);
    };

    subscribeToEvent('metrics_update', handleMetricsUpdate);
    subscribeToEvent('alert', handleAlert);

    return () => {
      unsubscribeFromEvent('metrics_update', handleMetricsUpdate);
      unsubscribeFromEvent('alert', handleAlert);
    };
  }, [subscribeToEvent, unsubscribeFromEvent, addNotification]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints - including applications dynamically
      const [systemResponse, activitiesResponse, infrastructureResponse, applicationsResponse] = await Promise.all([
        api.get('/api/system/health'),
        api.get('/api/system/activities/recent'),
        api.get('/api/infrastructure/nodes'),
        api.get('/api/infrastructure/applications')
      ]);
      
      const systemData = systemResponse.data || systemResponse;
      const activitiesData = activitiesResponse.data || activitiesResponse;
      const infrastructureData = infrastructureResponse.data || infrastructureResponse;
      const applicationsData = applicationsResponse.data || applicationsResponse;
      
      // Load initial system metrics
      await loadSystemMetrics();

      setRecentActivities(activitiesData.activities || activitiesData.recent_activities || []);
      setInfrastructureNodes(infrastructureData.nodes || infrastructureData.infrastructure_nodes || []);
      setApplications(applicationsData.applications || applicationsData || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const systemResponse = await api.get('/api/system/health');
      const systemData = systemResponse.data || systemResponse;
      
      setKpiMetrics([
        {
          title: 'System Health',
          value: `${systemData.overallHealth || 95}%`,
          trend: systemData.healthTrend > 0 ? `+${systemData.healthTrend}%` : `${systemData.healthTrend || 0}%`,
          status: (systemData.overallHealth || 95) > 95 ? 'healthy' : (systemData.overallHealth || 95) > 85 ? 'warning' : 'critical',
          icon: '❤️'
        },
        {
          title: 'Active Alerts',
          value: systemData.activeAlerts || 0,
          trend: systemData.alertTrend > 0 ? `+${systemData.alertTrend}` : `${systemData.alertTrend || 0}`,
          status: (systemData.activeAlerts || 0) < 5 ? 'healthy' : (systemData.activeAlerts || 0) < 15 ? 'warning' : 'critical',
          icon: '🚨'
        },
        {
          title: 'Cost Trends',
          value: `$${((systemData.monthlyCost || 45000) / 1000).toFixed(1)}K`,
          trend: (systemData.costTrend || 0) < 0 ? `${systemData.costTrend}%` : `+${systemData.costTrend || 0}%`,
          status: (systemData.costTrend || 0) < 5 ? 'healthy' : (systemData.costTrend || 0) < 15 ? 'warning' : 'critical',
          icon: '💰'
        }
      ]);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const handleApplicationChange = async (appId: string) => {
    setSelectedApplication(appId);
    
    if (appId === 'all') {
      setFilteredNodes(infrastructureNodes);
      // Reset to system-wide metrics
      await loadSystemMetrics();
    } else {
      try {
        const response = await api.get(`/api/infrastructure/application/${appId}`);
        const appData = response.data || response;
        const appNodes = appData.nodes || appData.infrastructure_nodes || [];
        setFilteredNodes(appNodes);
        
        // Calculate application-specific KPI metrics from nodes
        if (appNodes.length > 0) {
          const healthyNodes = appNodes.filter((node: InfrastructureNode) => node.status === 'healthy').length;
          const warningNodes = appNodes.filter((node: InfrastructureNode) => node.status === 'warning').length;
          const criticalNodes = appNodes.filter((node: InfrastructureNode) => node.status === 'critical').length;
          
          const healthPercentage = Math.round((healthyNodes / appNodes.length) * 100);
          const alertCount = warningNodes + criticalNodes;
          
          // Calculate total cost from node metrics
          const totalCost = appNodes.reduce((sum, node) => {
            if (node.metrics.cost && node.metrics.cost !== 'N/A') {
              let cost = 0;
              if (typeof node.metrics.cost === 'number') {
                cost = node.metrics.cost;
              } else if (typeof node.metrics.cost === 'string') {
                cost = parseInt(node.metrics.cost.replace(/[$,\/mo]/g, '')) || 0;
              }
              return sum + cost;
            }
            return sum;
          }, 0);
          
          // Update KPI metrics with application-specific data
          setKpiMetrics([
            {
              title: 'Application Health',
              value: `${healthPercentage}%`,
              trend: healthPercentage > 90 ? '+5%' : healthPercentage > 75 ? '0%' : '-3%',
              status: healthPercentage > 95 ? 'healthy' : healthPercentage > 85 ? 'warning' : 'critical',
              icon: '❤️'
            },
            {
              title: 'Active Issues',
              value: alertCount,
              trend: alertCount === 0 ? '0' : alertCount < 3 ? '+1' : '+2',
              status: alertCount < 2 ? 'healthy' : alertCount < 5 ? 'warning' : 'critical',
              icon: '🚨'
            },
            {
              title: 'App Cost',
              value: `$${(totalCost / 1000).toFixed(1)}K`,
              trend: totalCost > 1000 ? '+8%' : '+2%',
              status: totalCost < 500 ? 'healthy' : totalCost < 1500 ? 'warning' : 'critical',
              icon: '💰'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load application infrastructure:', error);
        addNotification('error', 'Failed to load application infrastructure');
      }
    }
  };

  const getNodesByTier = (tier: string) => {
    return filteredNodes.filter(node => node.tier === tier);
  };

  useEffect(() => {
    if (infrastructureNodes.length > 0 && selectedApplication === 'all') {
      setFilteredNodes(infrastructureNodes);
    }
  }, [infrastructureNodes, selectedApplication]);

  // Helper function to normalize status from API
  const normalizeStatus = (apiStatus: string): 'healthy' | 'warning' | 'critical' => {
    const status = apiStatus.toLowerCase();
    if (['healthy', 'active', 'running', 'ok'].includes(status)) return 'healthy';
    if (['warning', 'degraded', 'backing-up'].includes(status)) return 'warning';
    return 'critical';
  };

  // Helper function to format cost from API
  const formatCost = (cost: string | number): string => {
    if (typeof cost === 'number') return `$${cost.toFixed(0)}/mo`;
    if (typeof cost === 'string' && cost !== 'N/A') return cost;
    return 'N/A';
  };

  const updateMetrics = (data: any) => {
    if (data.type === 'system_metrics') {
      setKpiMetrics(prev => prev.map(metric => {
        if (metric.title === 'System Health' && data.health) {
          return { ...metric, value: `${data.health}%` };
        }
        if (metric.title === 'Active Alerts' && data.alerts !== undefined) {
          return { ...metric, value: data.alerts };
        }
        if (metric.title === 'Cost Trends' && data.cost) {
          return { ...metric, value: `$${(data.cost / 1000).toFixed(1)}K` };
        }
        return metric;
      }));
    }
  };

  const addNewActivity = (alertData: any) => {
    const newActivity: ActivityItem = {
      id: `activity-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: alertData.type || 'incident',
      title: alertData.title,
      description: alertData.message,
      impact: alertData.severity === 'critical' ? 'high' : alertData.severity === 'warning' ? 'medium' : 'low'
    };
    
    setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]);
  };

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Text ta="center" mt="xl" size="lg" c="dimmed">
          Loading infrastructure intelligence...
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header with Quick Navigation */}
      <Group justify="space-between">
        <Title order={1} c="cg-navy.6">Dashboard Overview</Title>
        <Group gap="sm">
          <Button 
            variant="outline" 
            color="cg-navy"
            onClick={() => navigate('/network-analysis')}
          >
            Infrastructure
          </Button>
          <Button 
            variant="outline" 
            color="cg-navy"
            onClick={() => navigate('/security')}
          >
            Security
          </Button>
          <Button 
            variant="outline" 
            color="cg-navy"
            onClick={() => navigate('/finops')}
          >
            FinOps
          </Button>
        </Group>
      </Group>

      {/* KPI Cards Row - Mantine Card components */}
      <Grid>
        {kpiMetrics.map((metric, index) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={index}>
            <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
              <Group justify="space-between" mb="md">
                <Text size="sm" fw={500} c="dimmed" tt="uppercase">
                  {metric.title}
                </Text>
                <Text size="xl">{metric.icon}</Text>
              </Group>
              
              {metric.title === 'System Health' ? (
                <Group justify="center" mb="md">
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{
                      value: parseInt(metric.value.toString().replace('%', '')),
                      color: metric.status === 'healthy' ? 'green' : 
                             metric.status === 'warning' ? 'yellow' : 'red'
                    }]}
                    label={
                      <Text ta="center" fw={700} size="sm">
                        {metric.value}
                      </Text>
                    }
                  />
                </Group>
              ) : (
                <Text size="xl" fw={700} mb="xs">
                  {metric.value}
                </Text>
              )}
              
              <Group justify="space-between">
                <Badge 
                  color={metric.status === 'healthy' ? 'green' : 
                         metric.status === 'warning' ? 'yellow' : 'red'}
                  variant="light"
                  size="sm"
                >
                  {metric.status}
                </Badge>
                <Group gap={4}>
                  {metric.trend.includes('+') ? (
                    <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />
                  ) : (
                    <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
                  )}
                  <Text size="sm" c={metric.trend.includes('+') ? 'green' : 'red'}>
                    {metric.trend}
                  </Text>
                </Group>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Infrastructure Map - Dynamic with Application Selector */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="lg">
          <Title order={2} c="cg-navy.6">Infrastructure Map</Title>
          <Group gap="sm">
            <Select
              value={selectedApplication}
              onChange={(value) => handleApplicationChange(value || 'all')}
              data={[
                { value: 'all', label: 'All Systems' },
                ...applications.map(app => ({ value: app.name, label: app.name }))
              ]}
              w={180}
            />
            <Group gap={4}>
              <ActionIcon variant="outline" color="gray" size="sm">
                <IconZoomOut size={14} />
              </ActionIcon>
              <Text size="xs" c="dimmed">Zoom</Text>
              <ActionIcon variant="outline" color="gray" size="sm">
                <IconZoomIn size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Group>
        
        <Grid>
          {/* Load Balancer Tier */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="md" radius="sm" bg="violet.0">
              <Title order={4} mb="sm" c="violet">Load Balancers</Title>
              <Stack gap="xs">
                {getNodesByTier('loadbalancer').length > 0 ? (
                  getNodesByTier('loadbalancer').map(node => (
                    <Paper key={node.id} p="xs" bg={
                      normalizeStatus(node.status) === 'healthy' ? 'green.0' : 
                      normalizeStatus(node.status) === 'warning' ? 'yellow.0' : 'red.0'
                    }>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{node.name}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color={
                            normalizeStatus(node.status) === 'healthy' ? 'green' : 
                            normalizeStatus(node.status) === 'warning' ? 'yellow' : 'red'
                          }>
                            {normalizeStatus(node.status)}
                          </Badge>
                          <Text size="xs" c="dimmed">{formatCost(node.metrics.cost)}</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed" ta="center">No load balancers</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Web Tier */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="md" radius="sm" bg="blue.0">
              <Title order={4} mb="sm" c="blue">Web Tier</Title>
              <Stack gap="xs">
                {getNodesByTier('web').length > 0 ? (
                  getNodesByTier('web').map(node => (
                    <Paper key={node.id} p="xs" bg={
                      normalizeStatus(node.status) === 'healthy' ? 'green.0' : 
                      normalizeStatus(node.status) === 'warning' ? 'yellow.0' : 'red.0'
                    }>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{node.name}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color={
                            normalizeStatus(node.status) === 'healthy' ? 'green' : 
                            normalizeStatus(node.status) === 'warning' ? 'yellow' : 'red'
                          }>
                            {normalizeStatus(node.status)}
                          </Badge>
                          {node.metrics.cpu && (
                            <Text size="xs" c="dimmed">CPU: {node.metrics.cpu.toFixed(0)}%</Text>
                          )}
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed" ta="center">No web services</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* App Tier */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="md" radius="sm" bg="green.0">
              <Title order={4} mb="sm" c="green">App Tier</Title>
              <Stack gap="xs">
                {getNodesByTier('app').length > 0 ? (
                  getNodesByTier('app').map(node => (
                    <Paper key={node.id} p="xs" bg={
                      normalizeStatus(node.status) === 'healthy' ? 'green.0' : 
                      normalizeStatus(node.status) === 'warning' ? 'yellow.0' : 'red.0'
                    }>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{node.name}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color={
                            normalizeStatus(node.status) === 'healthy' ? 'green' : 
                            normalizeStatus(node.status) === 'warning' ? 'yellow' : 'red'
                          }>
                            {normalizeStatus(node.status)}
                          </Badge>
                          {node.cluster && (
                            <Text size="xs" c="dimmed">{node.cluster.replace('-cluster', '')}</Text>
                          )}
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed" ta="center">No app services</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Database Tier */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="md" radius="sm" bg="orange.0">
              <Title order={4} mb="sm" c="orange">Database</Title>
              <Stack gap="xs">
                {getNodesByTier('database').length > 0 ? (
                  getNodesByTier('database').map(node => (
                    <Paper key={node.id} p="xs" bg={
                      normalizeStatus(node.status) === 'healthy' ? 'green.0' : 
                      normalizeStatus(node.status) === 'warning' ? 'yellow.0' : 'red.0'
                    }>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{node.name}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color={
                            normalizeStatus(node.status) === 'healthy' ? 'green' : 
                            normalizeStatus(node.status) === 'warning' ? 'yellow' : 'red'
                          }>
                            {normalizeStatus(node.status)}
                          </Badge>
                          <Text size="xs" c="dimmed">{formatCost(node.metrics.cost)}</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed" ta="center">No databases</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Infrastructure Tier */}
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="md" radius="sm" bg="gray.0">
              <Title order={4} mb="sm" c="gray.7">Infrastructure</Title>
              <Stack gap="xs">
                {getNodesByTier('infrastructure').length > 0 ? (
                  getNodesByTier('infrastructure').map(node => (
                    <Paper key={node.id} p="xs" bg={
                      normalizeStatus(node.status) === 'healthy' ? 'green.0' : 
                      normalizeStatus(node.status) === 'warning' ? 'yellow.0' : 'red.0'
                    }>
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>{node.name}</Text>
                        <Group gap="xs">
                          <Badge size="xs" color={
                            normalizeStatus(node.status) === 'healthy' ? 'green' : 
                            normalizeStatus(node.status) === 'warning' ? 'yellow' : 'red'
                          }>
                            {normalizeStatus(node.status)}
                          </Badge>
                          <Text size="xs" c="dimmed">{formatCost(node.metrics.cost)}</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" c="dimmed" ta="center">No infrastructure</Text>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
        
        {filteredNodes.length === 0 && (
          <Box p="xl" ta="center">
            <Text size="xl">🏗️</Text>
            <Text c="dimmed" mt="sm">Select an application to view its infrastructure</Text>
          </Box>
        )}
      </Card>

      {/* Bottom Section - Recent Activities and Quick Actions */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Recent Activities</Title>
              <ActionIcon variant="subtle" color="gray">
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>
            
            <Timeline bulletSize={24} lineWidth={2}>
              {recentActivities.slice(0, 3).map((activity, index) => (
                <Timeline.Item
                  key={activity.id}
                  bullet={
                    activity.type === 'security' ? <IconAlertTriangle size={12} /> :
                    activity.type === 'cost' ? <IconCurrencyDollar size={12} /> :
                    activity.type === 'performance' ? <IconTrendingUp size={12} /> :
                    <IconHeart size={12} />
                  }
                  title={activity.title}
                  color={
                    activity.impact === 'high' ? 'red' :
                    activity.impact === 'medium' ? 'yellow' : 'green'
                  }
                >
                  <Text size="sm" c="dimmed">{activity.description}</Text>
                  <Text size="xs" c="dimmed">{activity.timestamp}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
            <Title order={3} c="cg-navy.6" mb="md">Quick Actions</Title>
            
            <Stack gap="sm">
              <Button
                variant="light"
                color="cg-navy"
                leftSection={<IconRefresh size={16} />}
                justify="flex-start"
                fullWidth
              >
                Run DR Test
              </Button>
              
              <Button
                variant="light"
                color="cg-blue"
                leftSection={<IconFileReport size={16} />}
                justify="flex-start"
                fullWidth
              >
                Generate Report
              </Button>
              
              <Button
                variant="light"
                color="green"
                leftSection={<IconEye size={16} />}
                justify="flex-start"
                fullWidth
              >
                View Recommendations
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default Dashboard;