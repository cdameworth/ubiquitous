import React, { useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Paper,
  Progress,
  ActionIcon,
  Select,
  Title,
  Table,
  RingProgress,
  Box,
  Accordion,
  List,
  ThemeIcon,
} from '@mantine/core';
import { BarChart, DonutChart, RadarChart } from '@mantine/charts';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconRefresh,
  IconServer,
  IconShield,
  IconCpu,
  IconDatabase,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react';

interface TechnicalMetric {
  id: string;
  category: 'infrastructure' | 'security' | 'performance' | 'architecture' | 'compliance';
  name: string;
  currentValue: number;
  target: number;
  unit: 'percentage' | 'count' | 'hours' | 'score' | 'incidents';
  status: 'critical' | 'warning' | 'good' | 'excellent';
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  description: string;
  technicalDetails: string;
  remediation?: string;
}

interface SystemHealth {
  category: string;
  systems: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastIncident?: Date;
  }>;
}

interface TechnologyStack {
  layer: string;
  technologies: Array<{
    name: string;
    version: string;
    status: 'current' | 'outdated' | 'deprecated';
    securityScore: number;
    licenseCompliance: boolean;
    updateAvailable?: string;
  }>;
}

interface ArchitectureInsight {
  domain: string;
  complexity: number;
  maintainability: number;
  scalability: number;
  security: number;
  recommendations: string[];
  technicalDebt: number;
}

interface MantineCIODashboardProps {
  className?: string;
}

