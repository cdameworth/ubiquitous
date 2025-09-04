import React, { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Progress,
  Title,
  Alert,
  Timeline,
  Paper,
  RingProgress,
  ActionIcon,
  NumberFormatter,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconAlertTriangle,
  IconDatabase,
  IconActivity,
  IconClock,
  IconTrendingUp,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { DemoScenario, ScenarioStep, demoScenarioService } from '../../services/DemoScenarioService';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface TradingCrisisScenarioProps {
  onValueUpdate?: (value: number) => void;
  autoStart?: boolean;
  presentationMode?: boolean;
}

interface SystemMetrics {
  requests_per_second: number;
  cpu_utilization: number;
  error_rate: number;
  response_time: number;
  active_connections: number;
  max_connections: number;
}

const TradingCrisisScenario: React.FC<TradingCrisisScenarioProps> = ({
  onValueUpdate,
  autoStart = false,
  presentationMode = false
}) => {
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    requests_per_second: 2500,
    cpu_utilization: 35,
    error_rate: 0.1,
    response_time: 45,
    active_connections: 120,
    max_connections: 200
  });
  
  const { subscribeToEvent, send, connected } = useWebSocket();

  // Load scenario on mount
  useEffect(() => {
    const loadScenario = async () => {
      const tradingScenario = await demoScenarioService.getScenario('trading-crisis');
      if (tradingScenario) {
        setScenario(tradingScenario);
        if (autoStart) {
          startScenario();
        }
      }
    };

    loadScenario();
  }, [autoStart]);

  // Subscribe to WebSocket scenario updates
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToEvent('scenario_update', (data) => {
      if (data.scenarioId === 'trading-crisis') {
        const step = data.step;
        setCurrentStep(data.stepIndex);
        
        // Update system metrics based on scenario step
        if (step.metrics) {
          setSystemMetrics(prev => ({ ...prev, ...step.metrics }));
        }
        
        // Notify parent of value updates
        if (step.impact?.financial && onValueUpdate) {
          onValueUpdate(step.impact.financial);
        }
      }
    });

    return unsubscribe;
  }, [connected, subscribeToEvent, onValueUpdate]);

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  const startScenario = useCallback(async () => {
    if (!scenario) return;
    
    const result = await demoScenarioService.startScenario('trading-crisis');
    if (result.success) {
      setIsRunning(true);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Send WebSocket message to backend to start scenario
      send({ type: 'start_scenario', scenarioId: 'trading-crisis' });
    }
  }, [scenario, send]);

  const pauseScenario = useCallback(async () => {
    const result = await demoScenarioService.pauseScenario('trading-crisis');
    if (result.success) {
      setIsPaused(true);
      send({ type: 'pause_scenario', scenarioId: 'trading-crisis' });
    }
  }, [send]);

  const resumeScenario = useCallback(async () => {
    const result = await demoScenarioService.resumeScenario('trading-crisis');
    if (result.success) {
      setIsPaused(false);
      send({ type: 'resume_scenario', scenarioId: 'trading-crisis' });
    }
  }, [send]);

  const stopScenario = useCallback(async () => {
    const result = await demoScenarioService.stopScenario('trading-crisis');
    if (result.success) {
      setIsRunning(false);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Reset metrics to baseline
      setSystemMetrics({
        requests_per_second: 2500,
        cpu_utilization: 35,
        error_rate: 0.1,
        response_time: 45,
        active_connections: 120,
        max_connections: 200
      });
      
      send({ type: 'stop_scenario', scenarioId: 'trading-crisis' });
    }
  }, [send]);

  const jumpToStep = useCallback(async (stepIndex: number) => {
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return;
    
    const result = await demoScenarioService.jumpToStep('trading-crisis', stepIndex);
    if (result.success) {
      setCurrentStep(stepIndex);
      const step = scenario.steps[stepIndex];
      
      // Update metrics for this step
      if (step.metrics) {
        setSystemMetrics(prev => ({ ...prev, ...step.metrics }));
      }
      
      send({ type: 'jump_to_step', scenarioId: 'trading-crisis', stepIndex });
    }
  }, [scenario, send]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStepSeverityColor = (severity: string): string => {
    const colors = {
      'info': 'blue',
      'warning': 'yellow',
      'critical': 'red',
      'resolved': 'green'
    };
    return colors[severity as keyof typeof colors] || 'gray';
  };

  const getMetricStatusColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'error_rate':
        return value > 20 ? 'red' : value > 5 ? 'yellow' : 'green';
      case 'cpu_utilization':
        return value > 90 ? 'red' : value > 70 ? 'yellow' : 'green';
      case 'response_time':
        return value > 1000 ? 'red' : value > 500 ? 'yellow' : 'green';
      case 'active_connections':
        const utilization = (value / systemMetrics.max_connections) * 100;
        return utilization > 95 ? 'red' : utilization > 80 ? 'yellow' : 'green';
      default:
        return 'blue';
    }
  };

  if (!scenario) {
    return (
      <Card withBorder radius="md" p="lg">
        <Stack gap="md" align="center">
          <Text size="lg" c="dimmed">Loading Trading Crisis scenario...</Text>
        </Stack>
      </Card>
    );
  }

  const currentStepData = scenario.steps[currentStep];
  const progressPercentage = ((currentStep + 1) / scenario.steps.length) * 100;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={2} c="cg-navy.6">
            Trading Crisis Resolution
          </Title>
          <Text size="md" c="dimmed">
            Live demonstration: EKS scaling failure during market hours → $2.1M revenue protection
          </Text>
        </Stack>
        
        <Group gap="sm">
          {!isRunning ? (
            <Button
              leftSection={<IconPlayerPlay size={16} />}
              onClick={startScenario}
              color="green"
              variant="filled"
            >
              Start Demo
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={resumeScenario}
                  color="blue"
                  variant="outline"
                >
                  Resume
                </Button>
              ) : (
                <Button
                  leftSection={<IconPlayerPause size={16} />}
                  onClick={pauseScenario}
                  color="yellow"
                  variant="outline"
                >
                  Pause
                </Button>
              )}
              <Button
                leftSection={<IconPlayerStop size={16} />}
                onClick={stopScenario}
                color="red"
                variant="outline"
              >
                Reset
              </Button>
            </>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" p="md" bg="gray.0">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Step {currentStep + 1} of {scenario.steps.length}
            </Text>
            <Group gap="lg">
              <Group gap="xs">
                <IconClock size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">Elapsed: {formatTime(elapsedTime)}</Text>
              </Group>
              <Group gap="xs">
                <IconTrendingUp size={16} color="var(--mantine-color-gray-6)" />
                <Text size="sm" c="dimmed">Target: {formatTime(scenario.duration)}</Text>
              </Group>
            </Group>
          </Group>
          <Progress value={progressPercentage} color="cg-navy" size="lg" />
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="md">Live Trading System Metrics</Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconActivity size={24} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="dimmed">Requests/Second</Text>
                <Text size="lg" fw={700} c={`${getMetricStatusColor('requests_per_second', systemMetrics.requests_per_second)}.8`}>
                  <NumberFormatter value={systemMetrics.requests_per_second} thousandSeparator />
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <RingProgress
                  size={48}
                  thickness={6}
                  sections={[{ value: systemMetrics.cpu_utilization, color: getMetricStatusColor('cpu_utilization', systemMetrics.cpu_utilization) + '.6' }]}
                />
                <Text size="xs" c="dimmed">CPU Utilization</Text>
                <Text size="lg" fw={700} c={`${getMetricStatusColor('cpu_utilization', systemMetrics.cpu_utilization)}.8`}>
                  {systemMetrics.cpu_utilization}%
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconAlertTriangle size={24} color={`var(--mantine-color-${getMetricStatusColor('error_rate', systemMetrics.error_rate)}-6)`} />
                <Text size="xs" c="dimmed">Error Rate</Text>
                <Text size="lg" fw={700} c={`${getMetricStatusColor('error_rate', systemMetrics.error_rate)}.8`}>
                  {systemMetrics.error_rate}%
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconClock size={24} color="var(--mantine-color-blue-6)" />
                <Text size="xs" c="dimmed">Response Time</Text>
                <Text size="lg" fw={700} c={`${getMetricStatusColor('response_time', systemMetrics.response_time)}.8`}>
                  {systemMetrics.response_time}ms
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <IconDatabase size={24} color={`var(--mantine-color-${getMetricStatusColor('active_connections', systemMetrics.active_connections)}-6)`} />
                <Text size="xs" c="dimmed">DB Connections</Text>
                <Text size="lg" fw={700} c={`${getMetricStatusColor('active_connections', systemMetrics.active_connections)}.8`}>
                  {systemMetrics.active_connections}/{systemMetrics.max_connections}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Card>

      <Alert
        color={getStepSeverityColor(currentStepData.severity)}
        title={currentStepData.title}
        icon={currentStepData.severity === 'critical' ? <IconX size={16} /> : 
              currentStepData.severity === 'warning' ? <IconAlertTriangle size={16} /> :
              currentStepData.severity === 'resolved' ? <IconCheck size={16} /> : <IconActivity size={16} />}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm">{currentStepData.description}</Text>
            <Badge color={getStepSeverityColor(currentStepData.severity)} variant="filled">
              {currentStepData.severity.toUpperCase()}
            </Badge>
          </Group>
          
          <Text size="sm" c="dimmed">
            <strong>Affected Component:</strong> {currentStepData.component}
          </Text>
          
          <Text size="sm" c="dimmed">
            <strong>Timestamp:</strong> {currentStepData.timestamp}
          </Text>
          
          {currentStepData.actions && (
            <Stack gap="xs">
              <Text size="sm" fw={600}>Actions Taken:</Text>
              {currentStepData.actions.map((action, index) => (
                <Text key={index} size="sm" c="dimmed">• {action}</Text>
              ))}
            </Stack>
          )}
          
          {currentStepData.impact && (
            <Paper p="md" radius="md" bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
              <Stack gap="xs">
                <Text size="sm" fw={600} c="green.8">Business Impact</Text>
                <Group justify="space-between">
                  <Text size="sm" c="green.7">Revenue Protected:</Text>
                  <Text size="sm" fw={700} c="green.8">
                    <NumberFormatter prefix="$" value={currentStepData.impact.financial} suffix="" thousandSeparator />
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="green.7">Systems Optimized:</Text>
                  <Text size="sm" fw={700} c="green.8">{currentStepData.impact.systems}</Text>
                </Group>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Alert>

      <Card withBorder radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="md">Crisis Timeline</Title>
        <Timeline
          active={currentStep}
          bulletSize={24}
          lineWidth={2}
          color="cg-navy"
        >
          {scenario.steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index <= currentStep;
            
            return (
              <Timeline.Item
                key={step.id}
                bullet={
                  step.severity === 'critical' ? <IconX size={12} /> :
                  step.severity === 'warning' ? <IconAlertTriangle size={12} /> :
                  step.severity === 'resolved' ? <IconCheck size={12} /> : <IconActivity size={12} />
                }
                title={
                  <Group justify="space-between">
                    <Text fw={600} c={isCompleted ? 'cg-navy.6' : 'dimmed'}>
                      {step.title}
                    </Text>
                    <Badge
                      color={getStepSeverityColor(step.severity)}
                      size="sm"
                      variant={isActive ? 'filled' : 'outline'}
                    >
                      {step.timestamp}
                    </Badge>
                  </Group>
                }
                style={{ cursor: isRunning ? 'pointer' : 'default' }}
                onClick={() => isRunning && jumpToStep(index)}
              >
                {isCompleted && (
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">{step.description}</Text>
                    <Text size="xs" c="dimmed">
                      <strong>Component:</strong> {step.component}
                    </Text>
                  </Stack>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Card>
    </Stack>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" p="lg">
            <Title order={3} c="cg-navy.6" mb="md">Key Scenario Metrics</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs" align="center">
                  <Text size="sm" c="dimmed">Revenue at Risk</Text>
                  <Text size="xl" fw={700} c="red.8">$2.1M</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs" align="center">
                  <Text size="sm" c="dimmed">Resolution Time</Text>
                  <Text size="xl" fw={700} c="cg-navy.8">6m 45s</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs" align="center">
                  <Text size="sm" c="dimmed">Trades Affected</Text>
                  <Text size="xl" fw={700} c="yellow.8">12,847</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs" align="center">
                  <Text size="sm" c="dimmed">MTTR Improvement</Text>
                  <Text size="xl" fw={700} c="green.8">73%</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          {!presentationMode && (
            <Card withBorder radius="md" p="lg">
              <Title order={3} c="cg-navy.6" mb="md">Demo Controls</Title>
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Jump to Step:</Text>
                <Group gap="xs">
                  {scenario.steps.map((step, index) => (
                    <ActionIcon
                      key={step.id}
                      size="lg"
                      variant={index === currentStep ? 'filled' : index < currentStep ? 'light' : 'outline'}
                      color={getStepSeverityColor(step.severity)}
                      onClick={() => jumpToStep(index)}
                      disabled={!isRunning}
                      title={step.title}
                    >
                      {index + 1}
                    </ActionIcon>
                  ))}
                </Group>
              </Stack>
            </Card>
          )}
        </Grid.Col>
      </Grid>

      {currentStepData.severity === 'critical' && isRunning && (
        <Alert
          color="red"
          title="CRITICAL: Trading System Failure"
          icon={<IconAlertTriangle size={16} />}
          variant="filled"
        >
          <Stack gap="sm">
            <Text size="md" c="white">
              Immediate intervention required to prevent revenue loss
            </Text>
            <Group gap="xs">
              <IconClock size={16} color="white" />
              <Text size="sm" c="white" fw={600}>
                Resolution Time: {formatTime(elapsedTime)}
              </Text>
            </Group>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default TradingCrisisScenario;