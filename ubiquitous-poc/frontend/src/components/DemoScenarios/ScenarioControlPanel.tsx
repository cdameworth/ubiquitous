import React, { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Switch,
  Tabs,
  Paper,
  Progress,
  Title,
  ActionIcon,
  RingProgress,
  Timeline,
  Alert,
  NumberFormatter,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconRefresh,
  IconPresentation,
  IconChartLine,
  IconTrendingUp,
  IconShield,
  IconAlertTriangle,
  IconTarget,
  IconClock,
  IconCoin,
} from '@tabler/icons-react';
import { demoScenarioService } from '../../services/DemoScenarioService';
import { useWebSocket } from '../../contexts/WebSocketContext';
import TradingCrisisScenario from './TradingCrisisScenario';
import CostSpiralScenario from './CostSpiralScenario';
import SecurityBreachScenario from './SecurityBreachScenario';
import ExecutiveValueScenario from './ExecutiveValueScenario';

interface ScenarioControlPanelProps {
  presentationMode?: boolean;
}

interface ScenarioStatus {
  id: string;
  name: string;
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  elapsedTime: number;
  estimatedValue: number;
}

interface PresentationMetrics {
  totalDemoValue: number;
  activeScenarios: number;
  audienceEngagement: number;
  credibilityScore: number;
}

