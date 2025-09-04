import React, { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  Progress,
  Select,
  Paper,
  Divider,
  ActionIcon,
  Tooltip,
  NumberFormatter,
  Grid,
  Alert
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconTarget,
  IconCurrencyDollar,
  IconClock,
  IconAlertTriangle
} from '@tabler/icons-react';
import { usePresenterMode } from '../../contexts/PresenterModeContext';
import { demoScenarioService, DemoScenario, ScenarioStep } from '../../services/DemoScenarioService';
import ScenarioVisualization from './ScenarioVisualization';

interface DemoScenarioManagerProps {
  onNavigateToVisualization?: (path: string) => void;
}

const DemoScenarioManager: React.FC<DemoScenarioManagerProps> = ({
  onNavigateToVisualization
}) => {
  const { isPresenterMode } = usePresenterMode();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('trading-crisis');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentStepData, setCurrentStepData] = useState<ScenarioStep | null>(null);

  const scenarios = demoScenarioService.getAllScenarios();
  const selectedScenario = demoScenarioService.getScenario(selectedScenarioId);

  useEffect(() => {
    const stepListener = (scenarioId: string, stepIndex: number) => {
      if (scenarioId === selectedScenarioId) {
        setCurrentStep(stepIndex);
        const stepData = demoScenarioService.getCurrentStep(scenarioId);
        setCurrentStepData(stepData);
      }
    };

    demoScenarioService.addStepListener(stepListener);
    return () => demoScenarioService.removeStepListener(stepListener);
  }, [selectedScenarioId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const handleStartScenario = () => {
    const success = demoScenarioService.startScenario(selectedScenarioId);
    if (success) {
      setIsRunning(true);
      setIsPaused(false);
      setElapsedTime(0);
      setCurrentStep(0);
      const stepData = demoScenarioService.getCurrentStep(selectedScenarioId);
      setCurrentStepData(stepData);
    }
  };

  const handlePauseScenario = () => {
    demoScenarioService.pauseScenario();
    setIsPaused(true);
  };

  const handleResumeScenario = () => {
    demoScenarioService.resumeScenario(selectedScenarioId);
    setIsPaused(false);
  };

  const handleStopScenario = () => {
    demoScenarioService.stopScenario();
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setElapsedTime(0);
    setCurrentStepData(null);
  };

  const handleJumpToStep = (stepIndex: number) => {
    const success = demoScenarioService.jumpToStep(selectedScenarioId, stepIndex);
    if (success) {
      setCurrentStep(stepIndex);
      const stepData = demoScenarioService.getCurrentStep(selectedScenarioId);
      setCurrentStepData(stepData);
    }
  };

  const handleScenarioChange = (scenarioId: string) => {
    if (isRunning) {
      handleStopScenario();
    }
    setSelectedScenarioId(scenarioId);
    setCurrentStep(0);
    setCurrentStepData(null);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const scenarioOptions = scenarios.map(scenario => ({
    value: scenario.id,
    label: scenario.name
  }));

  if (!selectedScenario) return null;

  return (
    <Stack gap="lg">
      {/* Scenario Controls */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Text size="lg" fw={600} c="cg-navy.6">
                Demo Scenario Manager
              </Text>
              <Text size="sm" c="dimmed">
                Interactive demonstration scenarios with real business value
              </Text>
            </Stack>
            
            {isPresenterMode && (
              <Badge color="blue" size="lg" leftSection={<IconTarget size={16} />}>
                Presenter Mode Active
              </Badge>
            )}
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Select Scenario"
                value={selectedScenarioId}
                onChange={(value) => handleScenarioChange(value!)}
                data={scenarioOptions}
                disabled={isRunning}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack gap="xs">
                <Text size="sm" fw={500} c="cg-navy.6">Scenario Value</Text>
                <Group gap="md">
                  <NumberFormatter
                    value={selectedScenario.businessValue}
                    prefix="$"
                    thousandSeparator=","
                    suffix="M"
                    decimalScale={1}
                    style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--mantine-color-green-6)' }}
                  />
                  <Badge color="green" size="sm">
                    {formatTime(selectedScenario.totalDuration)} duration
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* Playback Controls */}
          <Group justify="center" gap="md">
            <Tooltip label="Start Scenario">
              <ActionIcon
                size="xl"
                variant="filled"
                color={isRunning ? (isPaused ? 'orange' : 'red') : 'green'}
                onClick={isRunning ? (isPaused ? handleResumeScenario : handlePauseScenario) : handleStartScenario}
                disabled={!selectedScenario}
              >
                {isRunning ? (isPaused ? <IconPlayerPlay size={24} /> : <IconPlayerPause size={24} />) : <IconPlayerPlay size={24} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Stop Scenario">
              <ActionIcon
                size="xl"
                variant="light"
                color="red"
                onClick={handleStopScenario}
                disabled={!isRunning}
              >
                <IconPlayerStop size={24} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Previous Step">
              <ActionIcon
                size="lg"
                variant="light"
                color="blue"
                onClick={() => handleJumpToStep(Math.max(0, currentStep - 1))}
                disabled={!isRunning || currentStep === 0}
              >
                <IconChevronLeft size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Next Step">
              <ActionIcon
                size="lg"
                variant="light"
                color="blue"
                onClick={() => handleJumpToStep(Math.min(selectedScenario.steps.length - 1, currentStep + 1))}
                disabled={!isRunning || currentStep >= selectedScenario.steps.length - 1}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Status Display */}
          {isRunning && (
            <Paper p="sm" radius="md" withBorder bg="blue.0">
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <Badge 
                    color={isPaused ? 'orange' : 'green'} 
                    size="md"
                    leftSection={<IconClock size={14} />}
                  >
                    {isPaused ? 'Paused' : 'Running'}
                  </Badge>
                  <Text size="sm" fw={500}>
                    Elapsed: {formatTime(elapsedTime)}
                  </Text>
                </Group>
                <Group gap="md">
                  <Text size="sm">Progress:</Text>
                  <Badge color="blue" size="sm">
                    {Math.round(((currentStep + 1) / selectedScenario.steps.length) * 100)}%
                  </Badge>
                </Group>
              </Group>
            </Paper>
          )}
        </Stack>
      </Card>

      {/* Step Navigation */}
      <Card withBorder shadow="sm" radius="md" p="md">
        <Stack gap="sm">
          <Text size="md" fw={500} c="cg-navy.6">Scenario Steps</Text>
          
          <Group gap="xs" justify="center">
            {selectedScenario.steps.map((step, index) => (
              <Tooltip key={step.id} label={step.description}>
                <ActionIcon
                  size="lg"
                  variant={index === currentStep ? 'filled' : index < currentStep ? 'light' : 'outline'}
                  color={index === currentStep ? 'blue' : index < currentStep ? 'green' : 'gray'}
                  onClick={() => handleJumpToStep(index)}
                  disabled={!isRunning}
                >
                  {index + 1}
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
        </Stack>
      </Card>

      {/* Current Step Visualization */}
      {currentStepData && (
        <ScenarioVisualization
          step={currentStepData}
          scenarioName={selectedScenario.name}
          stepIndex={currentStep}
          totalSteps={selectedScenario.steps.length}
          onNavigateToVisualization={onNavigateToVisualization}
        />
      )}

      {/* Scenario Preview (when not running) */}
      {!isRunning && (
        <Card withBorder shadow="sm" radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={600} c="cg-navy.6">
                {selectedScenario.name} Preview
              </Text>
              <Badge color="blue" size="lg">
                {selectedScenario.steps.length} Steps
              </Badge>
            </Group>

            <Text size="md" c="dimmed">
              {selectedScenario.description}
            </Text>

            <Grid>
              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder bg="green.0">
                  <Stack gap="xs" align="center">
                    <IconCurrencyDollar size={20} color="var(--mantine-color-green-6)" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Business Value
                    </Text>
                    <NumberFormatter
                      value={selectedScenario.businessValue}
                      prefix="$"
                      thousandSeparator=","
                      suffix="M"
                      decimalScale={1}
                      style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--mantine-color-green-6)' }}
                    />
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder bg="blue.0">
                  <Stack gap="xs" align="center">
                    <IconClock size={20} color="var(--mantine-color-blue-6)" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Duration
                    </Text>
                    <Text size="lg" fw={700} c="blue.6">
                      {formatTime(selectedScenario.totalDuration)}
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder bg="purple.0">
                  <Stack gap="xs" align="center">
                    <IconTarget size={20} color="var(--mantine-color-purple-6)" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Category
                    </Text>
                    <Badge color="purple" size="md">
                      {selectedScenario.category}
                    </Badge>
                  </Stack>
                </Paper>
              </Grid.Col>

              <Grid.Col span={3}>
                <Paper p="md" radius="md" withBorder bg="orange.0">
                  <Stack gap="xs" align="center">
                    <IconChevronRight size={20} color="var(--mantine-color-orange-6)" />
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Steps
                    </Text>
                    <Text size="lg" fw={700} c="orange.6">
                      {selectedScenario.steps.length}
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>

            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Demo Scenario Ready"
              color="blue"
            >
              This scenario demonstrates {selectedScenario.description.toLowerCase()} with realistic AWS infrastructure data and actionable business insights.
            </Alert>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

export default DemoScenarioManager;