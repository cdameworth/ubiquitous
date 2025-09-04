import React from 'react';
import {
  Container,
  Stack,
  Group,
  Text,
  Badge,
  Card,
  Grid,
  Paper,
  NumberFormatter,
  Alert
} from '@mantine/core';
import {
  IconPresentation,
  IconTarget,
  IconCurrencyDollar,
  IconClock,
  IconTrendingUp,
  IconInfoCircle
} from '@tabler/icons-react';
import DemoScenarioManager from '../components/DemoScenarios/DemoScenarioManager';
import { usePresenterMode } from '../contexts/PresenterModeContext';
import { demoScenarioService } from '../services/DemoScenarioService';

const DemoScenariosPage: React.FC = () => {
  const { isPresenterMode } = usePresenterMode();
  const scenarioSummary = demoScenarioService.getScenarioSummary();

  const handleNavigateToVisualization = (path: string) => {
    // Map visualization names to actual routes
    const routeMap: { [key: string]: string } = {
      'performance': '/performance',
      'infrastructure-graph': '/infrastructure-graph',
      'network-analysis': '/network-analysis',
      'finops': '/finops',
      'security': '/security',
      'observability': '/observability',
      'executive': '/executive'
    };

    const route = routeMap[path];
    if (route) {
      window.location.href = route;
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        {/* Page Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="md">
              <IconPresentation size={32} color="var(--mantine-color-cg-navy-6)" />
              <Stack gap={2}>
                <Text size="xl" fw={700} c="cg-navy.6">
                  Demo Scenarios
                </Text>
                <Text size="md" c="dimmed">
                  Interactive business value demonstrations with real-time AWS infrastructure analysis
                </Text>
              </Stack>
            </Group>
          </Stack>

          {isPresenterMode && (
            <Badge size="xl" color="blue" leftSection={<IconPresentation size={18} />}>
              Presenter Mode Active
            </Badge>
          )}
        </Group>

        {/* Summary Statistics */}
        <Grid>
          <Grid.Col span={3}>
            <Paper p="lg" radius="md" withBorder bg="blue.0">
              <Stack gap="sm" align="center">
                <IconTarget size={24} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Available Scenarios
                </Text>
                <Text size="xl" fw={700} c="blue.6">
                  {scenarioSummary.totalScenarios}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="lg" radius="md" withBorder bg="green.0">
              <Stack gap="sm" align="center">
                <IconCurrencyDollar size={24} color="var(--mantine-color-green-6)" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Business Value
                </Text>
                <NumberFormatter
                  value={scenarioSummary.totalBusinessValue}
                  prefix="$"
                  thousandSeparator=","
                  suffix="M"
                  decimalScale={1}
                  style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--mantine-color-green-6)' }}
                />
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="lg" radius="md" withBorder bg="orange.0">
              <Stack gap="sm" align="center">
                <IconClock size={24} color="var(--mantine-color-orange-6)" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Total Duration
                </Text>
                <Text size="xl" fw={700} c="orange.6">
                  {Math.round(scenarioSummary.totalDuration / 60)} min
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="lg" radius="md" withBorder bg="purple.0">
              <Stack gap="sm" align="center">
                <IconTrendingUp size={24} color="var(--mantine-color-purple-6)" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Categories
                </Text>
                <Text size="xl" fw={700} c="purple.6">
                  {scenarioSummary.categories.length}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Information Alert */}
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Demo Scenario System"
          color="blue"
        >
          These scenarios demonstrate real business value through interactive AWS infrastructure analysis. 
          Each scenario guides you through a crisis response, showing how the Ubiquitous platform delivers 
          measurable ROI through intelligent automation and optimization recommendations.
        </Alert>

        {/* Demo Scenario Manager */}
        <DemoScenarioManager onNavigateToVisualization={handleNavigateToVisualization} />

        {/* Scenario Quick Reference */}
        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack gap="md">
            <Text size="lg" fw={600} c="cg-navy.6">
              Available Demo Scenarios
            </Text>
            
            <Grid>
              {demoScenarioService.getAllScenarios().map((scenario) => (
                <Grid.Col key={scenario.id} span={6}>
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs">
                          <Text size="md" fw={600} c="cg-navy.6">
                            {scenario.name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {scenario.description}
                          </Text>
                        </Stack>
                        <Badge color="blue" size="sm">
                          {scenario.steps.length} steps
                        </Badge>
                      </Group>

                      <Group justify="space-between" mt="sm">
                        <Group gap="md">
                          <Group gap="xs">
                            <IconCurrencyDollar size={16} color="var(--mantine-color-green-6)" />
                            <NumberFormatter
                              value={scenario.businessValue}
                              prefix="$"
                              thousandSeparator=","
                              suffix="M"
                              decimalScale={1}
                              style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--mantine-color-green-6)' }}
                            />
                          </Group>
                          <Group gap="xs">
                            <IconClock size={16} color="var(--mantine-color-blue-6)" />
                            <Text size="sm" fw={500} c="blue.6">
                              {Math.round(scenario.totalDuration / 60)} min
                            </Text>
                          </Group>
                        </Group>
                        <Badge 
                          color={
                            scenario.category === 'performance' ? 'blue' :
                            scenario.category === 'cost' ? 'green' :
                            scenario.category === 'security' ? 'red' :
                            'purple'
                          }
                          size="sm"
                        >
                          {scenario.category}
                        </Badge>
                      </Group>
                    </Stack>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default DemoScenariosPage;