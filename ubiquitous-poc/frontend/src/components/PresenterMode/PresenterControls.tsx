import React, { useState } from 'react';
import {
  Affix,
  Card,
  Group,
  Button,
  Text,
  Progress,
  Badge,
  ActionIcon,
  Select,
  Switch,
  Slider,
  Stack,
  Tooltip,
  Kbd,
  Paper,
  Divider,
  NumberFormatter,
  Collapse,
  Box
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
  IconNotes,
  IconSettings,
  IconKeyboard,
  IconPresentation,
  IconX,
  IconClock,
  IconTarget,
  IconRocket
} from '@tabler/icons-react';
import { usePresenterMode } from '../../contexts/PresenterModeContext';

interface PresenterControlsProps {
  visible?: boolean;
  onClose?: () => void;
}

const PresenterControls: React.FC<PresenterControlsProps> = ({ 
  visible = true, 
  onClose 
}) => {
  const {
    isPresenterMode,
    currentScenario,
    scenarios,
    globalControls,
    
    deactivatePresenterMode,
    selectScenario,
    
    playAll,
    pauseAll,
    stopAll,
    nextScenario,
    previousScenario,
    
    setSpeed,
    setAutoAdvance,
    
    toggleNotes,
    toggleFullscreen,
    
    jumpToStep,
    getScenarioProgress
  } = usePresenterMode();

  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  if (!isPresenterMode || !visible) return null;

  const currentScenarioData = scenarios.find(s => s.id === currentScenario);
  const overallProgress = getScenarioProgress();

  const scenarioOptions = scenarios.map(scenario => ({
    value: scenario.id,
    label: scenario.name
  }));

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Affix position={{ bottom: 20, right: 20 }} zIndex={1000}>
      <Card
        shadow="xl"
        padding="md"
        radius="md"
        withBorder
        style={{
          minWidth: 400,
          maxWidth: 500,
          backgroundColor: 'rgba(0, 31, 63, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconPresentation size={20} color="white" />
              <Text c="white" fw={600} size="sm">Presenter Mode</Text>
            </Group>
            <Group gap="xs">
              <Tooltip label="Settings">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <IconSettings size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Keyboard Shortcuts">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                >
                  <IconKeyboard size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Exit Presenter Mode">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={deactivatePresenterMode}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Current Scenario Info */}
          {currentScenarioData && (
            <Paper p="xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Text c="white" size="sm" fw={500}>
                    {currentScenarioData.name}
                  </Text>
                  <Group gap="md">
                    <Text c="gray.3" size="xs">
                      <IconClock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {formatTime(currentScenarioData.elapsedTime)} / {formatTime(currentScenarioData.duration)}
                    </Text>
                    <Text c="gray.3" size="xs">
                      Step {currentScenarioData.currentStep + 1} of {currentScenarioData.totalSteps}
                    </Text>
                  </Group>
                </Stack>
                
                <Badge
                  color={currentScenarioData.isRunning ? (currentScenarioData.isPaused ? 'orange' : 'green') : 'gray'}
                  variant="light"
                >
                  {currentScenarioData.isRunning ? (currentScenarioData.isPaused ? 'Paused' : 'Running') : 'Stopped'}
                </Badge>
              </Group>
              
              <Progress
                value={((currentScenarioData.currentStep + 1) / currentScenarioData.totalSteps) * 100}
                color="blue"
                size="sm"
                mt="xs"
                animated={currentScenarioData.isRunning && !currentScenarioData.isPaused}
              />
            </Paper>
          )}

          {/* Main Controls */}
          <Group justify="center" gap="xs">
            <Tooltip label="Previous Scenario (← or P)">
              <ActionIcon
                size="lg"
                variant="light"
                color="gray"
                onClick={previousScenario}
                disabled={!currentScenario || scenarios.findIndex(s => s.id === currentScenario) === 0}
              >
                <IconChevronLeft size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={globalControls.isPlaying ? (globalControls.isPaused ? "Resume (Space)" : "Pause (Space)") : "Play (Space)"}>
              <ActionIcon
                size="xl"
                variant="filled"
                color={globalControls.isPlaying ? (globalControls.isPaused ? 'orange' : 'red') : 'green'}
                onClick={globalControls.isPlaying ? (globalControls.isPaused ? playAll : pauseAll) : playAll}
              >
                {globalControls.isPlaying ? (globalControls.isPaused ? <IconPlayerPlay size={24} /> : <IconPlayerPause size={24} />) : <IconPlayerPlay size={24} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Stop (Esc)">
              <ActionIcon
                size="lg"
                variant="light"
                color="red"
                onClick={stopAll}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Next Scenario (→ or N)">
              <ActionIcon
                size="lg"
                variant="light"
                color="gray"
                onClick={nextScenario}
                disabled={!currentScenario || scenarios.findIndex(s => s.id === currentScenario) === scenarios.length - 1}
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Scenario Selection */}
          <Select
            label={<Text c="white" size="sm">Active Scenario</Text>}
            placeholder="Select scenario"
            data={scenarioOptions}
            value={currentScenario}
            onChange={(value) => value && selectScenario(value)}
            styles={{
              input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' },
              label: { color: 'white' }
            }}
          />

          {/* Overall Progress */}
          <Stack gap="xs">
            <Group justify="space-between">
              <Text c="white" size="sm">Overall Progress</Text>
              <Text c="gray.3" size="xs">{overallProgress}%</Text>
            </Group>
            <Progress
              value={overallProgress}
              color="blue"
              size="md"
              radius="md"
            />
          </Stack>

          {/* Settings Panel */}
          <Collapse in={showSettings}>
            <Stack gap="sm">
              <Divider label="Settings" labelPosition="center" color="gray.6" />
              
              <Group justify="space-between">
                <Text c="white" size="sm">Speed</Text>
                <Group gap="xs" w={150}>
                  <Text c="gray.3" size="xs">0.25x</Text>
                  <Slider
                    value={globalControls.speed}
                    onChange={setSpeed}
                    min={0.25}
                    max={3.0}
                    step={0.25}
                    marks={[
                      { value: 0.5, label: '0.5x' },
                      { value: 1.0, label: '1x' },
                      { value: 2.0, label: '2x' }
                    ]}
                    color="blue"
                    size="sm"
                  />
                  <Text c="gray.3" size="xs">3x</Text>
                </Group>
              </Group>

              <Group justify="space-between">
                <Text c="white" size="sm">Auto-advance scenarios</Text>
                <Switch
                  checked={globalControls.autoAdvance}
                  onChange={(event) => setAutoAdvance(event.currentTarget.checked)}
                  color="blue"
                />
              </Group>

              <Group justify="space-between">
                <Text c="white" size="sm">Show presenter notes</Text>
                <Switch
                  checked={globalControls.showNotes}
                  onChange={toggleNotes}
                  color="blue"
                />
              </Group>

              <Group justify="space-between">
                <Text c="white" size="sm">Fullscreen mode</Text>
                <ActionIcon
                  variant="light"
                  color="blue"
                  onClick={toggleFullscreen}
                >
                  {globalControls.fullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                </ActionIcon>
              </Group>
            </Stack>
          </Collapse>

          {/* Keyboard Shortcuts Help */}
          <Collapse in={showKeyboardHelp}>
            <Stack gap="sm">
              <Divider label="Keyboard Shortcuts" labelPosition="center" color="gray.6" />
              
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Play/Pause</Text>
                <Kbd size="xs">Space</Kbd>
              </Group>
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Stop</Text>
                <Kbd size="xs">Esc</Kbd>
              </Group>
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Next/Previous</Text>
                <Group gap="xs">
                  <Kbd size="xs">←</Kbd>
                  <Kbd size="xs">→</Kbd>
                </Group>
              </Group>
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Select Scenario</Text>
                <Group gap="xs">
                  <Kbd size="xs">1</Kbd>
                  <Kbd size="xs">2</Kbd>
                  <Kbd size="xs">3</Kbd>
                  <Kbd size="xs">4</Kbd>
                </Group>
              </Group>
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Speed Control</Text>
                <Group gap="xs">
                  <Kbd size="xs">+</Kbd>
                  <Kbd size="xs">-</Kbd>
                </Group>
              </Group>
              <Group justify="space-between">
                <Text c="gray.3" size="xs">Fullscreen</Text>
                <Kbd size="xs">F</Kbd>
              </Group>
            </Stack>
          </Collapse>

          {/* Quick Scenario Navigation */}
          <Stack gap="xs">
            <Text c="white" size="sm">Quick Navigation</Text>
            <Group gap="xs" justify="center">
              {scenarios.map((scenario, index) => (
                <Tooltip key={scenario.id} label={scenario.name}>
                  <ActionIcon
                    size="lg"
                    variant={scenario.id === currentScenario ? 'filled' : 'light'}
                    color={scenario.id === currentScenario ? 'blue' : scenario.isRunning ? 'green' : 'gray'}
                    onClick={() => selectScenario(scenario.id)}
                  >
                    {index === 0 && <IconTarget size={16} />}
                    {index === 1 && <IconClock size={16} />}
                    {index === 2 && <IconTarget size={16} />}
                    {index === 3 && <IconRocket size={16} />}
                  </ActionIcon>
                </Tooltip>
              ))}
            </Group>
          </Stack>

          {/* Presentation Stats */}
          <Paper p="xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Group justify="space-between" align="center">
              <Stack gap={2}>
                <Text c="gray.3" size="xs">Total Value Demonstrated</Text>
                <NumberFormatter
                  value={23200000}
                  prefix="$"
                  thousandSeparator=","
                  suffix="M"
                  decimalScale={1}
                  style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}
                />
              </Stack>
              <Stack gap={2}>
                <Text c="gray.3" size="xs">Scenarios</Text>
                <Text c="white" size="sm" fw={500} ta="center">
                  {scenarios.filter(s => s.isRunning || s.currentStep > 0).length} / {scenarios.length}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text c="gray.3" size="xs">Speed</Text>
                <Text c="white" size="sm" fw={500} ta="center">
                  {globalControls.speed}x
                </Text>
              </Stack>
            </Group>
          </Paper>
        </Stack>
      </Card>
    </Affix>
  );
};

export default PresenterControls;