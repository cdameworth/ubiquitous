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
} from '@mantine/core';
import { BarChart, LineChart, DonutChart } from '@mantine/charts';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconRefresh,
  IconTarget,
  IconCurrencyDollar,
  IconShield,
  IconBolt,
  IconChartBar,
} from '@tabler/icons-react';

interface BusinessMetric {
  id: string;
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  name: string;
  currentValue: number;
  previousValue: number;
  target: number;
  unit: 'dollars' | 'percentage' | 'count' | 'days';
  trend: 'up' | 'down' | 'stable';
  priority: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
  forecast: number[];
  quarterlyData: number[];
}

interface ExecutiveSummary {
  totalROI: number;
  annualSavings: number;
  riskReduction: number;
  operationalEfficiency: number;
  strategicInitiatives: number;
  complianceScore: number;
  marketPosition: string;
  nextQuarterForecast: number;
}

interface ROIBreakdown {
  category: string;
  investment: number;
  savings: number;
  roi: number;
  timeframe: string;
  confidence: number;
}

interface MantineCEODashboardProps {
  className?: string;
}

const MantineCEODashboard: React.FC<MantineCEODashboardProps> = ({ className = '' }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'quarter' | 'year' | 'multi-year'>('year');

  const mockExecutiveSummary: ExecutiveSummary = {
    totalROI: 342.5,
    annualSavings: 23.2,
    riskReduction: 67,
    operationalEfficiency: 89,
    strategicInitiatives: 85,
    complianceScore: 94,
    marketPosition: 'Leading',
    nextQuarterForecast: 28.7
  };

  const mockMetrics: BusinessMetric[] = [
    {
      id: 'infrastructure-costs',
      category: 'financial',
      name: 'Infrastructure Cost Optimization',
      currentValue: 23.2,
      previousValue: 31.8,
      target: 25.0,
      unit: 'dollars',
      trend: 'down',
      priority: 'high',
      businessImpact: 'Direct impact on operational expenses and profit margins',
      forecast: [23.2, 24.1, 22.8, 21.5, 20.2],
      quarterlyData: [31.8, 29.4, 26.7, 23.2]
    },
    {
      id: 'incident-resolution',
      category: 'operational',
      name: 'Mean Time to Resolution (MTTR)',
      currentValue: 18,
      previousValue: 45,
      target: 15,
      unit: 'days',
      trend: 'down',
      priority: 'critical',
      businessImpact: 'Reduces service downtime and improves customer satisfaction',
      forecast: [18, 16, 15, 14, 13],
      quarterlyData: [45, 38, 28, 18]
    },
    {
      id: 'security-compliance',
      category: 'risk',
      name: 'Security Compliance Score',
      currentValue: 94,
      previousValue: 78,
      target: 95,
      unit: 'percentage',
      trend: 'up',
      priority: 'high',
      businessImpact: 'Reduces regulatory risk and protects brand reputation',
      forecast: [94, 95, 96, 97, 98],
      quarterlyData: [78, 84, 89, 94]
    }
  ];

  const mockROIBreakdown: ROIBreakdown[] = [
    {
      category: 'Infrastructure Optimization',
      investment: 2.8,
      savings: 8.4,
      roi: 200,
      timeframe: '12 months',
      confidence: 92
    },
    {
      category: 'Security Improvements',
      investment: 1.5,
      savings: 3.2,
      roi: 113,
      timeframe: '18 months',
      confidence: 87
    },
    {
      category: 'Process Automation',
      investment: 3.2,
      savings: 7.1,
      roi: 122,
      timeframe: '24 months',
      confidence: 89
    },
    {
      category: 'Compliance Enhancement',
      investment: 0.8,
      savings: 2.1,
      roi: 163,
      timeframe: '6 months',
      confidence: 95
    }
  ];

  // Transform data for charts
  const roiChartData = mockROIBreakdown.map(item => ({
    category: item.category,
    ROI: item.roi,
    Investment: item.investment,
    Savings: item.savings
  }));

  const quarterlyTrendsData = [
    { quarter: 'Q1', Infrastructure: 31.8, Security: 78, Automation: 45 },
    { quarter: 'Q2', Infrastructure: 29.4, Security: 84, Automation: 56 },
    { quarter: 'Q3', Infrastructure: 26.7, Security: 89, Automation: 64 },
    { quarter: 'Q4', Infrastructure: 23.2, Security: 94, Automation: 73 }
  ];

  const strategicInitiativesData = [
    { name: 'Process Automation', value: 73, color: 'blue.6' },
    { name: 'Digital Transformation', value: 68, color: 'teal.6' },
    { name: 'Cloud Migration', value: 82, color: 'green.6' },
    { name: 'Data Analytics', value: 76, color: 'orange.6' },
    { name: 'Security Posture', value: 94, color: 'violet.6' }
  ];

  const formatCurrency = (value: number): string => {
    if (value >= 1) {
      return `$${value.toFixed(1)}M`;
    }
    return `$${(value * 1000).toFixed(0)}K`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />;
      case 'down': return <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />;
      default: return <IconMinus size={16} color="var(--mantine-color-gray-5)" />;
    }
  };

  return (
    <Stack className={className} gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            CEO Executive Dashboard
          </Title>
          <Text size="lg" c="dimmed">
            Strategic business insights and ROI analysis
          </Text>
        </Stack>
        
        <Group gap="sm">
          <Select
            value={selectedTimeframe}
            onChange={(value) => setSelectedTimeframe(value as any)}
            data={[
              { value: 'quarter', label: 'This Quarter' },
              { value: 'year', label: 'This Year' },
              { value: 'multi-year', label: 'Multi-Year' }
            ]}
            w={150}
          />
          <ActionIcon variant="outline" color="gray">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Executive Summary Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
            <Stack gap="sm" align="center">
              <IconCurrencyDollar size={32} color="var(--mantine-color-blue-6)" />
              <Text size="xl" fw={700} c="blue.8">
                {formatCurrency(mockExecutiveSummary.totalROI)}
              </Text>
              <Text size="sm" c="blue.7" ta="center">
                Total ROI
              </Text>
              <Badge color="green" size="sm">
                +{formatCurrency(mockExecutiveSummary.nextQuarterForecast - mockExecutiveSummary.totalROI)} projected
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
            <Stack gap="sm" align="center">
              <IconChartBar size={32} color="var(--mantine-color-green-6)" />
              <Text size="xl" fw={700} c="green.8">
                {formatCurrency(mockExecutiveSummary.annualSavings)}
              </Text>
              <Text size="sm" c="green.7" ta="center">
                Annual Savings
              </Text>
              <Badge color="green" size="sm">
                +27% vs last year
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
            <Stack gap="sm" align="center">
              <IconShield size={32} color="var(--mantine-color-orange-6)" />
              <Text size="xl" fw={700} c="orange.8">
                {mockExecutiveSummary.riskReduction}%
              </Text>
              <Text size="sm" c="orange.7" ta="center">
                Risk Reduction
              </Text>
              <Badge color="green" size="sm">
                +12% this quarter
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="violet.0" style={{ borderColor: 'var(--mantine-color-violet-3)' }}>
            <Stack gap="sm" align="center">
              <IconBolt size={32} color="var(--mantine-color-violet-6)" />
              <Text size="xl" fw={700} c="violet.8">
                {mockExecutiveSummary.operationalEfficiency}%
              </Text>
              <Text size="sm" c="violet.7" ta="center">
                Operational Efficiency
              </Text>
              <Badge color="green" size="sm">
                +15% improvement
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="teal.0" style={{ borderColor: 'var(--mantine-color-teal-3)' }}>
            <Stack gap="sm" align="center">
              <IconTarget size={32} color="var(--mantine-color-teal-6)" />
              <Text size="xl" fw={700} c="teal.8">
                {mockExecutiveSummary.strategicInitiatives}%
              </Text>
              <Text size="sm" c="teal.7" ta="center">
                Strategic Progress
              </Text>
              <Badge color="green" size="sm">
                On track
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
          <Paper p="lg" radius="md" withBorder bg="gray.0" style={{ borderColor: 'var(--mantine-color-gray-3)' }}>
            <Stack gap="sm" align="center">
              <RingProgress
                sections={[{ value: mockExecutiveSummary.complianceScore, color: 'green' }]}
                label={
                  <Text c="green" fw={700} ta="center" size="xs">
                    {mockExecutiveSummary.complianceScore}%
                  </Text>
                }
                size={40}
              />
              <Text size="sm" c="gray.7" ta="center">
                Compliance Score
              </Text>
              <Badge color="green" size="sm">
                {mockExecutiveSummary.marketPosition} position
              </Badge>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Charts Section */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">ROI by Investment Category</Title>
              <Badge color="cg-navy" variant="light">
                Current Year Performance
              </Badge>
            </Group>
            
            <Box h={300}>
              <BarChart
                h={280}
                data={roiChartData}
                dataKey="category"
                orientation="vertical"
                yAxisProps={{ width: 140 }}
                series={[
                  { name: 'ROI', color: 'blue.6', label: 'Return on Investment %' }
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
                          <Text size="xs">Investment:</Text>
                          <Text size="xs" fw={500}>{formatCurrency(data.Investment)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs">Savings:</Text>
                          <Text size="xs" fw={500}>{formatCurrency(data.Savings)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs">ROI:</Text>
                          <Text size="xs" fw={500}>{data.ROI}%</Text>
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
              <Title order={3} c="cg-navy.6">Strategic Initiatives</Title>
              <Badge color="teal" variant="light">
                Progress Overview
              </Badge>
            </Group>

            <Stack gap="md">
              {strategicInitiativesData.map((initiative) => (
                <Stack key={initiative.name} gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {initiative.name}
                    </Text>
                    <Text size="sm" fw={600}>
                      {initiative.value}%
                    </Text>
                  </Group>
                  <Progress
                    value={initiative.value}
                    color={initiative.value > 80 ? 'green' : initiative.value > 60 ? 'blue' : 'orange'}
                    size="md"
                    radius="md"
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quarterly Trends and Key Metrics */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Quarterly Performance Trends</Title>
              <Badge color="blue" variant="light">
                Multi-Metric Analysis
              </Badge>
            </Group>
            
            <Box h={300}>
              <LineChart
                h={280}
                data={quarterlyTrendsData}
                dataKey="quarter"
                series={[
                  { name: 'Infrastructure', color: 'blue.6', label: 'Infrastructure Costs ($M)' },
                  { name: 'Security', color: 'green.6', label: 'Security Score (%)' },
                  { name: 'Automation', color: 'orange.6', label: 'Automation Coverage (%)' }
                ]}
                gridColor="gray.3"

                withLegend
                withTooltip
                curveType="monotone"
              />
            </Box>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h="100%">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Key Business Metrics</Title>
              <ActionIcon variant="subtle" color="gray">
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>

            <Stack gap="md">
              {mockMetrics.slice(0, 3).map((metric) => {
                const change = metric.currentValue - metric.previousValue;
                const changePercent = ((change / metric.previousValue) * 100).toFixed(1);
                
                return (
                  <Paper key={metric.id} p="md" radius="md" withBorder>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Badge 
                          color={metric.priority === 'critical' ? 'red' : metric.priority === 'high' ? 'orange' : 'blue'}
                          size="xs"
                        >
                          {metric.priority.toUpperCase()}
                        </Badge>
                        {getTrendIcon(metric.trend)}
                      </Group>
                      
                      <Text size="sm" fw={500} lineClamp={2}>
                        {metric.name}
                      </Text>
                      
                      <Group justify="space-between">
                        <Text size="lg" fw={700} c="cg-navy.6">
                          {metric.unit === 'dollars' ? formatCurrency(metric.currentValue) : 
                           metric.unit === 'percentage' ? `${metric.currentValue}%` :
                           metric.currentValue.toLocaleString()}
                          {metric.unit === 'days' ? ' days' : metric.unit === 'count' ? ' deployments' : ''}
                        </Text>
                        <Badge 
                          color={metric.trend === 'up' && metric.unit !== 'days' ? 'green' : 
                                metric.trend === 'down' && metric.unit === 'days' ? 'green' : 
                                metric.trend === 'down' && metric.unit !== 'days' ? 'red' : 'gray'}
                          size="sm"
                        >
                          {change > 0 && metric.unit !== 'days' ? '+' : ''}{changePercent}%
                        </Badge>
                      </Group>
                      
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {metric.businessImpact}
                      </Text>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ROI Breakdown Table */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={3} c="cg-navy.6">Investment ROI Breakdown</Title>
          <Badge color="green" variant="light">
            High Confidence Analysis
          </Badge>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Investment</Table.Th>
              <Table.Th>Savings</Table.Th>
              <Table.Th>ROI</Table.Th>
              <Table.Th>Timeframe</Table.Th>
              <Table.Th>Confidence</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mockROIBreakdown.map((item) => (
              <Table.Tr key={item.category}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {item.category}
                  </Text>
                </Table.Td>
                <Table.Td>{formatCurrency(item.investment)}</Table.Td>
                <Table.Td>
                  <Text c="green.6" fw={500}>
                    {formatCurrency(item.savings)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={item.roi > 150 ? 'green' : item.roi > 100 ? 'blue' : 'orange'}>
                    {item.roi}%
                  </Badge>
                </Table.Td>
                <Table.Td>{item.timeframe}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Progress
                      value={item.confidence}
                      color={item.confidence > 90 ? 'green' : item.confidence > 80 ? 'blue' : 'orange'}
                      size="sm"
                      w={60}
                    />
                    <Text size="xs">{item.confidence}%</Text>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
};

export default MantineCEODashboard;