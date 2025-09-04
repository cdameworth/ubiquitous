import React, { useEffect, useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  LoadingOverlay,
  Box,
  Title,
  Paper,
  Tabs,
  ActionIcon,
  Select,
} from '@mantine/core';
import {
  IconRefresh,
  IconUserCog,
  IconChartBar,
  IconTrendingUp,
  IconBriefcase,
  IconShield,
  IconTarget,
  IconRocket,
} from '@tabler/icons-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';
import MantineCEODashboard from '../../components/Visualizations/MantineCEODashboard';
import MantineCIODashboard from '../../components/Visualizations/MantineCIODashboard';
import DirectorDashboard from '../../components/Visualizations/DirectorDashboard';
import FiscalAnalysisCharts from '../../components/Visualizations/FiscalAnalysisCharts';
import CostSavingsTrends from '../../components/Visualizations/CostSavingsTrends';

interface ExecutiveMetrics {
  roi: number;
  costSavings: number;
  efficiency: number;
  riskReduction: number;
  strategicInitiatives: number;
  complianceScore: number;
}

const Executive: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [executiveData, setExecutiveData] = useState<ExecutiveMetrics | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('ceo');
  const [selectedAnalysis, setSelectedAnalysis] = useState<'dashboard' | 'fiscal' | 'savings'>('dashboard');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadExecutiveData();
  }, [selectedLevel]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setExecutiveData({
        roi: 23.2,
        costSavings: 2.3,
        efficiency: 87,
        riskReduction: 65,
        strategicInitiatives: 12,
        complianceScore: 94,
      });
      
      setLoading(false);
    } catch (error) {
      addNotification('error', 'Failed to load executive data');
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    switch (selectedLevel) {
      case 'ceo':
        return <MantineCEODashboard />;
      case 'cio':
        return <MantineCIODashboard />;
      case 'director':
        return <DirectorDashboard />;
      default:
        return <MantineCEODashboard />;
    }
  };

  const renderAnalysis = () => {
    switch (selectedAnalysis) {
      case 'dashboard':
        return renderDashboard();
      case 'fiscal':
        return <FiscalAnalysisCharts />;
      case 'savings':
        return <CostSavingsTrends />;
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Text ta="center" mt="xl" size="lg" c="dimmed">
          Loading executive reporting suite...
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header with Executive Metrics Summary */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            Executive Reporting Suite
          </Title>
          <Text size="lg" c="dimmed">
            Comprehensive multi-level business metrics, ROI analysis, and strategic insights
          </Text>
        </Stack>
        
        <Group gap="sm">
          <ActionIcon variant="outline" color="gray">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Executive Metrics Summary */}
      {executiveData && (
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="lg" radius="md" withBorder bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
              <Stack gap="sm" align="center">
                <IconTarget size={32} color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={700} c="blue.8">
                  {executiveData.roi}%
                </Text>
                <Text size="sm" c="blue.7" ta="center">
                  Annual ROI
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="lg" radius="md" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-3)' }}>
              <Stack gap="sm" align="center">
                <IconTrendingUp size={32} color="var(--mantine-color-green-6)" />
                <Text size="xl" fw={700} c="green.8">
                  ${executiveData.costSavings}M
                </Text>
                <Text size="sm" c="green.7" ta="center">
                  Cost Savings
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="lg" radius="md" withBorder bg="violet.0" style={{ borderColor: 'var(--mantine-color-violet-3)' }}>
              <Stack gap="sm" align="center">
                <IconRocket size={32} color="var(--mantine-color-violet-6)" />
                <Text size="xl" fw={700} c="violet.8">
                  {executiveData.efficiency}%
                </Text>
                <Text size="sm" c="violet.7" ta="center">
                  Efficiency
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="lg" radius="md" withBorder bg="orange.0" style={{ borderColor: 'var(--mantine-color-orange-3)' }}>
              <Stack gap="sm" align="center">
                <IconShield size={32} color="var(--mantine-color-orange-6)" />
                <Text size="xl" fw={700} c="orange.8">
                  {executiveData.riskReduction}%
                </Text>
                <Text size="sm" c="orange.7" ta="center">
                  Risk Reduction
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {/* Executive Analysis Tabs */}
      <Tabs value={selectedAnalysis} onChange={(value) => setSelectedAnalysis(value as any)} color="cg-navy">
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<IconUserCog size={16} />}>
            Executive Dashboards
          </Tabs.Tab>
          <Tabs.Tab value="fiscal" leftSection={<IconChartBar size={16} />}>
            Fiscal Period Analysis
          </Tabs.Tab>
          <Tabs.Tab value="savings" leftSection={<IconTrendingUp size={16} />}>
            Cost Savings Trends
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dashboard" pt="lg">
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Executive View Selection</Title>
              <Select
                value={selectedLevel}
                onChange={(value) => setSelectedLevel(value || 'ceo')}
                data={[
                  { value: 'ceo', label: 'CEO Executive View' },
                  { value: 'cio', label: 'CIO Technical View' },
                  { value: 'director', label: 'Director Operations View' }
                ]}
                w={200}
              />
            </Group>
            
            {renderDashboard()}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="fiscal" pt="lg">
          <FiscalAnalysisCharts />
        </Tabs.Panel>

        <Tabs.Panel value="savings" pt="lg">
          <CostSavingsTrends />
        </Tabs.Panel>
      </Tabs>

      {/* Key Business Insights */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="lg">Key Business Insights</Title>
        
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Paper p="md" radius="md" withBorder bg="blue.0">
              <Group gap="sm">
                <IconRocket size={24} color="var(--mantine-color-blue-6)" />
                <Stack gap={2}>
                  <Text size="md" fw={600} c="blue.8">
                    Infrastructure Modernization
                  </Text>
                  <Text size="sm" c="blue.7">
                    40% reduction in operational costs through cloud migration and automation initiatives
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Paper p="md" radius="md" withBorder bg="green.0">
              <Group gap="sm">
                <IconTarget size={24} color="var(--mantine-color-green-6)" />
                <Stack gap={2}>
                  <Text size="md" fw={600} c="green.8">
                    Process Optimization
                  </Text>
                  <Text size="sm" c="green.7">
                    60% faster incident resolution with improved monitoring and automated response systems
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Paper p="md" radius="md" withBorder bg="violet.0">
              <Group gap="sm">
                <IconTrendingUp size={24} color="var(--mantine-color-violet-6)" />
                <Stack gap={2}>
                  <Text size="md" fw={600} c="violet.8">
                    Deployment Velocity
                  </Text>
                  <Text size="sm" c="violet.7">
                    80% improvement in deployment frequency enabling faster time-to-market
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Paper p="md" radius="md" withBorder bg="orange.0">
              <Group gap="sm">
                <IconShield size={24} color="var(--mantine-color-orange-6)" />
                <Stack gap={2}>
                  <Text size="md" fw={600} c="orange.8">
                    Security Enhancement
                  </Text>
                  <Text size="sm" c="orange.7">
                    95% reduction in security vulnerabilities through comprehensive audit and remediation
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Strategic Initiatives Progress */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Title order={3} c="cg-navy.6" mb="lg">Strategic Initiatives Progress</Title>
        
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder bg="teal.0">
              <Stack gap="sm" align="center">
                <IconBriefcase size={32} color="var(--mantine-color-teal-6)" />
                <Text size="xl" fw={700} c="teal.8">
                  {executiveData?.strategicInitiatives || 0}
                </Text>
                <Text size="sm" c="teal.7" ta="center">
                  Active Initiatives
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder bg="green.0">
              <Stack gap="sm" align="center">
                <IconShield size={32} color="var(--mantine-color-green-6)" />
                <Text size="xl" fw={700} c="green.8">
                  {executiveData?.complianceScore || 0}%
                </Text>
                <Text size="sm" c="green.7" ta="center">
                  Compliance Score
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Paper p="md" radius="md" withBorder bg="blue.0">
              <Stack gap="sm" align="center">
                <IconTarget size={32} color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={700} c="blue.8">
                  Q4 2024
                </Text>
                <Text size="sm" c="blue.7" ta="center">
                  Target Completion
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Card>
    </Stack>
  );
};

export default Executive;