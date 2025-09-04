import React, { useState } from 'react';
import {
  DonutChart,
  BarChart,
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Grid,
  Paper,
  Progress,
  ActionIcon,
  Select,
  Tooltip,
  Box,
  RingProgress,
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconTarget,
  IconInfoCircle,
} from '@tabler/icons-react';

interface CostItem {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'network' | 'database' | 'other';
  service: string;
  cost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  children?: CostItem[];
  region?: string;
  instanceType?: string;
  optimizable?: boolean;
  potentialSavings?: number;
}

interface MantineCostBreakdownProps {
  data: CostItem[];
  onItemSelect: (item: CostItem) => void;
  selectedTimeRange: '7d' | '30d' | '90d';
  className?: string;
}

const MantineCostBreakdown: React.FC<MantineCostBreakdownProps> = ({
  data,
  onItemSelect,
  selectedTimeRange,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryColors = {
    compute: 'blue',
    storage: 'teal',
    network: 'orange',
    database: 'violet',
    other: 'gray'
  };

  // Calculate totals and prepare donut chart data
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
  const categoryTotals = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.cost;
    return acc;
  }, {} as Record<string, number>);

  const donutData = Object.entries(categoryTotals).map(([category, cost]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: cost,
    color: `${categoryColors[category as keyof typeof categoryColors]}.6`,
  }));

  // Prepare detailed breakdown data
  const filteredData = selectedCategory === 'all' ? 
    data : data.filter(item => item.category === selectedCategory);

  const barChartData = filteredData
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)
    .map(item => ({
      name: item.name,
      cost: item.cost,
      optimized: item.optimizable ? (item.cost - (item.potentialSavings || 0)) : item.cost,
      trend: item.trendPercentage,
    }));

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'increasing') return <IconTrendingUp size={14} color="var(--mantine-color-red-6)" />;
    if (trend === 'decreasing') return <IconTrendingDown size={14} color="var(--mantine-color-green-6)" />;
    return <IconMinus size={14} color="var(--mantine-color-gray-5)" />;
  };

  const totalOptimizableSavings = data
    .filter(item => item.optimizable)
    .reduce((sum, item) => sum + (item.potentialSavings || 0), 0);

  return (
    <Card className={className} withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="lg">
        {/* Header with Summary */}
        <Group justify="space-between">
          <Stack gap={4}>
            <Text size="lg" fw={600} c="cg-navy.6">
              Cost Breakdown Analysis
            </Text>
            <Text size="sm" c="dimmed">
              {selectedTimeRange === '7d' ? 'Last 7 days' : 
               selectedTimeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </Text>
          </Stack>
          
          <Stack gap={4} align="flex-end">
            <Text size="xs" c="dimmed" tt="uppercase">Total Cost</Text>
            <Text size="xl" fw={700} c="cg-navy.6">
              {formatCurrency(totalCost)}
            </Text>
          </Stack>
        </Group>

        {/* Optimization Summary */}
        {totalOptimizableSavings > 0 && (
          <Paper p="md" radius="md" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-3)' }}>
            <Group justify="space-between">
              <Group gap="sm">
                <IconTarget size={20} color="var(--mantine-color-green-6)" />
                <Stack gap={2}>
                  <Text size="sm" fw={500} c="green.8">
                    Optimization Opportunity
                  </Text>
                  <Text size="xs" c="green.7">
                    {data.filter(item => item.optimizable).length} resources can be optimized
                  </Text>
                </Stack>
              </Group>
              <Stack gap={2} align="flex-end">
                <Text size="lg" fw={700} c="green.8">
                  {formatCurrency(totalOptimizableSavings)}
                </Text>
                <Text size="xs" c="green.7">
                  {((totalOptimizableSavings / totalCost) * 100).toFixed(1)}% potential savings
                </Text>
              </Stack>
            </Group>
          </Paper>
        )}

        <Grid>
          {/* Category Breakdown - Donut Chart */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Text size="md" fw={500} c="cg-navy.6">
                Cost Distribution
              </Text>
              
              <Group justify="center">
                <DonutChart
                  data={donutData}
                  h={220}
                  withLabels
                  withTooltip
                  strokeColor="white"
                  tooltipDataSource="segment"
                />
              </Group>

              {/* Category Legend with Details */}
              <Stack gap="xs">
                {Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, cost]) => {
                    const percentage = ((cost / totalCost) * 100).toFixed(1);
                    return (
                      <Group key={category} justify="space-between" p="xs">
                        <Group gap="sm">
                          <Box
                            w={12}
                            h={12}
                            style={{
                              backgroundColor: `var(--mantine-color-${categoryColors[category as keyof typeof categoryColors]}-6)`,
                              borderRadius: 3,
                            }}
                          />
                          <Text size="sm" fw={500}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>
                            {formatCurrency(cost)}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({percentage}%)
                          </Text>
                        </Group>
                      </Group>
                    );
                  })}
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Detailed Resource Breakdown */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="md" fw={500} c="cg-navy.6">
                  Resource Details
                </Text>
                <Select
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value || 'all')}
                  data={[
                    { value: 'all', label: 'All Categories' },
                    ...Object.keys(categoryColors).map(cat => ({
                      value: cat,
                      label: cat.charAt(0).toUpperCase() + cat.slice(1)
                    }))
                  ]}
                  w={160}
                  size="sm"
                />
              </Group>

              {/* Top Resources Bar Chart */}
              <Box h={250}>
                <BarChart
                  h={220}
                  data={barChartData}
                  dataKey="name"
                  orientation="vertical"
                  yAxisProps={{ width: 120 }}
                  series={[
                    { name: 'cost', color: 'cg-navy.5', label: 'Current Cost' },
                    { name: 'optimized', color: 'green.5', label: 'Optimized Cost' },
                  ]}
                  tickLine="xy"
                  gridAxis="xy"
                />
              </Box>

              {/* Resource List with Optimization Details */}
              <Stack gap="xs" mah={200} style={{ overflow: 'auto' }}>
                {filteredData
                  .sort((a, b) => b.cost - a.cost)
                  .slice(0, 8)
                  .map((item) => (
                    <Paper
                      key={item.id}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => onItemSelect(item)}
                    >
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {item.name}
                            </Text>
                            {item.optimizable && (
                              <Badge color="green" size="xs">
                                Optimizable
                              </Badge>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed">
                            {item.service} • {item.region || 'Global'}
                          </Text>
                        </Stack>
                        
                        <Stack gap={2} align="flex-end">
                          <Group gap="xs">
                            <Text size="sm" fw={600}>
                              {formatCurrency(item.cost)}
                            </Text>
                            {getTrendIcon(item.trend, item.trendPercentage)}
                            <Text 
                              size="xs" 
                              c={item.trend === 'increasing' ? 'red' : 
                                 item.trend === 'decreasing' ? 'green' : 'gray'}
                            >
                              {item.trendPercentage > 0 ? '+' : ''}{item.trendPercentage}%
                            </Text>
                          </Group>
                          {item.potentialSavings && (
                            <Text size="xs" c="green.6" fw={500}>
                              Save {formatCurrency(item.potentialSavings)}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Paper>
                  ))}
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};

export default MantineCostBreakdown;