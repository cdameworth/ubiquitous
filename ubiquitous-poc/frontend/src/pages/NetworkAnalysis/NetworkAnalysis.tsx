import React, { useEffect, useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
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
  IconNetwork,
  IconHierarchy,
  IconActivityHeartbeat,
  IconClockHour4,
  IconServer,
  IconDatabase,
} from '@tabler/icons-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import MantineNetworkMetrics from '../../components/Visualizations/MantineNetworkMetrics';
import MantineLatencyAnalysis from '../../components/Visualizations/MantineLatencyAnalysis';
import NetworkTopology from '../../components/Visualizations/NetworkTopology';
import ClusterTopology from '../../components/Visualizations/ClusterTopology';
import ServiceDependencyMap from '../../components/Visualizations/ServiceDependencyMap';
import DrillDownPanel from '../../components/Visualizations/DrillDownPanel';
import api from '../../services/api';

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
  type: 'api_call' | 'database_query' | 'vpc_connection' | 'load_balance';
  requestRate: number;
}

interface ClusterNode {
  id: string;
  name: string;
  type: 'pod' | 'service' | 'deployment' | 'configmap';
  status: 'running' | 'pending' | 'failed' | 'warning';
  namespace: string;
  resources?: {
    cpu: { usage: number; limit: number };
    memory: { usage: number; limit: number };
  };
  replicas?: { ready: number; total: number };
}

interface ServiceDependency {
  id: string;
  source: string;
  target: string;
  type: 'sync' | 'async';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  latency: number;
  errorRate: number;
}

interface ServiceNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'external_api' | 'gateway';
  status: 'healthy' | 'degraded' | 'down';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  cluster?: string;
  metrics: {
    requests: number;
    errors: number;
    latency: number;
    uptime: number;
  };
}

interface LatencyDataPoint {
  timestamp: number;
  service: string;
  endpoint: string;
  latency: number;
  cluster: string;
}

interface DrillDownItem {
  id: string;
  name: string;
  type: 'cluster' | 'service' | 'database' | 'gateway' | 'pod' | 'container' | 'process';
  status: 'healthy' | 'warning' | 'critical';
  parent?: string;
  children?: string[];
  metrics?: {
    cpu: number;
    memory: number;
    latency: number;
    requests?: number;
    errors?: number;
    bandwidth?: number;
  };
  metadata?: {
    namespace?: string;
    version?: string;
    replicas?: number;
    uptime?: string;
    region?: string;
  };
}

