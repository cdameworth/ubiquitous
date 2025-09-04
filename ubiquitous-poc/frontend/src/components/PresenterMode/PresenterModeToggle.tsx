import React from 'react';
import {
  Button,
  Group,
  Text,
  Badge,
  Stack,
  Card,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconPresentation,
  IconPlayerPlay,
  IconSettings,
  IconMaximize,
  IconRocket
} from '@tabler/icons-react';
import { usePresenterMode } from '../../contexts/PresenterModeContext';

interface PresenterModeToggleProps {
  compact?: boolean;
  showStats?: boolean;
}

const PresenterModeToggle: React.FC<PresenterModeToggleProps> = ({ 
  compact = false,
  showStats = true 
}) => {
  const {
    isPresenterMode,
    scenarios,
    globalControls,
    activatePresenterMode,
    deactivatePresenterMode,
    getScenarioProgress
  } = usePresenterMode();

  const readyScenarios = scenarios.length;
  const overallProgress = getScenarioProgress();

  if (compact) {
    return (
      <Tooltip label={isPresenterMode ? "Exit Presenter Mode" : "Enter Presenter Mode"}>
        <ActionIcon
          size="lg"
          variant={isPresenterMode ? "filled" : "light"}
          color={isPresenterMode ? "blue" : "cg-navy"}
          onClick={isPresenterMode ? deactivatePresenterMode : activatePresenterMode}
        >
          <IconPresentation size={20} />
        </ActionIcon>
      </Tooltip>
    );
  }

  if (isPresenterMode) {
    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ backgroundColor: '#f0f8ff' }}>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <IconPresentation size={24} color="#001f3f" />
            <Stack gap={2}>
              <Text fw={600} c="cg-navy">Presenter Mode Active</Text>
              <Group gap="md">
                <Text size="xs" c="dimmed">
                  Progress: {overallProgress}%
                </Text>
                <Text size="xs" c="dimmed">
                  Speed: {globalControls.speed}x
                </Text>
                {globalControls.autoAdvance && (
                  <Badge size="xs" color="blue">Auto</Badge>
                )}
              </Group>
            </Stack>
          </Group>
          
          <Group gap="xs">
            <Button
              size="sm"
              variant="outline"
              color="red"
              onClick={deactivatePresenterMode}
            >
              Exit Presenter Mode
            </Button>
          </Group>
        </Group>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Group gap="md">
              <IconPresentation size={32} color="#001f3f" />
              <Stack gap={2}>
                <Text size="lg" fw={600} c="cg-navy">
                  Presentation Mode
                </Text>
                <Text size="sm" c="dimmed">
                  Professional demo controls with full-screen experience
                </Text>
              </Stack>
            </Group>
          </Stack>
          
          <Button
            size="lg"
            leftSection={<IconPlayerPlay size={20} />}
            rightSection={<IconMaximize size={16} />}
            variant="filled"
            color="cg-navy"
            onClick={activatePresenterMode}
          >
            Start Presentation
          </Button>
        </Group>

        {showStats && (
          <>
            <Stack gap="sm">
              <Text size="sm" fw={500} c="cg-navy">Ready for Presentation</Text>
              
              <Group gap="md">
                <Badge color="green" size="lg" leftSection={<IconRocket size={14} />}>
                  {readyScenarios} Scenarios Ready
                </Badge>
                <Badge color="blue" size="lg">
                  $23.2M Value Demo
                </Badge>
                <Badge color="orange" size="lg">
                  16-min Total Runtime
                </Badge>
              </Group>

              <Group gap="lg" mt="xs">
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">Trading Crisis</Text>
                  <Text size="sm" fw={500} c="cg-navy">5 min</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">Cost Spiral</Text>
                  <Text size="sm" fw={500} c="cg-navy">4 min</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">Security Breach</Text>
                  <Text size="sm" fw={500} c="cg-navy">4.5 min</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">Executive Value</Text>
                  <Text size="sm" fw={500} c="cg-navy">3 min</Text>
                </Stack>
              </Group>
            </Stack>

            <Group gap="md" justify="center" mt="md">
              <Group gap="xs">
                <IconSettings size={16} color="#6b7280" />
                <Text size="xs" c="dimmed">Keyboard shortcuts available</Text>
              </Group>
              <Group gap="xs">
                <IconMaximize size={16} color="#6b7280" />
                <Text size="xs" c="dimmed">Auto-fullscreen mode</Text>
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
};

export default PresenterModeToggle;