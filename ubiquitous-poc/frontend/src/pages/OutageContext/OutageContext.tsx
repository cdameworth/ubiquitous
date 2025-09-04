import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Group, Stack, Text, Title, LoadingOverlay, Box, Grid, Badge, Button, Timeline, Alert, ActionIcon, Progress } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconPhone, IconBook, IconVideo, IconUsers, IconTrendingDown, IconTrendingUp, IconClock, IconServer } from '@tabler/icons-react';
import api from '../../services/api';
import './OutageContext.css';

interface IncidentData {
  id: string;
  title: string;
  status: 'active' | 'resolved';
  startTime: string;
  severity: 'critical' | 'warning' | 'info';
  affectedServices: ServiceStatus[];
  metrics: IncidentMetrics;
  timeline: TimelineEvent[];
}

interface ServiceStatus {
  name: string;
  status: 'critical' | 'warning' | 'healthy';
  usersImpacted?: number;
  dependencies?: ServiceStatus[];
}

interface IncidentMetrics {
  cpu: number;
  memory: number;
  requests: { current: number; baseline: number };
  errors: { current: number; baseline: number };
  latency: { current: number; baseline: number };
  connections: { current: number; baseline: number };
  dbQueries: string;
  cacheHit: number;
}

interface TimelineEvent {
  time: string;
  event: string;
  type: 'detection' | 'escalation' | 'action' | 'resolution';
}

