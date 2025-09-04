import React, { useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Progress,
  ActionIcon,
  Badge,
  Button,
  Divider,
  Timeline,
  NumberFormatter,
  Paper,
  Grid,
  Tooltip,
  Collapse
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChevronUp,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconTarget,
  IconRocket,
  IconShield,
  IconCloud,
  IconTrendingUp,
  IconCoin
} from '@tabler/icons-react';
import { usePresenterMode } from '../../contexts/PresenterModeContext';

interface ScenarioNavigatorProps {
  position?: 'left' | 'right';
  collapsed?: boolean;
}

const ScenarioNavigator: React.FC<ScenarioNavigatorProps> = ({ 
  position = 'left',
  collapsed = false 
}) => {
  const {
    isPresenterMode,
    currentScenario,
    scenarios,
    globalControls,
    selectScenario,
    playAll,
    pauseAll,
    stopAll,
    jumpToStep,
    jumpToScenario,
    getScenarioProgress
  } = usePresenterMode();

  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (!isPresenterMode) return null;

  const currentScenarioData = scenarios.find(s => s.id === currentScenario);

  const getScenarioIcon = (scenarioId: string) => {
    const icons = {
      'trading-crisis': <IconTarget size={16} />,
      'cost-spiral': <IconCloud size={16} />,
      'security-breach': <IconShield size={16} />,
      'executive-value': <IconRocket size={16} />
    };
    return icons[scenarioId as keyof typeof icons] || <IconTarget size={16} />;
  };

  const getScenarioValue = (scenarioId: string): number => {
    const values = {
      'trading-crisis': 2000000,
      'cost-spiral': 9360000,
      'security-breach': 6080000,
      'executive-value': 41600000
    };
    return values[scenarioId as keyof typeof values] || 0;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      shadow="lg"
      padding="md"
      radius="md"
      withBorder
      style={{
        position: 'fixed',
        [position]: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        width: isExpanded ? 320 : 60,
        zIndex: 100,
        backgroundColor: 'rgba(0, 31, 63, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'width 0.3s ease'
      }}
    >
      <Stack gap="md">
        {/* Collapse/Expand Toggle */}
        <Group justify="space-between" align="center">
          {isExpanded && (
            <Text c="white" fw={600} size="sm">Navigation</Text>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 
              (position === 'left' ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />) :
              (position === 'left' ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />)
            }
          </ActionIcon>
        </Group>

        <Collapse in={isExpanded}>
          {/* Current Scenario Status */}
          {currentScenarioData && (
            <Paper p="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    {getScenarioIcon(currentScenarioData.id)}
                    <Text c="white" size="sm" fw={500}>
                      {currentScenarioData.name}
                    </Text>
                  </Group>
                  <Badge
                    color={currentScenarioData.isRunning ? (currentScenarioData.isPaused ? 'orange' : 'green') : 'gray'}
                    size="sm"
                  >
                    {currentScenarioData.isRunning ? (currentScenarioData.isPaused ? 'Paused' : 'Live') : 'Ready'}
                  </Badge>
                </Group>
                
                <Progress
                  value={((currentScenarioData.currentStep + 1) / currentScenarioData.totalSteps) * 100}
                  color="blue"
                  size="sm"
                  animated={currentScenarioData.isRunning && !currentScenarioData.isPaused}
                />
                
                <Group justify="space-between">
                  <Text c="gray.3" size="xs">
                    Step {currentScenarioData.currentStep + 1} of {currentScenarioData.totalSteps}
                  </Text>
                  <Text c="gray.3" size="xs">
                    {formatTime(currentScenarioData.elapsedTime)}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Quick Controls */}
          <Group justify="center" gap="xs">
            <Tooltip label="Play/Resume">
              <ActionIcon
                size="lg"
                variant="filled"
                color={globalControls.isPlaying ? (globalControls.isPaused ? 'orange' : 'red') : 'green'}
                onClick={globalControls.isPlaying ? (globalControls.isPaused ? playAll : pauseAll) : playAll}
              >
                {globalControls.isPlaying ? (globalControls.isPaused ? <IconPlayerPlay size={20} /> : <IconPlayerPause size={20} />) : <IconPlayerPlay size={20} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Stop">
              <ActionIcon
                size="lg"
                variant="light"
                color="red"
                onClick={stopAll}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider color="gray.6" />

          {/* Scenario List */}
          <Stack gap="xs">
            <Text c="white" size="sm" fw={500}>Demo Scenarios</Text>
            
            {scenarios.map((scenario, index) => (
              <Paper
                key={scenario.id}
                p="xs"
                style={{
                  backgroundColor: scenario.id === currentScenario ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  border: scenario.id === currentScenario ? '1px solid #3b82f6' : '1px solid transparent'
                }}
                onClick={() => selectScenario(scenario.id)}
              >
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="light"
                      color={scenario.isRunning ? 'green' : 'gray'}
                    >
                      {getScenarioIcon(scenario.id)}
                    </ActionIcon>
                    <Stack gap={1}>
                      <Text c="white" size="xs" fw={500}>
                        {scenario.name}
                      </Text>
                      <Text c="gray.4" size="xs">
                        {formatTime(scenario.duration)} • {scenario.totalSteps} steps
                      </Text>
                    </Stack>
                  </Group>
                  
                  <Stack gap={1} align="end">
                    <NumberFormatter
                      value={getScenarioValue(scenario.id)}
                      prefix="$"
                      thousandSeparator=","
                      suffix="M"
                      decimalScale={1}
                      style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.75rem' }}
                    />
                    <Progress
                      value={((scenario.currentStep + 1) / scenario.totalSteps) * 100}
                      color={scenario.isRunning ? 'blue' : 'gray'}
                      size="xs"
                      w={40}
                    />
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>

          <Divider color="gray.6" />

          {/* Step Navigation for Current Scenario */}
          {currentScenarioData && (
            <Stack gap="xs">
              <Text c="white" size="sm" fw={500}>Step Navigation</Text>
              
              <Group gap="xs" justify="center">
                {Array.from({ length: currentScenarioData.totalSteps }, (_, index) => (
                  <Tooltip key={index} label={`Step ${index + 1}`}>
                    <ActionIcon
                      size="sm"
                      variant={index === currentScenarioData.currentStep ? 'filled' : index < currentScenarioData.currentStep ? 'light' : 'outline'}
                      color={index === currentScenarioData.currentStep ? 'blue' : index < currentScenarioData.currentStep ? 'green' : 'gray'}
                      onClick={() => jumpToStep(index)}
                      disabled={!currentScenarioData.isRunning}
                    >
                      {index + 1}
                    </ActionIcon>
                  </Tooltip>
                ))}
              </Group>
            </Stack>
          )}

          {/* Overall Progress */}
          <Paper p="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text c="white" size="sm" fw={500}>Presentation Progress</Text>
                <Text c="gray.3" size="xs">{Math.round(getScenarioProgress())}%</Text>
              </Group>
              
              <Progress
                value={getScenarioProgress()}
                color="blue"
                size="md"
                radius="md"
              />
              
              <Group justify="space-between">
                <Text c="gray.4" size="xs">
                  {scenarios.filter(s => s.currentStep > 0).length} of {scenarios.length} scenarios started
                </Text>
                <Text c="gray.4" size="xs">
                  Speed: {globalControls.speed}x
                </Text>
              </Group>
            </Stack>
          </Paper>
        </Collapse>

        {/* Always visible when collapsed */}
        {!isExpanded && (
          <Stack gap="xs" align="center">
            <ActionIcon
              size="lg"
              variant="filled"
              color={globalControls.isPlaying ? (globalControls.isPaused ? 'orange' : 'red') : 'green'}
              onClick={globalControls.isPlaying ? (globalControls.isPaused ? playAll : pauseAll) : playAll}
            >
              {globalControls.isPlaying ? (globalControls.isPaused ? <IconPlayerPlay size={20} /> : <IconPlayerPause size={20} />) : <IconPlayerPlay size={20} />}
            </ActionIcon>
            
            <Progress
              value={getScenarioProgress()}
              color="blue"
              size="sm"
              style={{ width: '100%', transform: 'rotate(90deg)', transformOrigin: 'center' }}
            />
            
            <Text c="gray.3" size="xs" style={{ transform: 'rotate(90deg)' }}>
              {Math.round(getScenarioProgress())}%
            </Text>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default ScenarioNavigator;