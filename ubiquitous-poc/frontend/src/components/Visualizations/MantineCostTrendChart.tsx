import React, { useState } from 'react';
import {
  CompositeChart,
  LineChart,
  Card,
  Group,
  Button,
  Text,
  Badge,
  Stack,
  Chip,
  Paper,
  Box,
  Tooltip,
} from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconTarget } from '@tabler/icons-react';

interface CostDataPoint {
  date: string;
  totalCost: number;
  compute: number;
  storage: number;
  network: number;
  database: number;
  other: number;
  forecast?: boolean;
  optimizedCost?: number;
}

interface MantineCostTrendChartProps {
  data: CostDataPoint[];
  selectedServices: string[];
  onServiceToggle: (service: string) => void;
  showForecast?: boolean;
  showOptimization?: boolean;
  className?: string;
}

const MantineCostTrendChart: React.FC<MantineCostTrendChartProps> = ({
  data,
  selectedServices,
  onServiceToggle,
  showForecast = true,
  showOptimization = true,
  className = ''
}) => {
  const [hoveredData, setHoveredData] = useState<CostDataPoint | null>(null);

  const serviceColors = {
    compute: 'blue.6',
    database: 'violet.6', 
    storage: 'teal.6',
    network: 'orange.6',
    other: 'gray.6'
  };

  const services = ['compute', 'database', 'storage', 'network', 'other'];

  // Transform data for Mantine Charts
  const historicalData = data.filter(d => !d.forecast);
  const forecastData = data.filter(d => d.forecast);
  const allData = [...historicalData, ...forecastData];

  // Prepare chart series based on selected services
  const chartSeries = [
    {
      name: 'Total Cost',
      color: 'cg-navy.6',
      type: 'line' as const,
    },
    ...(showOptimization ? [{
      name: 'Optimized Cost',
      color: 'green.6',
      type: 'line' as const,
    }] : []),
    ...selectedServices.map(service => ({
      name: service.charAt(0).toUpperCase() + service.slice(1),
      color: serviceColors[service as keyof typeof serviceColors],
      type: 'line' as const,
    }))
  ];

  // Calculate savings metrics
  const latestData = historicalData[historicalData.length - 1];
  const totalSavings = latestData?.optimizedCost ? 
    latestData.totalCost - latestData.optimizedCost : 0;
  const savingsPercentage = latestData?.totalCost ? 
    ((totalSavings / latestData.totalCost) * 100).toFixed(1) : '0';

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card className={className} withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="md">
        {/* Chart Header with Controls */}
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600} c="cg-navy.6">
              Cost Trends Analysis
            </Text>
            {showOptimization && totalSavings > 0 && (
              <Badge
                color="green"
                variant="light"
                leftSection={<IconTarget size={12} />}
              >
                {formatCurrency(totalSavings)} Potential Savings ({savingsPercentage}%)
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {showForecast && (
              <Badge color="blue" variant="outline" size="sm">
                Forecast Enabled
              </Badge>
            )}
            {showOptimization && (
              <Badge color="green" variant="outline" size="sm">
                Optimization View
              </Badge>
            )}
          </Group>
        </Group>

        {/* Service Selection Chips */}
        <Group gap="xs">
          <Text size="sm" fw={500} c="dimmed">
            Services:
          </Text>
          {services.map(service => (
            <Chip
              key={service}
              checked={selectedServices.includes(service)}
              onChange={() => onServiceToggle(service)}
              color={serviceColors[service as keyof typeof serviceColors].split('.')[0]}
              size="sm"
            >
              {service.charAt(0).toUpperCase() + service.slice(1)}
            </Chip>
          ))}
        </Group>

        {/* Cost Trend Chart */}
        <Box h={400}>
          <CompositeChart
            h={350}
            data={allData}
            dataKey="date"
            gridColor="gray.3"

            withLegend
            series={chartSeries}
            referenceLines={showOptimization && latestData?.optimizedCost ? [
              {
                y: latestData.optimizedCost,
                color: 'green.6',
                label: 'Target Cost',
              }
            ] : []}
            tooltipProps={{
              content: ({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                
                return (
                  <Paper p="sm" shadow="md" radius="md" withBorder>
                    <Text size="sm" fw={500} mb="xs">
                      {new Date(label).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
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
                          {formatCurrency(entry.value)}
                        </Text>
                      </Group>
                    ))}
                  </Paper>
                );
              }
            }}
          />
        </Box>

        {/* Cost Breakdown Summary */}
        {latestData && (
          <Paper p="md" radius="md" bg="gray.0" withBorder>
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Current Month
                </Text>
                <Text size="lg" fw={700} c="cg-navy.6">
                  {formatCurrency(latestData.totalCost)}
                </Text>
              </Stack>
              
              {showOptimization && latestData.optimizedCost && (
                <Stack gap={4} align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Optimized Target
                  </Text>
                  <Group gap="xs">
                    <Text size="lg" fw={700} c="green.6">
                      {formatCurrency(latestData.optimizedCost)}
                    </Text>
                    <IconTrendingDown size={16} color="var(--mantine-color-green-6)" />
                  </Group>
                </Stack>
              )}
              
              <Stack gap={4} align="flex-end">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Monthly Trend
                </Text>
                <Group gap="xs">
                  {historicalData.length >= 2 && (
                    <>
                      {latestData.totalCost > historicalData[historicalData.length - 2].totalCost ? (
                        <IconTrendingUp size={16} color="var(--mantine-color-red-6)" />
                      ) : (
                        <IconTrendingDown size={16} color="var(--mantine-color-green-6)" />
                      )}
                      <Text 
                        size="sm" 
                        fw={500}
                        c={latestData.totalCost > historicalData[historicalData.length - 2].totalCost ? 'red' : 'green'}
                      >
                        {((latestData.totalCost - historicalData[historicalData.length - 2].totalCost) / historicalData[historicalData.length - 2].totalCost * 100).toFixed(1)}%
                      </Text>
                    </>
                  )}
                </Group>
              </Stack>
            </Group>
          </Paper>
        )}
      </Stack>
    </Card>
  );
};

export default MantineCostTrendChart;