const NetworkAnalysis: React.FC = () => {
  const { subscribeToEvent, unsubscribeFromEvent } = useWebSocket();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'topology' | 'metrics' | 'heatmap' | 'cluster' | 'dependencies'>('topology');
  
  // Network topology data
  const [topology, setTopology] = useState<{ nodes: NetworkNode[]; links: NetworkLink[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  
  // Cluster topology data
  const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('prod-trading-cluster');
  const [availableClusters, setAvailableClusters] = useState<Array<{value: string; label: string; region: string; service_count: number}>>([]);
  
  // Service dependency data
  const [serviceNodes, setServiceNodes] = useState<ServiceNode[]>([]);
  const [serviceDependencies, setServiceDependencies] = useState<ServiceDependency[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);
  
  // Latency heatmap data
  const [latencyData, setLatencyData] = useState<LatencyDataPoint[]>([]);
  const [heatmapTimeRange, setHeatmapTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  // Drill-down panel
  const [drillDownItem, setDrillDownItem] = useState<DrillDownItem | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  
  // Legacy protocol stats
  const [protocolStats, setProtocolStats] = useState<any[]>([]);

  // Load available clusters on component mount
  useEffect(() => {
    loadAvailableClusters();
  }, []);

  useEffect(() => {
    loadNetworkData();
    
    const handleTopologyUpdate = (data: any) => {
      setTopology(data);
    };

    const handleLatencyUpdate = (data: any) => {
      setLatencyData(data);
    };

    subscribeToEvent('topology_update', handleTopologyUpdate);
    subscribeToEvent('latency_update', handleLatencyUpdate);

    return () => {
      unsubscribeFromEvent('topology_update', handleTopologyUpdate);
      unsubscribeFromEvent('latency_update', handleLatencyUpdate);
    };
  }, [subscribeToEvent, unsubscribeFromEvent, selectedCluster, heatmapTimeRange, activeView]);

  // Generate cluster-specific protocol statistics when cluster changes
  useEffect(() => {
    const generateClusterProtocolStats = (cluster: string) => {
      const baseStats = {
        'prod-trading-cluster': [
          { protocol: 'HTTP/2', requests: 1250000, avgLatency: 12, errors: 0.02 },
          { protocol: 'gRPC', requests: 850000, avgLatency: 8, errors: 0.01 },
          { protocol: 'WebSocket', requests: 320000, avgLatency: 5, errors: 0.03 },
          { protocol: 'REST', requests: 2100000, avgLatency: 15, errors: 0.04 },
        ],
        'prod-risk-cluster': [
          { protocol: 'HTTP/2', requests: 980000, avgLatency: 18, errors: 0.015 },
          { protocol: 'gRPC', requests: 1200000, avgLatency: 6, errors: 0.008 },
          { protocol: 'WebSocket', requests: 150000, avgLatency: 7, errors: 0.025 },
          { protocol: 'REST', requests: 1850000, avgLatency: 22, errors: 0.035 },
        ],
        'prod-portfolio-cluster': [
          { protocol: 'HTTP/2', requests: 750000, avgLatency: 14, errors: 0.018 },
          { protocol: 'gRPC', requests: 420000, avgLatency: 10, errors: 0.012 },
          { protocol: 'WebSocket', requests: 280000, avgLatency: 9, errors: 0.028 },
          { protocol: 'REST', requests: 1650000, avgLatency: 18, errors: 0.042 },
        ]
      };

      return baseStats[cluster] || baseStats['prod-trading-cluster'];
    };

    setProtocolStats(generateClusterProtocolStats(selectedCluster));
  }, [selectedCluster]);

  const loadAvailableClusters = async () => {
    try {
      const response = await fetch('/api/network/clusters');
      const data = await response.json();
      
      if (data.clusters) {
        setAvailableClusters(data.clusters);
      }
    } catch (error) {
      console.error('Failed to load clusters:', error);
      // Fallback to hardcoded clusters
      setAvailableClusters([
        { value: 'prod-trading-cluster', label: 'Trading Cluster', region: 'us-east-1', service_count: 3 },
        { value: 'prod-risk-cluster', label: 'Risk Cluster', region: 'us-east-1', service_count: 3 },
        { value: 'prod-portfolio-cluster', label: 'Portfolio Cluster', region: 'us-east-1', service_count: 3 },
        { value: 'staging-apps-cluster', label: 'Staging Apps Cluster', region: 'us-east-1', service_count: 2 },
        { value: 'dev-microservices-cluster', label: 'Dev Microservices Cluster', region: 'us-east-1', service_count: 3 }
      ]);
    }
  };

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      
      // Fetch real topology data from backend API
      // For dependencies view, respect cluster selection to show cluster-specific dependencies
      const clusterParam = selectedCluster;
      const response = await fetch(`/api/network/topology?cluster=${clusterParam}&depth=3&include_external=false`);
      const data = await response.json();
      
      if (data.topology && data.topology.nodes && data.topology.links) {
        setTopology(data.topology);
        
        // Transform topology nodes to cluster nodes for ClusterTopology component
        const transformedClusterNodes: ClusterNode[] = data.topology.nodes.map((node: any) => {
          if (node.type === 'cluster') {
            return {
              id: node.id,
              name: node.name,
              type: 'deployment' as const,
              status: node.status === 'healthy' ? 'running' as const : 'warning' as const,
              namespace: 'kube-system',
              resources: {
                cpu: { usage: node.metrics?.cpu || 0, limit: 100 },
                memory: { usage: node.metrics?.memory || 0, limit: 100 }
              }
            };
          } else {
            return {
              id: node.id,
              name: node.name,
              type: node.type === 'service' ? 'service' as const : 'pod' as const,
              status: node.status === 'healthy' ? 'running' as const : 'warning' as const,
              namespace: node.type === 'service' ? 'default' : 'kube-system',
              resources: {
                cpu: { usage: node.metrics?.cpu || 0, limit: 100 },
                memory: { usage: node.metrics?.memory || 0, limit: 100 }
              },
              replicas: node.type === 'service' ? { ready: 2, total: 3 } : undefined
            };
          }
        });
        
        setClusterNodes(transformedClusterNodes);
      } else {
        console.warn('No topology data received from API, using fallback');
        // Fallback minimal topology if API fails
        setTopology({
          nodes: [
            { id: 'fallback-1', name: 'No Data Available', type: 'service' as const, status: 'warning' as const, cluster: selectedCluster, metrics: { cpu: 0, memory: 0, latency: 0 } }
          ],
          links: []
        });
        setClusterNodes([]);
      }

      // Transform topology data for ServiceDependencyMap
      if (data?.topology?.nodes && data?.topology?.links) {
        console.log('Raw topology data:', data.topology);
        
        // Transform nodes to ServiceNode format
        const transformedServiceNodes: ServiceNode[] = data.topology.nodes
          .filter((node: any) => node.type === 'service' || node.type === 'database')
          .map((node: any) => ({
            id: String(node.id), // Ensure ID is string
            name: node.name,
            type: node.type === 'database' ? 'database' as const : 'service' as const,
            criticality: node.name.includes('analytics') ? 'critical' as const :
                        node.name.includes('auth') ? 'high' as const :
                        node.name.includes('payment') ? 'high' as const :
                        'medium' as const,
            status: node.status === 'healthy' ? 'healthy' as const :
                   node.status === 'warning' ? 'degraded' as const :
                   'down' as const,
            region: node.region,
            cluster: node.cluster,
            metrics: {
              latency: node.metrics?.latency || 0,
              errorRate: Math.random() * 0.05, // Generate realistic error rate
              throughput: node.metrics?.connections || 0,
              availability: node.status === 'healthy' ? 99.9 : 
                          node.status === 'warning' ? 98.5 : 95.0
            }
          }));

        // Create a set of available node IDs for filtering
        const availableNodeIds = new Set(transformedServiceNodes.map(node => node.id));
        
        // Transform links to ServiceDependency format, but only include links between existing nodes
        const transformedServiceDependencies: any[] = data.topology.links
          .filter((link: any) => {
            const sourceId = String(link.source);
            const targetId = String(link.target);
            return availableNodeIds.has(sourceId) && availableNodeIds.has(targetId);
          })
          .map((link: any, index: number) => ({
            id: `dep-${index + 1}`,
            source: String(link.source), // Ensure string
            target: String(link.target), // Ensure string
            type: link.type === 'api_call' ? 'sync' as const :
                  link.type === 'database_query' ? 'sync' as const :
                  'async' as const,
            criticality: link.requestRate > 1000 ? 'critical' as const :
                        link.requestRate > 500 ? 'high' as const :
                        'medium' as const,
            strength: Math.min(10, Math.max(1, Math.floor(link.requestRate / 200))), // 1-10 scale for ServiceDependencyMap
            latency: link.latency || 0,
            errorRate: link.packetLoss || 0,
            callVolume: link.requestRate || 0 // Required by ServiceDependencyMap
          }));

        console.log('Available node IDs:', Array.from(availableNodeIds));
        console.log('Transformed service nodes:', transformedServiceNodes);
        console.log('Transformed service dependencies:', transformedServiceDependencies);
        
        setServiceNodes(transformedServiceNodes);
        setServiceDependencies(transformedServiceDependencies);
      } else {
        // Fallback to empty arrays if no data
        setServiceNodes([]);
        setServiceDependencies([]);
      }

      // Load latency analysis data from API
      const latencyResponse = await api.get('/api/network/latency-analysis', {
        params: {
          cluster: selectedCluster,
          timeframe: heatmapTimeRange
        }
      });
      
      // Handle different response structures - axios wraps the API response in .data
      const responseData = latencyResponse.data?.data || latencyResponse.data;
      
      if (responseData && Array.isArray(responseData)) {
        setLatencyData(responseData);
      } else {
        setLatencyData([]);
      }
      setLoading(false);
      
    } catch (error) {
      console.error('Failed to load network data:', error);
      addNotification('error', 'Failed to load network data', 'Please try refreshing the page');
      setLoading(false);
    }
  };

  const handleNodeSelect = (node: NetworkNode) => {
    setSelectedNode(node);
    // Convert to DrillDownItem for drill-down panel
    const drillDownItem: DrillDownItem = {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      metrics: node.metrics ? {
        cpu: node.metrics.cpu,
        memory: node.metrics.memory,
        latency: node.metrics.latency
      } : undefined,
      metadata: {
        region: node.cluster || 'us-east-1',
        uptime: '7d 14h'
      }
    };
    setDrillDownItem(drillDownItem);
    setShowDrillDown(true);
  };

  const handleLinkSelect = (link: NetworkLink) => {
    // Highlight the path for this link
    setHighlightPath([link.source, link.target]);
  };

  const handleClusterNodeSelect = (node: ClusterNode) => {
    const drillDownItem: DrillDownItem = {
      id: node.id,
      name: node.name,
      type: node.type === 'pod' ? 'pod' : node.type === 'service' ? 'service' : 'container',
      status: node.status === 'running' ? 'healthy' : node.status === 'pending' ? 'warning' : 'critical',
      metrics: node.resources ? {
        cpu: (node.resources.cpu.usage / node.resources.cpu.limit) * 100,
        memory: (node.resources.memory.usage / node.resources.memory.limit) * 100,
        latency: Math.random() * 20 + 5
      } : undefined,
      metadata: {
        namespace: node.namespace,
        replicas: node.replicas ? node.replicas.ready : undefined,
        uptime: '4h 23m'
      }
    };
    setDrillDownItem(drillDownItem);
    setShowDrillDown(true);
  };

  const handleServiceSelect = (service: ServiceNode) => {
    setSelectedService(service);
    const drillDownItem: DrillDownItem = {
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status === 'healthy' ? 'healthy' : service.status === 'degraded' ? 'warning' : 'critical',
      metrics: {
        cpu: Math.random() * 80 + 20,
        memory: Math.random() * 80 + 20,
        latency: service.metrics.latency,
        requests: service.metrics.requests,
        errors: service.metrics.errors
      },
      metadata: {
        region: service.cluster,
        uptime: `${service.metrics.uptime}%`
      }
    };
    setDrillDownItem(drillDownItem);
    setShowDrillDown(true);
  };

  const handleDrillDownItemSelect = (item: DrillDownItem) => {
    setDrillDownItem(item);
  };

  const handleLatencyHeatmapCellSelect = (dataPoint: any) => {
    console.log('Selected latency data point:', dataPoint);
    // Could show drill-down or update other views
  };

  const handleDependencySelect = (dependency: any) => {
    console.log('Selected dependency:', dependency);
    // Could show dependency details in drill-down panel
  };

  const closeDrillDown = () => {
    setShowDrillDown(false);
    setDrillDownItem(null);
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
          Loading network analysis...
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            Network Protocol Analysis
          </Title>
          <Text size="lg" c="dimmed">
            Real-time monitoring of network topology, protocol performance, and latency patterns
          </Text>
        </Stack>
        
        <Group gap="sm">
          <Select
            value={selectedCluster}
            onChange={(value) => setSelectedCluster(value || 'prod-trading-cluster')}
            data={availableClusters.map(cluster => ({
              value: cluster.value,
              label: `${cluster.label} (${cluster.service_count} services)`
            }))}
            searchable
            clearable={false}
            placeholder="Search clusters..."
            nothingFoundMessage="No clusters found"
            w={180}
          />
          <ActionIcon variant="outline" color="gray">
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Protocol Statistics Overview */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={3} c="cg-navy.6">Protocol Statistics</Title>
          <Badge color="cg-navy" variant="light">
            Live Data
          </Badge>
        </Group>
        
        <Grid>
          {protocolStats.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Stack gap="xs" align="center">
                  <Badge color="cg-navy" size="sm">
                    {stat.protocol}
                  </Badge>
                  <Text size="xl" fw={700} c="cg-navy.6">
                    {(stat.requests / 1000000).toFixed(1)}M
                  </Text>
                  <Text size="xs" c="dimmed" ta="center">
                    requests
                  </Text>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>
                      {stat.avgLatency}ms avg
                    </Text>
                    <Badge 
                      color={stat.errors > 0.02 ? 'red' : 'green'}
                      size="xs"
                    >
                      {(stat.errors * 100).toFixed(2)}% errors
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {/* Network Analysis Tabs */}
      <Tabs value={activeView} onChange={(value) => setActiveView(value as any)} color="cg-navy">
        <Tabs.List>
          <Tabs.Tab value="topology" leftSection={<IconNetwork size={16} />}>
            Network Topology
          </Tabs.Tab>
          <Tabs.Tab value="metrics" leftSection={<IconServer size={16} />}>
            Performance Metrics
          </Tabs.Tab>
          <Tabs.Tab value="cluster" leftSection={<IconHierarchy size={16} />}>
            Cluster View
          </Tabs.Tab>
          <Tabs.Tab value="dependencies" leftSection={<IconDatabase size={16} />}>
            Service Dependencies
          </Tabs.Tab>
          <Tabs.Tab value="heatmap" leftSection={<IconActivityHeartbeat size={16} />}>
            Latency Analysis
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="topology" pt="lg">
          {topology && (
            <Card withBorder shadow="sm" radius="md" p="lg">
              <Group justify="space-between" mb="md">
                <Title order={3} c="cg-navy.6">Enhanced Network Topology</Title>
                <Badge color="blue" variant="light">
                  Interactive D3.js View
                </Badge>
              </Group>
              <Box h={600}>
                <NetworkTopology
                  nodes={topology.nodes}
                  links={topology.links}
                  onNodeSelect={handleNodeSelect}
                  onLinkSelect={handleLinkSelect}
                  selectedCluster={selectedCluster}
                  highlightPath={highlightPath}
                />
              </Box>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="lg">
          {topology && (
            <MantineNetworkMetrics
              nodes={topology.nodes}
              links={topology.links}
              onNodeSelect={handleNodeSelect}
              selectedCluster={selectedCluster}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="cluster" pt="lg">
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">EKS Cluster Topology</Title>
              <Select
                value={selectedCluster}
                onChange={(value) => setSelectedCluster(value || 'prod-trading-cluster')}
                data={availableClusters.map(cluster => ({
                  value: cluster.value,
                  label: `${cluster.label} (${cluster.service_count} services)`
                }))}
                searchable
                clearable={false}
                placeholder="Search clusters..."
                nothingFoundMessage="No clusters found"
                w={200}
              />
            </Group>
            <Box h={600}>
              <ClusterTopology
                clusterName={selectedCluster}
                nodes={clusterNodes}
                onNodeSelect={handleClusterNodeSelect}
                onNamespaceFilter={() => {}}
              />
            </Box>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="dependencies" pt="lg">
          <Card withBorder shadow="sm" radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} c="cg-navy.6">Service Dependency Map</Title>
              <Badge color="violet" variant="light">
                Critical Path Analysis
              </Badge>
            </Group>
            <Box h={600}>
              <ServiceDependencyMap
                services={serviceNodes}
                dependencies={serviceDependencies}
                onServiceSelect={handleServiceSelect}
                onDependencySelect={handleDependencySelect}
                selectedService={selectedService?.id}
              />
            </Box>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="heatmap" pt="lg">
          <MantineLatencyAnalysis
            data={latencyData}
            timeRange={heatmapTimeRange}
            onTimeRangeChange={setHeatmapTimeRange}
            onCellSelect={handleLatencyHeatmapCellSelect}
            selectedService={selectedService?.name}
          />
        </Tabs.Panel>
      </Tabs>

      {showDrillDown && drillDownItem && (
        <DrillDownPanel
          selectedItem={drillDownItem}
          onItemSelect={handleDrillDownItemSelect}
          onClose={closeDrillDown}
        />
      )}
    </Stack>
  );
};

export default NetworkAnalysis;