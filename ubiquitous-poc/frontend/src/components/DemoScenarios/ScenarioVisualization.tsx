import React from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  Progress,
  Paper,
  Grid,
  Alert,
  Timeline,
  NumberFormatter,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconClock,
  IconTarget,
  IconTrendingUp,
  IconTrendingDown,
  IconShield,
  IconCurrencyDollar,
  IconRefresh,
  IconCheck
} from '@tabler/icons-react';
import { ScenarioStep } from '../../services/DemoScenarioService';

interface ScenarioVisualizationProps {
  step: ScenarioStep;
  scenarioName: string;
  stepIndex: number;
  totalSteps: number;
  onNavigateToVisualization?: (visualization: string) => void;
}

const ScenarioVisualization: React.FC<ScenarioVisualizationProps> = ({
  step,
  scenarioName,
  stepIndex,
  totalSteps,
  onNavigateToVisualization
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(0)}K`;
    }
    return `${numValue.toFixed(0)}`;
  };

  const getVisualizationIcon = (visualization: string) => {
    switch (visualization) {
      case 'performance': return <IconTrendingUp size={16} />;
      case 'infrastructure-graph': return <IconTarget size={16} />;
      case 'network-analysis': return <IconRefresh size={16} />;
      case 'finops': return <IconCurrencyDollar size={16} />;
      case 'security': return <IconShield size={16} />;
      case 'observability': return <IconClock size={16} />;
      case 'executive': return <IconCheck size={16} />;
      default: return <IconTarget size={16} />;
    }
  };

  return (
    <Card withBorder shadow="lg" radius="md" p="xl" style={{ minHeight: 500 }}>
      <Stack gap="lg">
        {/* Scenario Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="md">
              <Badge 
                size="lg" 
                color="blue" 
                leftSection={<IconTarget size={16} />}
              >
                {scenarioName}
              </Badge>
              <Badge size="md" color="gray" variant="outline">
                Step {stepIndex + 1} of {totalSteps}
              </Badge>
            </Group>
            <Text size="xl" fw={600} c="cg-navy.6">
              {step.description}
            </Text>
          </Stack>

          <Group gap="sm">
            <Tooltip label={`Navigate to ${step.visualization}`}>
              <ActionIcon
                size="lg"
                variant="light"
                color="blue"
                onClick={() => onNavigateToVisualization?.(step.visualization)}
              >
                {getVisualizationIcon(step.visualization)}
              </ActionIcon>
            </Tooltip>
            <Badge color="green" size="lg">
              {step.duration}s
            </Badge>
          </Group>
        </Group>

        {/* Step Progress */}
        <Progress
          value={((stepIndex + 1) / totalSteps) * 100}
          color="blue"
          size="lg"
          radius="md"
          animated
        />

        {/* Key Metrics Grid */}
        <Grid>
          {Object.entries(step.metrics).map(([key, value], index) => (
            <Grid.Col key={key} span={6}>
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {key}
                  </Text>
                  <Text size="lg" fw={700} c="cg-navy.6">
                    {typeof value === 'number' && key.toLowerCase().includes('cost') || key.toLowerCase().includes('saving') || key.toLowerCase().includes('revenue') 
                      ? formatCurrency(value as number)
                      : value
                    }
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>

        {/* Alerts (if present) */}
        {step.data.alerts && (
          <Stack gap="xs">
            <Text size="md" fw={500} c="cg-navy.6">Active Alerts</Text>
            {step.data.alerts.map((alert: any, index: number) => (
              <Alert
                key={index}
                color={getSeverityColor(alert.severity)}
                icon={<IconAlertTriangle size={16} />}
                title={`${alert.severity.toUpperCase()} Alert`}
              >
                {alert.message}
              </Alert>
            ))}
          </Stack>
        )}

        {/* Key Insights */}
        <Stack gap="sm">
          <Text size="md" fw={500} c="cg-navy.6">Key Insights</Text>
          <Timeline active={step.insights.length - 1} bulletSize={24} lineWidth={2}>
            {step.insights.map((insight, index) => (
              <Timeline.Item
                key={index}
                bullet={
                  insight.includes('$') ? <IconCurrencyDollar size={12} /> :
                  insight.includes('%') ? <IconTrendingUp size={12} /> :
                  <IconTarget size={12} />
                }
                title={insight}
              />
            ))}
          </Timeline>
        </Stack>

        {/* Technical Details (if relevant) */}
        {(step.data.cluster || step.data.rds_instance || step.data.sql_instances) && (
          <Paper p="md" radius="md" withBorder bg="blue.0">
            <Stack gap="sm">
              <Text size="sm" fw={500} c="cg-navy.6">Technical Details</Text>
              
              {step.data.cluster && (
                <Group gap="md">
                  <Text size="sm" fw={500}>Cluster:</Text>
                  <Badge color="blue">{step.data.cluster}</Badge>
                </Group>
              )}
              
              {step.data.rds_instance && (
                <Group gap="md">
                  <Text size="sm" fw={500}>RDS Instance:</Text>
                  <Badge color="orange">{step.data.rds_instance}</Badge>
                </Group>
              )}
              
              {step.data.sql_instances && (
                <Group gap="md">
                  <Text size="sm" fw={500}>SQL Instances:</Text>
                  <Badge color="purple">{step.data.sql_instances}</Badge>
                </Group>
              )}

              {step.data.pods && (
                <Group gap="lg">
                  <Group gap="xs">
                    <Text size="sm">Running:</Text>
                    <Badge color="green" size="sm">{step.data.pods.running}</Badge>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm">Pending:</Text>
                    <Badge color="orange" size="sm">{step.data.pods.pending}</Badge>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm">Failed:</Text>
                    <Badge color="red" size="sm">{step.data.pods.failed}</Badge>
                  </Group>
                </Group>
              )}
            </Stack>
          </Paper>
        )}

        {/* Business Impact Summary */}
        <Paper p="md" radius="md" withBorder bg="green.0">
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="green.8">Business Impact</Text>
              <Text size="xs" c="dimmed">
                This step demonstrates measurable value delivery
              </Text>
            </Stack>
            <Badge size="xl" color="green" leftSection={<IconCurrencyDollar size={16} />}>
              {step.id === 'resolution-validation' || step.id === 'business-case' || step.id === 'savings-calculation' || step.id === 'comprehensive-optimization'
                ? 'Value Delivered' 
                : 'Value Building'
              }
            </Badge>
          </Group>
        </Paper>
      </Stack>
    </Card>
  );
};

export default ScenarioVisualization;