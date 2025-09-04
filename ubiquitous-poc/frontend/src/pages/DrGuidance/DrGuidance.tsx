import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Group, Stack, Tabs, Text, Title, LoadingOverlay, Box, Grid, Badge, Progress, Button, ActionIcon, Select, Timeline, Table, Alert } from '@mantine/core';
import { IconRefresh, IconShield, IconClock, IconAlertTriangle, IconCheck, IconX, IconExclamationMark, IconPhone, IconBook, IconUsers, IconServer } from '@tabler/icons-react';
import api from '../../services/api';

interface DrData {
  readiness: any;
  executionPlan: any;
  metrics: any;
}

const DrGuidance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [drData, setDrData] = useState<DrData | null>(null);
  const [activeTab, setActiveTab] = useState<'readiness' | 'execution' | 'metrics'>('readiness');
  const [selectedDisasterType, setSelectedDisasterType] = useState('datacenter_outage');
  const [selectedSeverity, setSelectedSeverity] = useState('high');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadDrData();
  }, [selectedDisasterType, selectedSeverity]);

  const loadDrData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints
      const [readinessResponse, executionResponse, metricsResponse] = await Promise.all([
        api.get('/api/dr/readiness-check'),
        api.get(`/api/dr/execution-plan?disaster_type=${selectedDisasterType}&severity=${selectedSeverity}`),
        api.get('/api/dr/recovery-metrics?timeframe=ytd')
      ]);
      
      setDrData({
        readiness: readinessResponse.data || readinessResponse,
        executionPlan: executionResponse.data || executionResponse,
        metrics: metricsResponse.data || metricsResponse
      });
      
      setLoading(false);
    } catch (error) {
      console.error('DR Guidance API Error:', error);
      addNotification('error', 'Failed to load DR data', 'Check API connectivity');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Stack align="center" justify="center" h="100%">
          <Text size="lg" c="dimmed">Loading DR guidance...</Text>
        </Stack>
      </Box>
    );
  }

  const getReadinessColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 60) return 'orange';
    return 'red';
  };

  return (
    <Box>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">Disaster Recovery Guidance</Title>
          <Text c="dimmed">
            Recovery planning, RTO/RPO analysis, and failover procedures
          </Text>
        </Stack>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="cg-navy"
          onClick={loadDrData}
        >
          Refresh Analysis
        </Button>
      </Group>

      {/* Overview Cards */}
      {drData?.readiness && (
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Overall Readiness</Text>
                <Group justify="space-between" align="center">
                  <Text size="xl" fw={700} c={getReadinessColor(drData.readiness.readiness_assessment?.overall_readiness_percentage || 0)}>
                    {drData.readiness.readiness_assessment?.overall_readiness_percentage || 0}%
                  </Text>
                  <Badge size="xs" color={getReadinessColor(drData.readiness.readiness_assessment?.overall_readiness_percentage || 0)}>
                    {drData.readiness.readiness_assessment?.readiness_status || 'unknown'}
                  </Badge>
                </Group>
                <Progress 
                  value={drData.readiness.readiness_assessment?.overall_readiness_percentage || 0} 
                  color={getReadinessColor(drData.readiness.readiness_assessment?.overall_readiness_percentage || 0)}
                  size="sm"
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Critical Issues</Text>
                <Text size="xl" fw={700} c="red">
                  {drData.readiness.readiness_assessment?.total_failed_checks || 0}
                </Text>
                <Text size="xs" c="dimmed">Failed checks</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Services Assessed</Text>
                <Text size="xl" fw={700} c="blue">
                  {drData.readiness.readiness_assessment?.services_assessed || 0}
                </Text>
                <Text size="xs" c="dimmed">Total services</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Warning Issues</Text>
                <Text size="xl" fw={700} c="orange">
                  {drData.readiness.readiness_assessment?.total_warning_checks || 0}
                </Text>
                <Text size="xs" c="dimmed">Needs review</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="readiness" leftSection={<IconShield size={16} />}>
            Readiness Assessment
          </Tabs.Tab>
          <Tabs.Tab value="execution" leftSection={<IconClock size={16} />}>
            Execution Plans
          </Tabs.Tab>
          <Tabs.Tab value="metrics" leftSection={<IconServer size={16} />}>
            Recovery Metrics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="readiness" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">DR Readiness Assessment</Title>
            
            {drData?.readiness?.services ? (
              <Stack gap="md">
                {drData.readiness.services.map((service: any) => (
                  <Card key={service.service} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="sm">
                      <Text fw={600}>{service.service}</Text>
                      <Badge color={getReadinessColor(service.overall_readiness)}>
                        {service.overall_readiness}% Ready
                      </Badge>
                    </Group>
                    
                    <Grid>
                      {Object.entries(service.categories || {}).map(([category, categoryData]: [string, any]) => (
                        <Grid.Col key={category} span={6}>
                          <Stack gap="xs">
                            <Text size="sm" c="dimmed">{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                            <Group justify="space-between">
                              <Text size="sm" fw={500}>{categoryData.readiness_percentage}%</Text>
                              <Group gap="xs">
                                <Badge size="xs" color="green">{categoryData.checks_passed} ✓</Badge>
                                <Badge size="xs" color="orange">{categoryData.checks_warning} ⚠</Badge>
                                <Badge size="xs" color="red">{categoryData.checks_failed} ✗</Badge>
                              </Group>
                            </Group>
                            <Progress 
                              value={categoryData.readiness_percentage} 
                              color={getReadinessColor(categoryData.readiness_percentage)}
                              size="xs"
                            />
                          </Stack>
                        </Grid.Col>
                      ))}
                    </Grid>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">No readiness data available</Text>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="execution" pt="md">
          <Stack gap="md">
            {/* Controls */}
            <Card withBorder padding="md" radius="md">
              <Group>
                <Select
                  label="Disaster Type"
                  value={selectedDisasterType}
                  onChange={(value) => setSelectedDisasterType(value || 'datacenter_outage')}
                  data={[
                    { value: 'datacenter_outage', label: 'Datacenter Outage' },
                    { value: 'network_failure', label: 'Network Failure' },
                    { value: 'cyber_attack', label: 'Cyber Attack' },
                    { value: 'natural_disaster', label: 'Natural Disaster' }
                  ]}
                />
                <Select
                  label="Severity"
                  value={selectedSeverity}
                  onChange={(value) => setSelectedSeverity(value || 'high')}
                  data={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' }
                  ]}
                />
              </Group>
            </Card>

            {/* Execution Plan */}
            <Card withBorder padding="lg" radius="md">
              <Title order={3} mb="md">Execution Plan: {drData?.executionPlan?.disaster_type?.replace('_', ' ') || 'N/A'}</Title>
              
              {drData?.executionPlan?.execution_plan && (
                <Stack gap="md">
                  <Alert icon={<IconAlertTriangle />} color="orange">
                    <Text fw={500}>{drData.executionPlan.execution_plan.description}</Text>
                    <Text size="sm">Estimated Recovery Time: {drData.executionPlan.execution_plan.estimated_total_recovery_time}</Text>
                  </Alert>
                  
                  <Timeline active={-1} bulletSize={24} lineWidth={2}>
                    {drData.executionPlan.timeline?.map((phase: any, index: number) => (
                      <Timeline.Item
                        key={index}
                        bullet={<IconClock size={12} />}
                        title={<Text fw={500}>{phase.phase}</Text>}
                        color="blue"
                      >
                        <Text size="sm" c="dimmed" mb="xs">
                          Duration: {phase.duration_minutes} minutes
                        </Text>
                        <Stack gap="xs">
                          {phase.steps?.map((step: string, stepIndex: number) => (
                            <Group key={stepIndex} gap="xs">
                              <Text size="xs" c="dimmed">{stepIndex + 1}.</Text>
                              <Text size="sm">{step}</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Stack>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Recovery Performance Metrics</Title>
            
            {drData?.metrics?.summary_metrics ? (
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="blue.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">Total Incidents</Text>
                        <Text size="xl" fw={700} c="blue">
                          {drData.metrics.summary_metrics.total_incidents}
                        </Text>
                        <Text size="xs" c="dimmed">This year</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="green.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">RTO Compliance</Text>
                        <Text size="xl" fw={700} c="green">
                          {drData.metrics.summary_metrics.rto_compliance_percentage}%
                        </Text>
                        <Progress 
                          value={drData.metrics.summary_metrics.rto_compliance_percentage} 
                          color="green" 
                          size="sm" 
                          w="100%"
                        />
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="orange.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">Avg Recovery Time</Text>
                        <Text size="xl" fw={700} c="orange">
                          {Math.round(drData.metrics.summary_metrics.avg_recovery_time_minutes / 60 * 10) / 10}h
                        </Text>
                        <Text size="xs" c="dimmed">{drData.metrics.summary_metrics.recovery_trend}</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="violet.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">User Impact</Text>
                        <Text size="xl" fw={700} c="violet">
                          {(drData.metrics.summary_metrics.total_user_impact / 1000).toFixed(0)}K
                        </Text>
                        <Text size="xs" c="dimmed">Affected users</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Recent Incidents Table */}
                <Card padding="md" radius="sm" bg="gray.0">
                  <Title order={4} mb="sm">Recent Incidents</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Severity</Table.Th>
                        <Table.Th>Recovery Time</Table.Th>
                        <Table.Th>RTO Met</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {drData.metrics.incidents?.slice(0, 5).map((incident: any) => (
                        <Table.Tr key={incident.id}>
                          <Table.Td>
                            <Text size="sm">
                              {new Date(incident.date).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{incident.type.replace('_', ' ')}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge 
                              color={incident.severity === 'critical' ? 'red' : incident.severity === 'high' ? 'orange' : 'blue'}
                              size="sm"
                            >
                              {incident.severity}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{Math.round(incident.actual_recovery_minutes / 60 * 10) / 10}h</Text>
                          </Table.Td>
                          <Table.Td>
                            {incident.rto_met ? (
                              <Badge color="green" size="sm" leftSection={<IconCheck size={10} />}>Met</Badge>
                            ) : (
                              <Badge color="red" size="sm" leftSection={<IconX size={10} />}>Missed</Badge>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </Stack>
            ) : (
              <Text c="dimmed">No metrics data available</Text>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default DrGuidance;