import React from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Progress,
  Grid,
  RingProgress,
  ActionIcon,
  Tooltip,
  Paper,
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconCpu,
  IconDatabase,
  IconServer,
  IconNetworkOff,
} from '@tabler/icons-react';

interface NetworkNode {
  id: string;
  name: string;
  type: 'cluster' | 'service' | 'database' | 'gateway';
  status: 'healthy' | 'warning' | 'critical';
  cluster?: string;
  metrics?: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

interface NetworkLink {
  source: string;
  target: string;
  latency: number;
  bandwidth: number;
  packetLoss: number;
  type?: 'sync' | 'async';
}

interface MantineNetworkMetricsProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeSelect: (node: NetworkNode) => void;
  selectedCluster?: string;
  className?: string;
}

const MantineNetworkMetrics: React.FC<MantineNetworkMetricsProps> = ({
  nodes,
  links,
  onNodeSelect,
  selectedCluster,
  className = ''
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'cluster': return <IconServer size={20} />;
      case 'database': return <IconDatabase size={20} />;
      case 'gateway': return <IconNetworkOff size={20} />;
      default: return <IconCpu size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cluster': return 'blue';
      case 'service': return 'cyan';
      case 'database': return 'orange';
      case 'gateway': return 'violet';
      default: return 'gray';
    }
  };

  const filteredNodes = selectedCluster 
    ? nodes.filter(n => n.cluster === selectedCluster || n.type === 'gateway')
    : nodes;

  // Calculate network health metrics
  const healthyNodes = filteredNodes.filter(n => n.status === 'healthy').length;
  const totalNodes = filteredNodes.length;
  const networkHealthPercentage = totalNodes > 0 ? (healthyNodes / totalNodes) * 100 : 0;

  // Calculate average latency
  const avgLatency = links.length > 0 
    ? links.reduce((sum, link) => sum + link.latency, 0) / links.length 
    : 0;

  // Calculate total bandwidth utilization
  const totalBandwidth = links.reduce((sum, link) => sum + link.bandwidth, 0);
  const avgPacketLoss = links.length > 0
    ? links.reduce((sum, link) => sum + link.packetLoss, 0) / links.length
    : 0;

  return (
    <Card className={className} withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="lg">
        {/* Header with Network Health Overview */}
        <Group justify="space-between">
          <Stack gap={4}>
            <Text size="lg" fw={600} c="cg-navy.6">
              Network Performance Metrics
            </Text>
            <Text size="sm" c="dimmed">
              {selectedCluster ? `Cluster: ${selectedCluster}` : 'All Clusters'} • {filteredNodes.length} nodes • {links.length} connections
            </Text>
          </Stack>
          
          <Group gap="md">
            <Stack gap={4} align="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Network Health
              </Text>
              <RingProgress
                sections={[
                  { value: networkHealthPercentage, color: networkHealthPercentage > 80 ? 'green' : networkHealthPercentage > 60 ? 'yellow' : 'red' }
                ]}
                label={
                  <Text c="dimmed" fw={700} ta="center" size="xs">
                    {networkHealthPercentage.toFixed(0)}%
                  </Text>
                }
                size={60}
              />
            </Stack>
            
            <Stack gap={4} align="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Avg Latency
              </Text>
              <Badge 
                color={avgLatency < 20 ? 'green' : avgLatency < 50 ? 'yellow' : 'red'}
                size="lg"
                leftSection={avgLatency < 20 ? <IconTrendingDown size={12} /> : <IconTrendingUp size={12} />}
              >
                {avgLatency.toFixed(1)}ms
              </Badge>
            </Stack>
          </Group>
        </Group>

        {/* Network Overview Metrics */}
        <Grid>
          <Grid.Col span={3}>
            <Paper p="md" radius="md" withBorder bg="blue.0">
              <Stack gap="xs" align="center">
                <IconServer size={24} color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={700} c="blue.8">
                  {totalBandwidth.toFixed(0)}
                </Text>
                <Text size="xs" c="blue.7" ta="center">
                  Total Bandwidth (Gbps)
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="md" radius="md" withBorder bg="orange.0">
              <Stack gap="xs" align="center">
                <IconNetworkOff size={24} color="var(--mantine-color-orange-6)" />
                <Text size="xl" fw={700} c="orange.8">
                  {(avgPacketLoss * 100).toFixed(2)}%
                </Text>
                <Text size="xs" c="orange.7" ta="center">
                  Avg Packet Loss
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="md" radius="md" withBorder bg="violet.0">
              <Stack gap="xs" align="center">
                <IconDatabase size={24} color="var(--mantine-color-violet-6)" />
                <Text size="xl" fw={700} c="violet.8">
                  {links.filter(l => l.type === 'sync').length}
                </Text>
                <Text size="xs" c="violet.7" ta="center">
                  Synchronous Connections
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={3}>
            <Paper p="md" radius="md" withBorder bg="teal.0">
              <Stack gap="xs" align="center">
                <IconCpu size={24} color="var(--mantine-color-teal-6)" />
                <Text size="xl" fw={700} c="teal.8">
                  {links.filter(l => l.type === 'async').length}
                </Text>
                <Text size="xs" c="teal.7" ta="center">
                  Asynchronous Connections
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Node Status Grid */}
        <Stack gap="md">
          <Text size="md" fw={500} c="cg-navy.6">
            Infrastructure Components
          </Text>
          
          <Grid>
            {filteredNodes.map((node) => (
              <Grid.Col key={node.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNodeSelect(node)}
                  bg={node.status === 'critical' ? 'red.0' : node.status === 'warning' ? 'yellow.0' : 'gray.0'}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        {getNodeIcon(node.type)}
                        <Text size="sm" fw={500} lineClamp={1}>
                          {node.name}
                        </Text>
                      </Group>
                      <Badge 
                        color={getStatusColor(node.status)} 
                        size="xs"
                      >
                        {node.status}
                      </Badge>
                    </Group>
                    
                    <Badge 
                      color={getTypeColor(node.type)} 
                      variant="light" 
                      size="xs"
                    >
                      {node.type.toUpperCase()}
                    </Badge>

                    {node.metrics && (
                      <Stack gap={4}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">CPU</Text>
                          <Text size="xs" fw={500}>{node.metrics.cpu}%</Text>
                        </Group>
                        <Progress
                          value={node.metrics.cpu}
                          color={node.metrics.cpu > 80 ? 'red' : node.metrics.cpu > 60 ? 'yellow' : 'green'}
                          size="xs"
                        />
                        
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">Memory</Text>
                          <Text size="xs" fw={500}>{node.metrics.memory}%</Text>
                        </Group>
                        <Progress
                          value={node.metrics.memory}
                          color={node.metrics.memory > 80 ? 'red' : node.metrics.memory > 60 ? 'yellow' : 'green'}
                          size="xs"
                        />

                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">Latency</Text>
                          <Badge 
                            color={node.metrics.latency < 20 ? 'green' : node.metrics.latency < 50 ? 'yellow' : 'red'}
                            size="xs"
                          >
                            {node.metrics.latency}ms
                          </Badge>
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Stack>
    </Card>
  );
};

export default MantineNetworkMetrics;