const MantineCIODashboard: React.FC<MantineCIODashboardProps> = ({ className = '' }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');

  const mockTechnicalMetrics: TechnicalMetric[] = [
    {
      id: 'system-availability',
      category: 'infrastructure',
      name: 'System Availability',
      currentValue: 99.97,
      target: 99.9,
      unit: 'percentage',
      status: 'excellent',
      trend: 'stable',
      lastUpdated: new Date(),
      description: 'Overall system uptime across all critical services',
      technicalDetails: 'Measured across 15 critical services with 5-minute monitoring intervals',
      remediation: 'Continue current monitoring and incident response procedures'
    },
    {
      id: 'security-vulnerabilities',
      category: 'security',
      name: 'High-Risk Vulnerabilities',
      currentValue: 12,
      target: 5,
      unit: 'count',
      status: 'warning',
      trend: 'declining',
      lastUpdated: new Date(),
      description: 'Critical and high-severity security vulnerabilities requiring immediate attention',
      technicalDetails: '8 critical, 4 high-severity vulnerabilities across infrastructure and applications',
      remediation: 'Prioritize patching of Log4j and OpenSSL vulnerabilities in next sprint'
    },
    {
      id: 'deployment-success-rate',
      category: 'performance',
      name: 'Deployment Success Rate',
      currentValue: 94.2,
      target: 95.0,
      unit: 'percentage',
      status: 'good',
      trend: 'improving',
      lastUpdated: new Date(),
      description: 'Percentage of successful deployments without rollback',
      technicalDetails: '847 deployments this month, 49 requiring rollback',
      remediation: 'Enhance automated testing coverage and improve canary deployment processes'
    },
    {
      id: 'mean-time-to-recovery',
      category: 'performance',
      name: 'Mean Time to Recovery (MTTR)',
      currentValue: 18,
      target: 15,
      unit: 'hours',
      status: 'warning',
      trend: 'improving',
      lastUpdated: new Date(),
      description: 'Average time to resolve critical incidents',
      technicalDetails: 'Based on 23 critical incidents over the last quarter',
      remediation: 'Implement automated incident response playbooks and improve monitoring'
    }
  ];

  const mockSystemHealth: SystemHealth[] = [
    {
      category: 'Trading Infrastructure',
      systems: [
        {
          name: 'Trading API',
          status: 'healthy',
          uptime: 99.98,
          responseTime: 145,
          errorRate: 0.02,
          lastIncident: new Date('2024-08-15')
        },
        {
          name: 'Order Management',
          status: 'healthy',
          uptime: 99.95,
          responseTime: 89,
          errorRate: 0.01
        },
        {
          name: 'Risk Engine',
          status: 'warning',
          uptime: 99.87,
          responseTime: 234,
          errorRate: 0.08,
          lastIncident: new Date('2024-08-25')
        }
      ]
    },
    {
      category: 'Data Infrastructure',
      systems: [
        {
          name: 'PostgreSQL Cluster',
          status: 'healthy',
          uptime: 100.0,
          responseTime: 12,
          errorRate: 0.001
        },
        {
          name: 'Redis Cache',
          status: 'healthy',
          uptime: 99.99,
          responseTime: 1.2,
          errorRate: 0.002
        },
        {
          name: 'Data Pipeline',
          status: 'warning',
          uptime: 99.78,
          responseTime: 2340,
          errorRate: 0.15,
          lastIncident: new Date('2024-08-20')
        }
      ]
    }
  ];

  const mockArchitectureInsights: ArchitectureInsight[] = [
    {
      domain: 'Trading Services',
      complexity: 7.2,
      maintainability: 8.1,
      scalability: 9.0,
      security: 7.8,
      technicalDebt: 6.5,
      recommendations: [
        'Implement circuit breakers for external API calls',
        'Refactor order processing logic to reduce complexity',
        'Add comprehensive integration tests for critical paths'
      ]
    },
    {
      domain: 'Data Pipeline',
      complexity: 8.9,
      maintainability: 6.2,
      scalability: 7.5,
      security: 8.9,
      technicalDebt: 8.1,
      recommendations: [
        'Migrate to event-driven architecture',
        'Implement data lineage tracking',
        'Standardize error handling across pipeline stages'
      ]
    },
    {
      domain: 'Security Infrastructure',
      complexity: 6.8,
      maintainability: 7.9,
      scalability: 8.2,
      security: 9.2,
      technicalDebt: 5.3,
      recommendations: [
        'Implement zero-trust network architecture',
        'Enhance automated threat detection',
        'Standardize security logging format'
      ]
    }
  ];

  // Transform data for charts
  const systemHealthData = mockSystemHealth.flatMap(category => 
    category.systems.map(system => ({
      name: system.name,
      uptime: system.uptime,
      responseTime: system.responseTime,
      category: category.category,
      status: system.status
    }))
  );

  const performanceMetricsData = mockTechnicalMetrics
    .filter(m => m.category === 'performance')
    .map(metric => ({
      name: metric.name,
      current: metric.currentValue,
      target: metric.target,
      status: metric.status
    }));

  const complianceData = [
    { name: 'SOX Compliance', value: 92, color: 'green.6' },
    { name: 'PCI DSS', value: 88, color: 'blue.6' },
    { name: 'GDPR', value: 95, color: 'violet.6' },
    { name: 'ISO 27001', value: 84, color: 'orange.6' }
  ];

  const architectureRadarData = mockArchitectureInsights.map(insight => ({
    domain: insight.domain,
    complexity: insight.complexity,
    maintainability: insight.maintainability,
    scalability: insight.scalability,
    security: insight.security
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <IconCheck size={16} color="var(--mantine-color-green-6)" />;
      case 'good': return <IconCheck size={16} color="var(--mantine-color-blue-6)" />;
      case 'warning': return <IconAlertTriangle size={16} color="var(--mantine-color-yellow-6)" />;
      case 'critical': return <IconX size={16} color="var(--mantine-color-red-6)" />;
      default: return <IconMinus size={16} color="var(--mantine-color-gray-5)" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />;
      case 'declining': return <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />;
      default: return <IconMinus size={16} color="var(--mantine-color-gray-5)" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Stack className={className} gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            CIO Technical Dashboard
          </Title>
          <Text size="lg" c="dimmed">
            Infrastructure performance, security, and architectural insights
          </Text>
        </Stack>
        
        <Group gap="sm">
          <Select
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value || 'overview')}
            data={[
              { value: 'overview', label: 'Overview' },
              { value: 'infrastructure', label: 'Infrastructure' },
              { value: 'security', label: 'Security' },
              { value: 'performance', label: 'Performance' },
              { value: 'architecture', label: 'Architecture' },
              { value: 'compliance', label: 'Compliance' }
            ]}
            w={150}
          />
          <ActionIcon variant="outline" color="gray">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Key Technical Metrics */}
      <Grid>
        {mockTechnicalMetrics.slice(0, 4).map((metric) => (
          <Grid.Col key={metric.id} span={{ base: 12, sm: 6, md: 3 }}>
            <Paper 
              p="lg" 
              radius="md" 
              withBorder 
              bg={metric.status === 'critical' ? 'red.0' : 
                  metric.status === 'warning' ? 'yellow.0' : 
                  metric.status === 'excellent' ? 'green.0' : 'blue.0'}
              style={{ 
                borderColor: metric.status === 'critical' ? 'var(--mantine-color-red-3)' : 
                            metric.status === 'warning' ? 'var(--mantine-color-yellow-3)' : 
                            metric.status === 'excellent' ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-blue-3)'
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between">
                  {getStatusIcon(metric.status)}
                  {getTrendIcon(metric.trend)}
                </Group>
                
                <Text size="xl" fw={700} c="cg-navy.6">
                  {metric.currentValue}
                  {metric.unit === 'percentage' ? '%' : 
                   metric.unit === 'hours' ? 'h' :
                   metric.unit === 'count' ? '' : ''}
                </Text>
                
                <Text size="sm" fw={500} lineClamp={2}>
                  {metric.name}
                </Text>
                
                <Progress
                  value={(metric.currentValue / metric.target) * 100}
                  color={metric.status === 'critical' ? 'red' : 
                        metric.status === 'warning' ? 'yellow' : 
                        metric.status === 'excellent' ? 'green' : 'blue'}
                  size="sm"
                />
                
                <Text size="xs" c="dimmed">
                  Target: {metric.target}{metric.unit === 'percentage' ? '%' : metric.unit === 'hours' ? 'h' : ''}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      {/* System Health and Performance Charts */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">System Health - Uptime Analysis</Title>
              <Badge color="blue" variant="light">
                Real-time Monitoring
              </Badge>
            </Group>
            
            <Box h={350}>
              <BarChart
                h={330}
                data={systemHealthData}
                dataKey="name"
                orientation="vertical"
                yAxisProps={{ width: 120 }}
                series={[
                  { name: 'uptime', color: 'blue.6', label: 'Uptime %' }
                ]}
                tickLine="xy"
                gridAxis="xy"
                withTooltip
                tooltipProps={{
                  content: ({ payload, label }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <Paper p="sm" shadow="md" radius="md" withBorder>
                        <Text size="sm" fw={500} mb="xs">
                          {label}
                        </Text>
                        <Group justify="space-between">
                          <Text size="xs">Uptime:</Text>
                          <Text size="xs" fw={500}>{data.uptime.toFixed(2)}%</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs">Response Time:</Text>
                          <Text size="xs" fw={500}>{data.responseTime}ms</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs">Status:</Text>
                          <Badge size="xs" color={getHealthStatusColor(data.status)}>
                            {data.status}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  }
                }}
              />
            </Box>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Compliance Scores</Title>
              <Badge color="green" variant="light">
                90% Overall
              </Badge>
            </Group>

            <Stack gap="md" align="center">
              <DonutChart
                data={complianceData}
                h={200}
                withLabels
                withTooltip
                strokeColor="white"
                tooltipDataSource="segment"
              />
              
              <Stack gap="xs" w="100%">
                {complianceData.map((item) => (
                  <Group key={item.name} justify="space-between">
                    <Text size="sm">{item.name}</Text>
                    <Badge color={item.value > 90 ? 'green' : item.value > 80 ? 'blue' : 'orange'}>
                      {item.value}%
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Performance Metrics vs Targets */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={3} c="cg-navy.6">Performance Metrics vs Targets</Title>
          <Badge color="cg-navy" variant="light">
            Current vs Target Performance
          </Badge>
        </Group>
        
        <Box h={300}>
          <BarChart
            h={280}
            data={performanceMetricsData}
            dataKey="name"
            orientation="vertical"
            yAxisProps={{ width: 140 }}
            series={[
              { name: 'current', color: 'blue.6', label: 'Current Value' },
              { name: 'target', color: 'green.6', label: 'Target Value' }
            ]}
            tickLine="xy"
            gridAxis="xy"
            withTooltip
          />
        </Box>
      </Card>

      {/* System Health Details */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="md">System Health Details</Title>
        
        <Accordion variant="separated">
          {mockSystemHealth.map((category) => (
            <Accordion.Item key={category.category} value={category.category}>
              <Accordion.Control>
                <Group>
                  <IconServer size={20} />
                  <Text fw={500}>{category.category}</Text>
                  <Badge size="sm" color="blue">
                    {category.systems.length} systems
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Grid>
                  {category.systems.map((system) => (
                    <Grid.Col key={system.name} span={{ base: 12, md: 6, lg: 4 }}>
                      <Paper p="md" radius="md" withBorder>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm" fw={500}>
                              {system.name}
                            </Text>
                            <Badge color={getHealthStatusColor(system.status)} size="xs">
                              {system.status}
                            </Badge>
                          </Group>
                          
                          <Stack gap={4}>
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Uptime</Text>
                              <Text size="xs" fw={500}>{system.uptime.toFixed(2)}%</Text>
                            </Group>
                            <Progress
                              value={system.uptime}
                              color={system.uptime > 99.9 ? 'green' : system.uptime > 99.5 ? 'blue' : 'red'}
                              size="xs"
                            />
                            
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Response Time</Text>
                              <Badge 
                                color={system.responseTime < 100 ? 'green' : system.responseTime < 500 ? 'yellow' : 'red'}
                                size="xs"
                              >
                                {system.responseTime}ms
                              </Badge>
                            </Group>
                            
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Error Rate</Text>
                              <Text size="xs" fw={500} c={system.errorRate < 0.05 ? 'green' : 'red'}>
                                {system.errorRate.toFixed(3)}%
                              </Text>
                            </Group>
                            
                            {system.lastIncident && (
                              <Text size="xs" c="dimmed">
                                Last incident: {system.lastIncident.toLocaleDateString()}
                              </Text>
                            )}
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Card>

      {/* Architecture Quality Assessment */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="md">Architecture Quality Assessment</Title>
        
        <Grid>
          {mockArchitectureInsights.map((insight) => (
            <Grid.Col key={insight.domain} span={{ base: 12, lg: 4 }}>
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="md" fw={600} c="cg-navy.6">
                      {insight.domain}
                    </Text>
                    <Badge 
                      color={insight.technicalDebt < 5 ? 'green' : insight.technicalDebt < 7 ? 'yellow' : 'red'}
                      leftSection={<IconDatabase size={12} />}
                    >
                      Debt: {insight.technicalDebt}/10
                    </Badge>
                  </Group>

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm">Complexity</Text>
                      <Text size="sm" fw={500}>{insight.complexity}/10</Text>
                    </Group>
                    <Progress
                      value={insight.complexity * 10}
                      color={insight.complexity < 5 ? 'green' : insight.complexity < 7 ? 'yellow' : 'red'}
                      size="sm"
                    />

                    <Group justify="space-between">
                      <Text size="sm">Maintainability</Text>
                      <Text size="sm" fw={500}>{insight.maintainability}/10</Text>
                    </Group>
                    <Progress
                      value={insight.maintainability * 10}
                      color={insight.maintainability > 7 ? 'green' : insight.maintainability > 5 ? 'blue' : 'red'}
                      size="sm"
                    />

                    <Group justify="space-between">
                      <Text size="sm">Scalability</Text>
                      <Text size="sm" fw={500}>{insight.scalability}/10</Text>
                    </Group>
                    <Progress
                      value={insight.scalability * 10}
                      color={insight.scalability > 7 ? 'green' : insight.scalability > 5 ? 'blue' : 'red'}
                      size="sm"
                    />

                    <Group justify="space-between">
                      <Text size="sm">Security</Text>
                      <Text size="sm" fw={500}>{insight.security}/10</Text>
                    </Group>
                    <Progress
                      value={insight.security * 10}
                      color={insight.security > 8 ? 'green' : insight.security > 6 ? 'blue' : 'red'}
                      size="sm"
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" fw={500} c="cg-navy.6">Recommendations:</Text>
                    <List size="xs" spacing="xs">
                      {insight.recommendations.slice(0, 3).map((rec, idx) => (
                        <List.Item key={idx}>
                          <Text size="xs" c="dimmed">{rec}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {/* Detailed Technical Metrics Table */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={3} c="cg-navy.6">Detailed Technical Metrics</Title>
          <Badge color="orange" variant="light">
            Requires Attention
          </Badge>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Metric</Table.Th>
              <Table.Th>Current</Table.Th>
              <Table.Th>Target</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Trend</Table.Th>
              <Table.Th>Remediation</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mockTechnicalMetrics.map((metric) => (
              <Table.Tr key={metric.id}>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>
                      {metric.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {metric.description}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>
                    {metric.currentValue}{metric.unit === 'percentage' ? '%' : metric.unit === 'hours' ? 'h' : ''}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {metric.target}{metric.unit === 'percentage' ? '%' : metric.unit === 'hours' ? 'h' : ''}
                </Table.Td>
                <Table.Td>
                  <Badge color={getHealthStatusColor(metric.status === 'excellent' ? 'healthy' : metric.status)}>
                    {metric.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {getTrendIcon(metric.trend)}
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {metric.remediation}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};

export default MantineCIODashboard;