const ScenarioControlPanel: React.FC<ScenarioControlPanelProps> = ({
  presentationMode = false
}) => {
  const [activeScenario, setActiveScenario] = useState<string>('trading-crisis');
  const [allScenariosStatus, setAllScenariosStatus] = useState<ScenarioStatus[]>([
    {
      id: 'trading-crisis',
      name: 'Trading Crisis Resolution',
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 8,
      elapsedTime: 0,
      estimatedValue: 2100000
    },
    {
      id: 'cost-spiral',
      name: 'AWS Cost Spiral',
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 6,
      elapsedTime: 0,
      estimatedValue: 780000
    },
    {
      id: 'security-breach',
      name: 'Security Breach Response',
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 7,
      elapsedTime: 0,
      estimatedValue: 6080000
    },
    {
      id: 'executive-value',
      name: 'Executive Value Demo',
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 5,
      elapsedTime: 0,
      estimatedValue: 41600000
    }
  ]);
  const [presentationMetrics, setPresentationMetrics] = useState<PresentationMetrics>({
    totalDemoValue: 50560000,
    activeScenarios: 0,
    audienceEngagement: 0,
    credibilityScore: 94
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { subscribeToEvent, send, connected } = useWebSocket();

  // Subscribe to scenario updates from all scenarios
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToEvent('scenario_update', (data) => {
      setAllScenariosStatus(prev => prev.map(scenario => {
        if (scenario.id === data.scenarioId) {
          return {
            ...scenario,
            isRunning: data.isRunning,
            isPaused: data.isPaused,
            currentStep: data.stepIndex,
            elapsedTime: data.elapsedTime || scenario.elapsedTime
          };
        }
        return scenario;
      }));
      
      // Update presentation metrics
      const activeCount = allScenariosStatus.filter(s => s.isRunning).length;
      setPresentationMetrics(prev => ({
        ...prev,
        activeScenarios: activeCount,
        audienceEngagement: Math.min(activeCount * 25 + Math.random() * 10, 100)
      }));
    });

    return unsubscribe;
  }, [connected, subscribeToEvent, allScenariosStatus]);

  const startAllScenarios = useCallback(async () => {
    for (const scenario of allScenariosStatus) {
      await demoScenarioService.startScenario(scenario.id);
      await new Promise(resolve => setTimeout(resolve, 500)); // Stagger starts
    }
    setIsDemoMode(true);
  }, [allScenariosStatus]);

  const stopAllScenarios = useCallback(async () => {
    for (const scenario of allScenariosStatus) {
      await demoScenarioService.stopScenario(scenario.id);
    }
    setIsDemoMode(false);
  }, [allScenariosStatus]);

  const pauseAllScenarios = useCallback(async () => {
    for (const scenario of allScenariosStatus) {
      if (scenario.isRunning && !scenario.isPaused) {
        await demoScenarioService.pauseScenario(scenario.id);
      }
    }
  }, [allScenariosStatus]);

  const resumeAllScenarios = useCallback(async () => {
    for (const scenario of allScenariosStatus) {
      if (scenario.isRunning && scenario.isPaused) {
        await demoScenarioService.resumeScenario(scenario.id);
      }
    }
  }, [allScenariosStatus]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScenarioIcon = (scenarioId: string) => {
    const icons = {
      'trading-crisis': IconAlertTriangle,
      'cost-spiral': IconCoin,
      'security-breach': IconShield,
      'executive-value': IconChartLine
    };
    return icons[scenarioId as keyof typeof icons] || IconTarget;
  };

  const getStatusColor = (scenario: ScenarioStatus): string => {
    if (!scenario.isRunning) return 'gray';
    if (scenario.isPaused) return 'yellow';
    return 'green';
  };

  const renderActiveScenario = () => {
    const commonProps = {
      autoStart: false,
      presentationMode,
      onValueUpdate: (value: number) => {
        setPresentationMetrics(prev => ({
          ...prev,
          totalDemoValue: prev.totalDemoValue + value - allScenariosStatus.find(s => s.id === activeScenario)?.estimatedValue || 0
        }));
      }
    };

    switch (activeScenario) {
      case 'trading-crisis':
        return <TradingCrisisScenario {...commonProps} />;
      case 'cost-spiral':
        return <CostSpiralScenario {...commonProps} />;
      case 'security-breach':
        return <SecurityBreachScenario {...commonProps} />;
      case 'executive-value':
        return <ExecutiveValueScenario {...commonProps} />;
      default:
        return <TradingCrisisScenario {...commonProps} />;
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            Demo Scenario Control Center
          </Title>
          <Text size="lg" c="dimmed">
            Orchestrate live infrastructure intelligence demonstrations
          </Text>
        </Stack>
        
        <Group gap="sm">
          <Switch
            checked={presentationMode}
            onChange={() => window.location.reload()}
            label="Presentation Mode"
            thumbIcon={presentationMode ? <IconPresentation size={12} /> : undefined}
          />
          <ActionIcon variant="outline" color="gray">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Presentation Metrics */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder radius="md" p="lg" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
            <Stack gap="sm" align="center">
              <IconTarget size={32} color="var(--mantine-color-blue-6)" />
              <Text size="xl" fw={700} c="blue.8">
                <NumberFormatter prefix="$" value={presentationMetrics.totalDemoValue} suffix="" thousandSeparator />
              </Text>
              <Text size="sm" c="blue.7" ta="center">
                Total Demo Value
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder radius="md" p="lg" bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
            <Stack gap="sm" align="center">
              <IconTrendingUp size={32} color="var(--mantine-color-green-6)" />
              <Text size="xl" fw={700} c="green.8">
                {presentationMetrics.activeScenarios}/4
              </Text>
              <Text size="sm" c="green.7" ta="center">
                Active Scenarios
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder radius="md" p="lg" bg="violet.0" style={{ borderColor: 'var(--mantine-color-violet-3)' }}>
            <Stack gap="sm" align="center">
              <RingProgress
                size={64}
                thickness={8}
                sections={[{ value: presentationMetrics.credibilityScore, color: 'violet.6' }]}
                label={
                  <Text size="sm" fw={700} ta="center" c="violet.8">
                    {presentationMetrics.credibilityScore}%
                  </Text>
                }
              />
              <Text size="sm" c="violet.7" ta="center">
                Credibility Score
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder radius="md" p="lg" bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
            <Stack gap="sm" align="center">
              <IconClock size={32} color="var(--mantine-color-orange-6)" />
              <Text size="xl" fw={700} c="orange.8">
                8-12
              </Text>
              <Text size="sm" c="orange.7" ta="center">
                Months to Deploy
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Master Controls */}
      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={3} c="cg-navy.6">Master Demo Controls</Title>
          <Badge color={isDemoMode ? 'green' : 'gray'} variant="filled">
            {isDemoMode ? 'Demo Active' : 'Demo Inactive'}
          </Badge>
        </Group>
        
        <Group gap="sm">
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={startAllScenarios}
            disabled={isDemoMode}
            color="green"
            variant="filled"
          >
            Start All Demos
          </Button>
          <Button
            leftSection={<IconPlayerPause size={16} />}
            onClick={pauseAllScenarios}
            disabled={!isDemoMode}
            color="yellow"
            variant="outline"
          >
            Pause All
          </Button>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={resumeAllScenarios}
            disabled={!isDemoMode}
            color="blue"
            variant="outline"
          >
            Resume All
          </Button>
          <Button
            leftSection={<IconPlayerStop size={16} />}
            onClick={stopAllScenarios}
            disabled={!isDemoMode}
            color="red"
            variant="outline"
          >
            Stop All
          </Button>
        </Group>
      </Card>

      {/* Scenario Status Grid */}
      <Grid>
        {allScenariosStatus.map((scenario) => {
          const IconComponent = getScenarioIcon(scenario.id);
          const progressPercentage = ((scenario.currentStep + 1) / scenario.totalSteps) * 100;
          
          return (
            <Grid.Col key={scenario.id} span={{ base: 12, sm: 6, lg: 3 }}>
              <Card
                withBorder
                radius="md"
                p="md"
                style={{
                  cursor: 'pointer',
                  borderColor: activeScenario === scenario.id ? 'var(--mantine-color-blue-4)' : undefined,
                  backgroundColor: activeScenario === scenario.id ? 'var(--mantine-color-blue-0)' : undefined
                }}
                onClick={() => setActiveScenario(scenario.id)}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconComponent size={20} color="var(--mantine-color-cg-navy-6)" />
                      <Text size="sm" fw={600} c="cg-navy.6" truncate>
                        {scenario.name}
                      </Text>
                    </Group>
                    <Badge color={getStatusColor(scenario)} size="sm">
                      {scenario.isRunning ? (scenario.isPaused ? 'Paused' : 'Running') : 'Stopped'}
                    </Badge>
                  </Group>
                  
                  <Text size="xl" fw={700} c="cg-navy.8">
                    <NumberFormatter prefix="$" value={scenario.estimatedValue} suffix="" thousandSeparator />
                  </Text>
                  
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Progress</Text>
                      <Text size="xs" c="dimmed">{scenario.currentStep + 1}/{scenario.totalSteps}</Text>
                    </Group>
                    <Progress
                      value={progressPercentage}
                      color={getStatusColor(scenario)}
                      size="sm"
                    />
                  </Stack>
                  
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Runtime: {formatTime(scenario.elapsedTime)}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      {/* Active Scenario Display */}
      <Card withBorder radius="md" p="lg">
        <Tabs value={activeScenario} onChange={(value) => setActiveScenario(value || 'trading-crisis')} color="cg-navy">
          <Tabs.List>
            {allScenariosStatus.map((scenario) => {
              const IconComponent = getScenarioIcon(scenario.id);
              return (
                <Tabs.Tab
                  key={scenario.id}
                  value={scenario.id}
                  leftSection={<IconComponent size={16} />}
                >
                  {scenario.name}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>

          {allScenariosStatus.map((scenario) => (
            <Tabs.Panel key={scenario.id} value={scenario.id} pt="lg">
              {renderActiveScenario()}
            </Tabs.Panel>
          ))}
        </Tabs>
      </Card>

      {/* Presentation Summary */}
      {presentationMode && (
        <Card withBorder radius="md" p="lg" bg="gray.0">
          <Stack gap="lg">
            <Group justify="space-between">
              <Title order={3} c="cg-navy.6">Executive Summary</Title>
              <Badge color="blue" variant="filled">
                Presentation Mode
              </Badge>
            </Group>
            
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={600} c="cg-navy.6">Infrastructure Intelligence Value</Text>
                    <Text size="xl" fw={700} c="cg-navy.8">
                      <NumberFormatter prefix="$" value={presentationMetrics.totalDemoValue} suffix="" thousandSeparator />
                    </Text>
                    <Text size="xs" c="dimmed">Annual business value demonstration</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={600} c="cg-navy.6">Platform Capabilities</Text>
                    <Text size="xl" fw={700} c="cg-navy.8">4</Text>
                    <Text size="xs" c="dimmed">Crisis scenarios successfully resolved</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={600} c="cg-navy.6">Technical Credibility</Text>
                    <Text size="xl" fw={700} c="cg-navy.8">{presentationMetrics.credibilityScore}%</Text>
                    <Text size="xs" c="dimmed">Executive confidence in solution</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="xs" align="center">
                    <Text size="sm" fw={600} c="cg-navy.6">Implementation Timeline</Text>
                    <Text size="xl" fw={700} c="cg-navy.8">8-12</Text>
                    <Text size="xs" c="dimmed">Months to full platform deployment</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
            
            <Alert color="blue" title="Recommended Next Steps" icon={<IconTarget size={16} />}>
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                <Timeline.Item bullet={<Text size="xs" fw={700}>1</Text>} title="Executive Approval">
                  <Text size="sm" c="dimmed">Phase 1 development approval ($3.4M investment)</Text>
                </Timeline.Item>
                <Timeline.Item bullet={<Text size="xs" fw={700}>2</Text>} title="Team Formation">
                  <Text size="sm" c="dimmed">Specialized team (15-20 engineers, 28-month timeline)</Text>
                </Timeline.Item>
                <Timeline.Item bullet={<Text size="xs" fw={700}>3</Text>} title="Infrastructure Graph">
                  <Text size="sm" c="dimmed">Dependency graph implementation (first 6 months)</Text>
                </Timeline.Item>
                <Timeline.Item bullet={<Text size="xs" fw={700}>4</Text>} title="Executive Reporting">
                  <Text size="sm" c="dimmed">Real-time dashboards and reporting (months 7-12)</Text>
                </Timeline.Item>
              </Timeline>
            </Alert>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default ScenarioControlPanel;