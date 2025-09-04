import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Group, Stack, Tabs, Text, Title, LoadingOverlay, Box, Grid, Badge, Progress, Button, ActionIcon } from '@mantine/core';
import { IconRefresh, IconEye, IconBell, IconChartDots, IconDashboard } from '@tabler/icons-react';
import ObservabilityGapAnalysis from '../../components/Visualizations/ObservabilityGapAnalysis';
import AlertTuningRecommendations from '../../components/Visualizations/AlertTuningRecommendations';
import api from '../../services/api';
import './Observability.css';

interface ObservabilityData {
  coverage: any;
  recommendations: any;
  telemetryQuality: any;
}

const Observability: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [observabilityData, setObservabilityData] = useState<ObservabilityData | null>(null);
  const [activeTab, setActiveTab] = useState<'gaps' | 'alerts' | 'coverage' | 'quality'>('gaps');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadObservabilityData();
  }, []);

  const loadObservabilityData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints
      const [coverageResponse, recommendationsResponse, telemetryResponse] = await Promise.all([
        api.get('/api/observability/coverage'),
        api.get('/api/observability/recommendations'),
        api.get('/api/observability/telemetry-quality?timeframe=24h')
      ]);
      
      setObservabilityData({
        coverage: coverageResponse.data || coverageResponse,
        recommendations: recommendationsResponse.data || recommendationsResponse,
        telemetryQuality: telemetryResponse.data || telemetryResponse
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Observability API Error:', error);
      addNotification('error', 'Failed to load observability data', 'Check API connectivity');
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
          <Text size="lg" c="dimmed">Loading observability analysis...</Text>
        </Stack>
      </Box>
    );
  }

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 95) return 'green';
    if (percentage >= 85) return 'yellow';
    if (percentage >= 70) return 'orange';
    return 'red';
  };

  return (
    <Box className="observability">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">Observability Platform</Title>
          <Text c="dimmed">
            Comprehensive monitoring coverage, gap analysis, and telemetry quality assessment
          </Text>
        </Stack>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="cg-navy"
          onClick={loadObservabilityData}
        >
          Refresh Analysis
        </Button>
      </Group>

      {/* Overview Cards */}
      {observabilityData?.coverage && (
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Overall Coverage</Text>
                <Group justify="space-between" align="center">
                  <Text size="xl" fw={700} c={getCoverageColor(observabilityData.coverage.overall_coverage?.overall_health || 0)}>
                    {observabilityData.coverage.overall_coverage?.overall_health || 0}%
                  </Text>
                  <Badge size="xs" color={getCoverageColor(observabilityData.coverage.overall_coverage?.overall_health || 0)}>
                    {observabilityData.coverage.overall_coverage?.overall_health >= 85 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </Group>
                <Progress 
                  value={observabilityData.coverage.overall_coverage?.overall_health || 0} 
                  color={getCoverageColor(observabilityData.coverage.overall_coverage?.overall_health || 0)}
                  size="sm"
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Critical Gaps</Text>
                <Text size="xl" fw={700} c="red">
                  {observabilityData.recommendations?.summary?.high_priority || 0}
                </Text>
                <Text size="xs" c="dimmed">High priority issues</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Services Monitored</Text>
                <Text size="xl" fw={700} c="blue">
                  {observabilityData.coverage?.total_services || 0}
                </Text>
                <Text size="xs" c="dimmed">Active services</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Data Quality</Text>
                <Text size="xl" fw={700} c="green">
                  {observabilityData.telemetryQuality?.summary?.avg_accuracy || 0}%
                </Text>
                <Text size="xs" c="dimmed">Metric accuracy</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Recommendations</Text>
                <Text size="xl" fw={700} c="orange">
                  {observabilityData.recommendations?.total_recommendations || 0}
                </Text>
                <Text size="xs" c="dimmed">Optimization opportunities</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Est. Effort</Text>
                <Text size="xl" fw={700} c="violet">
                  {observabilityData.recommendations?.summary?.total_estimated_hours || 0}h
                </Text>
                <Text size="xs" c="dimmed">Implementation time</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="gaps" leftSection={<IconEye size={16} />}>
            Gap Analysis
          </Tabs.Tab>
          <Tabs.Tab value="alerts" leftSection={<IconBell size={16} />}>
            Alert Tuning
          </Tabs.Tab>
          <Tabs.Tab value="coverage" leftSection={<IconChartDots size={16} />}>
            Coverage Analysis
          </Tabs.Tab>
          <Tabs.Tab value="quality" leftSection={<IconDashboard size={16} />}>
            Telemetry Quality
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="gaps" pt="md">
          <ObservabilityGapAnalysis />
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md">
          <AlertTuningRecommendations />
        </Tabs.Panel>

        <Tabs.Panel value="coverage" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Service Coverage Analysis</Title>
            
            {observabilityData?.coverage?.services ? (
              <Stack gap="md">
                {observabilityData.coverage.services.map((service: any) => (
                  <Card key={service.service} withBorder padding="md" radius="sm">
                    <Group justify="space-between" mb="sm">
                      <Text fw={600}>{service.service}</Text>
                      <Badge color={getCoverageColor(service.health_score)}>
                        {service.health_score}% Health
                      </Badge>
                    </Group>
                    
                    <Grid>
                      <Grid.Col span={3}>
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Metrics</Text>
                          <Progress 
                            value={service.metrics.coverage_percentage} 
                            color={getCoverageColor(service.metrics.coverage_percentage)}
                            size="sm"
                          />
                          <Text size="xs">{service.metrics.coverage_percentage}%</Text>
                        </Stack>
                      </Grid.Col>
                      
                      <Grid.Col span={3}>
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Logging</Text>
                          <Progress 
                            value={service.logging.coverage_percentage} 
                            color={getCoverageColor(service.logging.coverage_percentage)}
                            size="sm"
                          />
                          <Text size="xs">{service.logging.coverage_percentage}%</Text>
                        </Stack>
                      </Grid.Col>
                      
                      <Grid.Col span={3}>
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Tracing</Text>
                          <Progress 
                            value={service.tracing.coverage_percentage} 
                            color={getCoverageColor(service.tracing.coverage_percentage)}
                            size="sm"
                          />
                          <Text size="xs">{service.tracing.coverage_percentage}%</Text>
                        </Stack>
                      </Grid.Col>
                      
                      <Grid.Col span={3}>
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Alerts</Text>
                          <Group gap="xs">
                            <Text size="sm">{service.alerting.total_alerts} total</Text>
                            <Badge size="xs" color={service.alerting.active_alerts > 0 ? 'red' : 'green'}>
                              {service.alerting.active_alerts} active
                            </Badge>
                          </Group>
                          <Text size="xs">{service.alerting.alert_accuracy}% accuracy</Text>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed">No coverage data available</Text>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="quality" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Telemetry Quality Metrics</Title>
            
            {observabilityData?.telemetryQuality ? (
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="blue.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">Data Completeness</Text>
                        <Text size="xl" fw={700} c="blue">
                          {observabilityData.telemetryQuality.summary.avg_completeness}%
                        </Text>
                        <Progress 
                          value={observabilityData.telemetryQuality.summary.avg_completeness} 
                          color="blue" 
                          size="sm" 
                          w="100%"
                        />
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="green.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">Metric Accuracy</Text>
                        <Text size="xl" fw={700} c="green">
                          {observabilityData.telemetryQuality.summary.avg_accuracy}%
                        </Text>
                        <Progress 
                          value={observabilityData.telemetryQuality.summary.avg_accuracy} 
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
                        <Text size="sm" c="dimmed">Processing Latency</Text>
                        <Text size="xl" fw={700} c="orange">
                          {observabilityData.telemetryQuality.summary.avg_processing_latency_ms}ms
                        </Text>
                        <Text size="xs" c="dimmed">Average response time</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Card padding="md" radius="sm" bg="violet.0">
                      <Stack gap="xs" align="center">
                        <Text size="sm" c="dimmed">Events Processed</Text>
                        <Text size="xl" fw={700} c="violet">
                          {(observabilityData.telemetryQuality.summary.total_events_processed / 1000000).toFixed(1)}M
                        </Text>
                        <Text size="xs" c="dimmed">Last 24 hours</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Quality Gates Status */}
                <Card padding="md" radius="sm" bg="gray.0">
                  <Title order={4} mb="sm">Quality Gates Status</Title>
                  <Stack gap="xs">
                    {observabilityData.telemetryQuality.violations?.map((violation: any, index: number) => (
                      <Group key={index} justify="space-between">
                        <Text size="sm">{violation.gate}</Text>
                        <Group gap="xs">
                          <Badge color={violation.violations > 0 ? 'red' : 'green'} size="sm">
                            {violation.violations} violations
                          </Badge>
                          <Text size="xs" c="dimmed">{violation.impact}</Text>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : (
              <Text c="dimmed">No telemetry quality data available</Text>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default Observability;