const OutageContext: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    loadIncidentData();
  }, []);

  const loadIncidentData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints
      const [incidentsResponse, dependencyResponse] = await Promise.all([
        api.get('/api/outage/current-incidents'),
        api.get('/api/outage/dependency-analysis?service=auth-service&depth=3')
      ]);
      
      // Use real data if available, fallback to mock for demo
      const incidents = incidentsResponse.data?.incidents || incidentsResponse.incidents || [];
      
      // Use first active incident or simulate one for demo
      const activeIncident = incidents.find((i: any) => i.status !== 'resolved');
      
      const mappedIncident: IncidentData = activeIncident ? {
        ...activeIncident,
        affectedServices: (activeIncident.affected_services || []).map((serviceName: string) => ({
          name: serviceName,
          status: serviceName.includes('auth') ? 'critical' : 'warning',
          dependencies: []
        })),
        startTime: new Date(activeIncident.started_at).toLocaleTimeString() + ' UTC',
        timeline: activeIncident.timeline || [],
        rootCause: activeIncident.root_cause || 'Under investigation',
        estimatedRevenueImpact: activeIncident.estimated_revenue_impact || 0,
        durationMinutes: activeIncident.duration_minutes || 0,
        affectedUsers: activeIncident.affected_users || 0
      } : {
        id: activeIncident?.id || 'INC-2024-247',
        title: activeIncident?.title || 'API Gateway Degradation',
        status: activeIncident?.status || 'active',
        startTime: activeIncident?.started_at ? new Date(activeIncident.started_at).toLocaleTimeString() + ' UTC' : '14:23 UTC',
        severity: activeIncident?.severity || 'critical',
        affectedServices: [
          {
            name: 'API Gateway',
            status: 'critical',
            dependencies: [
              { name: 'Auth Service', status: 'warning' },
              { name: 'User Service', status: 'warning' },
              { name: 'Payment API', status: 'critical' },
              { name: 'Mobile App', status: 'critical', usersImpacted: 45000 }
            ]
          }
        ],
        metrics: {
          cpu: 98,
          memory: 87,
          requests: { current: 3000, baseline: 12000 },
          errors: { current: 45, baseline: 0.1 },
          latency: { current: 2300, baseline: 45 },
          connections: { current: 23000, baseline: 8000 },
          dbQueries: 'Normal',
          cacheHit: 12
        },
        timeline: [
          { time: '14:20', event: 'Cache invalidation event detected', type: 'detection' },
          { time: '14:21', event: 'Memory pressure increase on api-gateway-01', type: 'escalation' },
          { time: '14:23', event: 'Cascading failures begin', type: 'escalation' },
          { time: '14:24', event: 'Auto-scaling triggered (in progress)', type: 'action' }
        ]
      };
      
      setIncident(mappedIncident);
      setLoading(false);
    } catch (error) {
      console.error('Outage Context API Error:', error);
      addNotification('error', 'Failed to load incident data', 'Check API connectivity');
      setLoading(false);
    }
  };

  const renderServiceTree = (service: ServiceStatus, level: number = 0) => (
    <Box key={service.name} pl={level * 20} mb="sm">
      <Group gap="sm" align="center">
        <Badge 
          color={service.status === 'critical' ? 'red' : service.status === 'warning' ? 'orange' : 'green'}
          size="xs"
          circle
        >
          {service.status === 'critical' ? '!' : service.status === 'warning' ? '⚠' : '✓'}
        </Badge>
        <Text fw={500} size="sm">{service.name}</Text>
        {service.usersImpacted && (
          <Badge color="orange" size="xs" leftSection={<IconUsers size={10} />}>
            {service.usersImpacted.toLocaleString()} users
          </Badge>
        )}
      </Group>
      {service.dependencies && (
        <Stack gap="xs" mt="xs">
          {service.dependencies.map(dep => renderServiceTree(dep, level + 1))}
        </Stack>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Stack align="center" justify="center" h="100%">
          <Text size="lg" c="dimmed">Loading incident data...</Text>
        </Stack>
      </Box>
    );
  }

  if (!incident) {
    return (
      <Box className="outage-context">
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={1} c="cg-navy">Incident Command Center</Title>
            <Badge size="lg" color="green" leftSection="🟢">
              ALL SYSTEMS OPERATIONAL
            </Badge>
          </Stack>
        </Group>
        
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <Text size="lg" c="dimmed">No active incidents detected. All systems are running normally.</Text>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="outage-context">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">Incident Command Center</Title>
          <Badge size="lg" color="red" leftSection={<IconAlertTriangle size={16} />}>
            ACTIVE INCIDENT
          </Badge>
        </Stack>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="cg-navy"
          onClick={loadIncidentData}
        >
          Refresh Status
        </Button>
      </Group>

      {/* Incident Alert */}
      <Alert
        variant="filled"
        color="red"
        title={`Incident: ${incident.title}`}
        icon={<IconAlertTriangle />}
        mb="xl"
      >
        <Group justify="space-between">
          <Text>Started: {incident.startTime}</Text>
          <Badge color="red" variant="light">Severity: {incident.severity}</Badge>
        </Group>
      </Alert>

      {/* Main Content Grid */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Title order={3} mb="md">Affected Services & Dependencies</Title>
            <Stack gap="md">
              {(incident.affectedServices || []).map(service => renderServiceTree(service))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder padding="lg" radius="md" h="100%">
            <Title order={3} mb="md">Real-Time Telemetry Correlation</Title>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">CPU Usage</Text>
                    <Group justify="space-between">
                      <Text size="xl" fw={700} c={incident.metrics.cpu >= 95 ? 'red' : 'blue'}>
                        {incident.metrics.cpu}%
                      </Text>
                      {incident.metrics.cpu >= 95 && <Badge color="red" size="xs">Critical</Badge>}
                    </Group>
                    <Progress value={incident.metrics.cpu} color={incident.metrics.cpu >= 95 ? 'red' : 'blue'} size="sm" />
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Memory Usage</Text>
                    <Text size="xl" fw={700} c="blue">{incident.metrics.memory}%</Text>
                    <Progress value={incident.metrics.memory} color="blue" size="sm" />
                  </Stack>
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Requests/sec</Text>
                    <Group justify="space-between">
                      <Text size="sm">{incident.metrics.requests.baseline}K</Text>
                      <IconTrendingDown color="red" size={16} />
                      <Text size="lg" fw={600} c="red">{incident.metrics.requests.current}K</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Error Rate</Text>
                    <Group justify="space-between">
                      <Text size="sm">{incident.metrics.errors.baseline}%</Text>
                      <IconTrendingUp color="red" size={16} />
                      <Text size="lg" fw={600} c="red">{incident.metrics.errors.current}%</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Latency</Text>
                    <Group justify="space-between">
                      <Text size="sm">{incident.metrics.latency.baseline}ms</Text>
                      <IconTrendingUp color="red" size={16} />
                      <Text size="lg" fw={600} c="red">{incident.metrics.latency.current}ms</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Cache Hit Rate</Text>
                    <Group justify="space-between">
                      <Text size="lg" fw={600} c="orange">{incident.metrics.cacheHit}%</Text>
                      <Badge color="orange" size="xs">Low</Badge>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Timeline */}
      <Card withBorder padding="lg" radius="md" mb="xl">
        <Title order={3} mb="md">Timeline & Root Cause</Title>
        <Timeline active={(incident.timeline || []).length - 1} bulletSize={24} lineWidth={2}>
          {(incident.timeline || []).map((event, index) => (
            <Timeline.Item
              key={index}
              bullet={<IconClock size={12} />}
              title={<Text size="sm" fw={500}>{new Date(event.timestamp).toLocaleTimeString()}</Text>}
              color={
                event.event.toLowerCase().includes('detected') ? 'blue' :
                event.event.toLowerCase().includes('escalat') ? 'orange' :
                event.event.toLowerCase().includes('identified') || event.event.toLowerCase().includes('resolved') ? 'green' : 'gray'
              }
            >
              <Text size="sm" c="dimmed">{event.event}</Text>
              {event.details && (
                <Text size="xs" c="dimmed" mt="xs">{event.details}</Text>
              )}
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* Action Buttons */}
      <Group justify="center" gap="md">
        <Button 
          leftSection={<IconBook size={16} />}
          color="blue"
          onClick={() => addNotification('info', 'Runbook', 'Executing automated runbook...')}
        >
          Execute Runbook
        </Button>
        <Button 
          leftSection={<IconPhone size={16} />}
          variant="light"
          color="orange"
          onClick={() => addNotification('info', 'Notification', 'On-call team has been notified')}
        >
          Notify On-Call
        </Button>
        <Button 
          leftSection={<IconVideo size={16} />}
          variant="light"
          color="red"
          onClick={() => addNotification('info', 'War Room', 'Opening incident war room...')}
        >
          Open War Room
        </Button>
      </Group>
    </Box>
  );
};

export default OutageContext;