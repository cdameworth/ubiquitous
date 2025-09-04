import React, { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  Switch,
  Select,
  NumberInput,
  Alert,
  ActionIcon,
  Tooltip,
  Grid,
  Paper
} from '@mantine/core';
import {
  IconRocket,
  IconClock,
  IconSettings,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconTarget,
  IconBolt,
  IconAlertTriangle
} from '@tabler/icons-react';
import { usePresenterMode } from '../../contexts/PresenterModeContext';
import { demoScenarioService } from '../../services/DemoScenarioService';
import { realTimeDataService } from '../../services/RealTimeDataService';

interface TriggerConfig {
  enabled: boolean;
  triggerType: 'manual' | 'timer' | 'metric' | 'sequence';
  delay: number; // seconds
  metricThreshold?: {
    metric: string;
    operator: '>' | '<' | '=' | '>=';
    value: number;
  };
  autoAdvance: boolean;
  loopMode: boolean;
}

interface ScenarioTriggerSystemProps {
  compact?: boolean;
}

const ScenarioTriggerSystem: React.FC<ScenarioTriggerSystemProps> = ({
  compact = false
}) => {
  const { 
    isPresenterMode, 
    scenarios, 
    currentScenario,
    globalControls,
    selectScenario,
    playAll,
    pauseAll,
    stopAll
  } = usePresenterMode();
  
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({
    enabled: false,
    triggerType: 'timer',
    delay: 30,
    autoAdvance: true,
    loopMode: false
  });
  
  const [automationStatus, setAutomationStatus] = useState<{
    isRunning: boolean;
    currentScenarioIndex: number;
    nextTriggerIn: number;
    totalCycles: number;
  }>({
    isRunning: false,
    currentScenarioIndex: 0,
    nextTriggerIn: 0,
    totalCycles: 0
  });

  // Automation timer
  useEffect(() => {
    if (!triggerConfig.enabled || !automationStatus.isRunning) return;

    const timer = setInterval(() => {
      setAutomationStatus(prev => {
        if (prev.nextTriggerIn <= 1) {
          // Trigger next scenario
          triggerNextScenario();
          return {
            ...prev,
            nextTriggerIn: triggerConfig.delay,
            currentScenarioIndex: (prev.currentScenarioIndex + 1) % scenarios.length
          };
        } else {
          return {
            ...prev,
            nextTriggerIn: prev.nextTriggerIn - 1
          };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [triggerConfig.enabled, automationStatus.isRunning, triggerConfig.delay, scenarios.length]);

  const triggerNextScenario = () => {
    const nextIndex = (automationStatus.currentScenarioIndex + 1) % scenarios.length;
    const nextScenario = scenarios[nextIndex];
    
    if (nextScenario) {
      // Stop current scenario
      stopAll();
      
      // Wait a moment then start next scenario
      setTimeout(() => {
        selectScenario(nextScenario.id);
        playAll();
      }, 2000);
      
      setAutomationStatus(prev => ({
        ...prev,
        currentScenarioIndex: nextIndex,
        totalCycles: prev.totalCycles + (nextIndex === 0 ? 1 : 0)
      }));
    }
  };

  const startAutomation = () => {
    setAutomationStatus(prev => ({
      ...prev,
      isRunning: true,
      nextTriggerIn: triggerConfig.delay,
      currentScenarioIndex: scenarios.findIndex(s => s.id === currentScenario) || 0
    }));
    
    // Start first scenario if none is running
    if (!globalControls.isPlaying && currentScenario) {
      playAll();
    }
  };

  const stopAutomation = () => {
    setAutomationStatus(prev => ({
      ...prev,
      isRunning: false,
      nextTriggerIn: 0
    }));
  };

  const resetAutomation = () => {
    stopAutomation();
    stopAll();
    setAutomationStatus(prev => ({
      ...prev,
      currentScenarioIndex: 0,
      totalCycles: 0
    }));
  };

  const triggerTypeOptions = [
    { value: 'manual', label: 'Manual Control' },
    { value: 'timer', label: 'Timer Based' },
    { value: 'metric', label: 'Metric Threshold' },
    { value: 'sequence', label: 'Sequential Flow' }
  ];

  if (compact) {
    return (
      <Card shadow="sm" padding="sm" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBolt size={16} color="var(--mantine-color-blue-6)" />
            <Text size="sm" fw={500}>Auto Demo</Text>
            {automationStatus.isRunning && (
              <Badge color="green" size="sm">
                Running
              </Badge>
            )}
          </Group>
          
          <Group gap="xs">
            <Switch
              checked={triggerConfig.enabled}
              onChange={(event) => setTriggerConfig(prev => ({ 
                ...prev, 
                enabled: event.currentTarget.checked 
              }))}
              size="sm"
            />
            <ActionIcon
              size="sm"
              variant="light"
              color={automationStatus.isRunning ? "red" : "green"}
              onClick={automationStatus.isRunning ? stopAutomation : startAutomation}
              disabled={!triggerConfig.enabled}
            >
              {automationStatus.isRunning ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
            </ActionIcon>
          </Group>
        </Group>
      </Card>
    );
  }

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="md">
            <IconRocket size={24} color="var(--mantine-color-blue-6)" />
            <Stack gap="xs">
              <Text size="lg" fw={600} c="cg-navy.6">
                Scenario Automation
              </Text>
              <Text size="sm" c="dimmed">
                Automated demo flow with intelligent triggers
              </Text>
            </Stack>
          </Group>
          
          {automationStatus.isRunning && (
            <Badge color="green" size="lg" leftSection={<IconBolt size={16} />}>
              Automation Active
            </Badge>
          )}
        </Group>

        {/* Configuration */}
        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Trigger Type"
              value={triggerConfig.triggerType}
              onChange={(value) => setTriggerConfig(prev => ({ 
                ...prev, 
                triggerType: value as any 
              }))}
              data={triggerTypeOptions}
            />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <NumberInput
              label="Delay Between Scenarios (seconds)"
              value={triggerConfig.delay}
              onChange={(value) => setTriggerConfig(prev => ({ 
                ...prev, 
                delay: Number(value) || 30 
              }))}
              min={10}
              max={300}
              step={5}
            />
          </Grid.Col>
        </Grid>

        {/* Advanced Options */}
        <Stack gap="sm">
          <Text size="md" fw={500} c="cg-navy.6">Options</Text>
          
          <Group gap="md">
            <Switch
              label="Auto Advance Steps"
              checked={triggerConfig.autoAdvance}
              onChange={(event) => setTriggerConfig(prev => ({ 
                ...prev, 
                autoAdvance: event.currentTarget.checked 
              }))}
            />
            
            <Switch
              label="Loop Mode"
              checked={triggerConfig.loopMode}
              onChange={(event) => setTriggerConfig(prev => ({ 
                ...prev, 
                loopMode: event.currentTarget.checked 
              }))}
            />
            
            <Switch
              label="Enable Automation"
              checked={triggerConfig.enabled}
              onChange={(event) => setTriggerConfig(prev => ({ 
                ...prev, 
                enabled: event.currentTarget.checked 
              }))}
            />
          </Group>
        </Stack>

        {/* Automation Status */}
        {triggerConfig.enabled && (
          <Paper p="md" radius="md" withBorder bg="blue.0">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text size="sm" fw={500} c="blue.8">Automation Status</Text>
                <Badge 
                  color={automationStatus.isRunning ? "green" : "gray"}
                  leftSection={automationStatus.isRunning ? <IconPlayerPlay size={12} /> : <IconPlayerPause size={12} />}
                >
                  {automationStatus.isRunning ? "Running" : "Stopped"}
                </Badge>
              </Group>
              
              {automationStatus.isRunning && (
                <Grid>
                  <Grid.Col span={4}>
                    <Stack gap="xs" align="center">
                      <Text size="xs" c="dimmed">Next Trigger</Text>
                      <Group gap="xs">
                        <IconClock size={14} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={500} c="blue.6">
                          {automationStatus.nextTriggerIn}s
                        </Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <Stack gap="xs" align="center">
                      <Text size="xs" c="dimmed">Current Scenario</Text>
                      <Badge color="blue" size="sm">
                        {automationStatus.currentScenarioIndex + 1} of {scenarios.length}
                      </Badge>
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={4}>
                    <Stack gap="xs" align="center">
                      <Text size="xs" c="dimmed">Cycles Complete</Text>
                      <Text size="sm" fw={500} c="blue.6">
                        {automationStatus.totalCycles}
                      </Text>
                    </Stack>
                  </Grid.Col>
                </Grid>
              )}
            </Stack>
          </Paper>
        )}

        {/* Controls */}
        <Group justify="center" gap="md">
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            variant="filled"
            color="green"
            onClick={startAutomation}
            disabled={!triggerConfig.enabled || automationStatus.isRunning}
          >
            Start Automation
          </Button>
          
          <Button
            leftSection={<IconPlayerPause size={16} />}
            variant="light"
            color="orange"
            onClick={stopAutomation}
            disabled={!automationStatus.isRunning}
          >
            Pause Automation
          </Button>
          
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="outline"
            color="red"
            onClick={resetAutomation}
          >
            Reset
          </Button>
        </Group>

        {/* Warning for Presenter Mode */}
        {isPresenterMode && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Presenter Mode Active"
            color="blue"
          >
            Automation will control scenario flow. Use keyboard shortcuts (Space, Esc, Arrow keys) for manual override.
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

export default ScenarioTriggerSystem;