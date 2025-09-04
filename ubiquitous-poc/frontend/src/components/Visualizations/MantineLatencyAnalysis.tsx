import React, { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Paper,
  Select,
  Chip,
  Box,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { LineChart, BarChart } from '@mantine/charts';
import {
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconActivity,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface LatencyDataPoint {
  timestamp: number;
  service: string;
  endpoint: string;
  latency: number;
  cluster: string;
  hour?: number;
  day?: string;
  requests?: number;
  errors?: number;
  region?: string;
}

interface MantineLatencyAnalysisProps {
  data: LatencyDataPoint[];
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  onCellSelect?: (dataPoint: any) => void;
  selectedService?: string;
  className?: string;
}

const MantineLatencyAnalysis: React.FC<MantineLatencyAnalysisProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  onCellSelect,
  selectedService,
  className = ''
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['trading-api', 'risk-calc']);
  const [viewMode, setViewMode] = useState<'trends' | 'heatmap' | 'distribution'>('trends');

  const services = Array.from(new Set(data.map(d => d.service)));
  const endpoints = Array.from(new Set(data.map(d => d.endpoint)));

  // Calculate key metrics
  const avgLatency = data.length > 0 
    ? data.reduce((sum, d) => sum + d.latency, 0) / data.length 
    : 0;
  
  const avgPacketLoss = data.length > 0 
    ? data.reduce((sum, d) => sum + (d.errors || 0), 0) / data.length / 1000
    : 0;
  
  const networkHealthPercentage = data.length > 0 
    ? ((data.filter(d => d.latency < 50).length / data.length) * 100)
    : 100;

  // Debug logging
  console.log('Available services from data:', Array.from(new Set(data.map(d => d.service))));
  console.log('Selected services:', selectedServices);
  console.log('Total data points:', data.length);
  
  // Transform data for trend chart with validation
  const trendData = data
    .filter(d => d && selectedServices.includes(d.service) && typeof d.latency === 'number' && !isNaN(d.latency))
    .reduce((acc, point) => {
      // Ensure timestamp is valid before creating Date
      const timestamp = typeof point.timestamp === 'number' && point.timestamp > 0 
        ? point.timestamp 
        : Date.now();
      const timeKey = new Date(timestamp).toISOString().slice(0, 16); // Hour precision
      const existing = acc.find(item => item.time === timeKey);
      const validLatency = Math.max(0, Math.round(point.latency));
      
      if (existing) {
        existing[point.service] = (existing[point.service] || 0) + validLatency;
        existing.count = (existing.count || 0) + 1;
      } else {
        acc.push({
          time: timeKey,
          [point.service]: validLatency,
          count: 1
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(-24); // Last 24 data points
    
  console.log('Filtered data points:', data.filter(d => d && selectedServices.includes(d.service)).length);
  console.log('Trend data after transformation:', trendData.length);
  console.log('First trend data point:', trendData[0]);

  // Transform data for service comparison
  const serviceComparison = services.map(service => {
    const serviceData = data.filter(d => d.service === service);
    const avgLatency = serviceData.length > 0 
      ? serviceData.reduce((sum, d) => sum + d.latency, 0) / serviceData.length 
      : 0;
    const maxLatency = serviceData.length > 0 
      ? Math.max(...serviceData.map(d => d.latency)) 
      : 0;
    const totalRequests = serviceData.reduce((sum, d) => sum + (d.requests || 0), 0);
    const totalErrors = serviceData.reduce((sum, d) => sum + (d.errors || 0), 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      service,
      avgLatency: Math.round(avgLatency),
      maxLatency: Math.round(maxLatency),
      errorRate: Math.round(errorRate * 100) / 100,
      requests: totalRequests,
      status: avgLatency < 20 ? 'healthy' : avgLatency < 50 ? 'warning' : 'critical'
    };
  }).sort((a, b) => b.avgLatency - a.avgLatency);

  // Prepare chart series
  const trendSeries = selectedServices.map((service, index) => ({
    name: service,
    color: `${['blue', 'teal', 'orange', 'violet', 'green'][index % 5]}.6`,
  }));

  console.log('Trend series configuration:', JSON.stringify(trendSeries, null, 2));
  console.log('Sample trend data points:', JSON.stringify(trendData.slice(0, 3), null, 2));
  console.log('All data keys in first point:', Object.keys(trendData[0] || {}));

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service].slice(0, 5) // Max 5 services
    );
  };

  return (
    <Card className={className} withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="lg">
        {/* Header with Controls */}
        <Group justify="space-between">
          <Stack gap={4}>
            <Text size="lg" fw={600} c="cg-navy.6">
              Latency Analysis Dashboard
            </Text>
            <Text size="sm" c="dimmed">
              Real-time network performance monitoring and trend analysis
            </Text>
          </Stack>
          
          <Group gap="sm">
            <Select
              value={timeRange}
              onChange={(value) => onTimeRangeChange(value as '24h' | '7d' | '30d')}
              data={[
                { value: '24h', label: 'Last 24 hours' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' }
              ]}
              w={150}
              size="sm"
            />
            <ActionIcon variant="subtle" color="gray">
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Key Metrics Overview */}
        <Grid>
          <Grid.Col span={4}>
            <Paper p="md" radius="md" withBorder bg="blue.0">
              <Group gap="sm">
                <IconActivity size={20} color="var(--mantine-color-blue-6)" />
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Avg Latency
                  </Text>
                  <Text size="lg" fw={700} c="blue.8">
                    {avgLatency.toFixed(1)}ms
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper p="md" radius="md" withBorder bg="orange.0">
              <Group gap="sm">
                <IconClock size={20} color="var(--mantine-color-orange-6)" />
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Packet Loss
                  </Text>
                  <Text size="lg" fw={700} c="orange.8">
                    {(avgPacketLoss * 100).toFixed(2)}%
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Paper p="md" radius="md" withBorder bg="green.0">
              <Group gap="sm">
                <IconTrendingUp size={20} color="var(--mantine-color-green-6)" />
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Network Health
                  </Text>
                  <Text size="lg" fw={700} c="green.8">
                    {networkHealthPercentage.toFixed(0)}%
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Service Selection */}
        <Stack gap="sm">
          <Text size="md" fw={500} c="cg-navy.6">
            Service Selection
          </Text>
          <Group gap="xs">
            {services.map(service => (
              <Chip
                key={service}
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
                color="blue"
                size="sm"
              >
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </Chip>
            ))}
          </Group>
        </Stack>

        {/* Latency Trends Chart */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="md" fw={500} c="cg-navy.6">
              Latency Trends
            </Text>
            <Group gap="xs">
              <Badge color="blue" variant="outline" size="sm">
                {trendData.length} data points
              </Badge>
            </Group>
          </Group>

          <Box h={300} w="100%" style={{ minHeight: 300, minWidth: 600 }}>
            <LineChart
              h={280}
              w="100%"
              data={trendData}
              dataKey="time"
              series={trendSeries}
              gridColor="gray.3"
              strokeWidth={3}
              withLegend
              withTooltip
              withPointLabels
              tooltipProps={{
                content: ({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  
                  return (
                    <Paper p="sm" shadow="md" radius="md" withBorder>
                      <Text size="sm" fw={500} mb="xs">
                        {formatTime(label)}
                      </Text>
                      {payload.map((entry: any, index: number) => (
                        <Group key={index} justify="space-between" gap="md">
                          <Group gap="xs">
                            <Box
                              w={8}
                              h={8}
                              style={{
                                backgroundColor: entry.color,
                                borderRadius: '50%'
                              }}
                            />
                            <Text size="xs">{entry.name}:</Text>
                          </Group>
                          <Text size="xs" fw={500}>
                            {entry.value.toFixed(1)}ms
                          </Text>
                        </Group>
                      ))}
                    </Paper>
                  );
                }
              }}
            />
          </Box>
        </Stack>

        {/* Service Performance Comparison */}
        <Stack gap="sm">
          <Text size="md" fw={500} c="cg-navy.6">
            Service Performance Breakdown
          </Text>

          <Stack gap="xs">
            {serviceComparison.slice(0, 6).map((service) => (
              <Paper key={service.service} p="sm" radius="md" withBorder>
                <Group justify="space-between">
                  <Group gap="sm">
                    <Badge 
                      color={service.status === 'healthy' ? 'green' : service.status === 'warning' ? 'yellow' : 'red'}
                      variant="light"
                      size="sm"
                    >
                      {service.service.toUpperCase()}
                    </Badge>
                    <Text size="sm" fw={500}>
                      {service.service.charAt(0).toUpperCase() + service.service.slice(1)}
                    </Text>
                  </Group>
                  
                  <Group gap="md">
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed">Avg Latency</Text>
                      <Badge 
                        color={service.avgLatency < 20 ? 'green' : service.avgLatency < 50 ? 'yellow' : 'red'}
                        size="sm"
                      >
                        {service.avgLatency}ms
                      </Badge>
                    </Stack>
                    
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed">Max Latency</Text>
                      <Text size="sm" fw={500}>
                        {service.maxLatency}ms
                      </Text>
                    </Stack>
                    
                    <Stack gap={2} align="center">
                      <Text size="xs" c="dimmed">Error Rate</Text>
                      <Badge 
                        color={service.errorRate < 1 ? 'green' : service.errorRate < 5 ? 'yellow' : 'red'}
                        size="sm"
                        leftSection={service.errorRate > 5 ? <IconAlertTriangle size={12} /> : undefined}
                      >
                        {service.errorRate}%
                      </Badge>
                    </Stack>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

export default MantineLatencyAnalysis;