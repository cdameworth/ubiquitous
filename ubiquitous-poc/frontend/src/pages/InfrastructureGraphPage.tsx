import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Card, Group, Stack, Title, Text, Button, Select, TextInput, 
  Badge, Progress, Grid, Slider, SegmentedControl, ActionIcon, 
  LoadingOverlay, Alert, Tooltip, Paper, Switch, NumberInput,
  Tabs, Collapse, MultiSelect, RangeSlider, Chip, Modal
} from '@mantine/core';
import { 
  IconRefresh, IconSearch, IconFilter, IconZoomIn, IconZoomOut, 
  IconZoomReset, IconDownload, IconSettings, IconEye, IconEyeOff,
  IconClusterOff, IconNetwork, IconHierarchy, IconBrandGoogleAnalytics,
  IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconLock,
  IconUnlock, IconMaximize, IconMinimize, IconPhoto, IconFileExport,
  IconAdjustments, IconLayers, IconMap, IconChartDots3
} from '@tabler/icons-react';
import { useNotification } from '../contexts/NotificationContext';
import D3InfrastructureGraph from '../components/Visualizations/D3InfrastructureGraph';
import api from '../services/api';

interface GraphStats {
  totalNodes: number;
  visibleNodes: number;
  totalEdges: number;
  visibleEdges: number;
  clusters: number;
  performance: {
    fps: number;
    renderTime: number;
    memoryUsage: number;
  };
}

interface ViewSettings {
  layout: 'force' | 'hierarchical' | 'radial' | 'grid';
  clustering: boolean;
  clusterThreshold: number;
  nodeSize: 'small' | 'medium' | 'large';
  edgeVisibility: 'all' | 'important' | 'none';
  labels: 'always' | 'hover' | 'selected' | 'none';
  physics: boolean;
  animationSpeed: number;
  theme: 'light' | 'dark' | 'contrast';
}

interface FilterSettings {
  nodeTypes: string[];
  statusFilter: string[];
  costRange: [number, number];
  searchQuery: string;
  depthLevel: number;
  showCriticalOnly: boolean;
  showAnomalies: boolean;
}

const InfrastructureGraphPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats>({
    totalNodes: 0,
    visibleNodes: 0,
    totalEdges: 0,
    visibleEdges: 0,
    clusters: 0,
    performance: {
      fps: 60,
      renderTime: 0,
      memoryUsage: 0
    }
  });
  
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    layout: 'force',
    clustering: true,
    clusterThreshold: 100,
    nodeSize: 'medium',
    edgeVisibility: 'important',
    labels: 'hover',
    physics: true,
    animationSpeed: 1,
    theme: 'dark'
  });

  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    nodeTypes: [],
    statusFilter: [],
    costRange: [0, 1000000],
    searchQuery: '',
    depthLevel: 3,
    showCriticalOnly: false,
    showAnomalies: false
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const graphRef = useRef<any>(null);
  const { addNotification } = useNotification();

  // Load graph data
  const loadGraphData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load from real API
      const response = await api.get('/api/infrastructure/graph', {
        params: {
          depth: filterSettings.depthLevel,
          types: filterSettings.nodeTypes.join(','),
          status: filterSettings.statusFilter.join(',')
        }
      });
      
      const data = response.data || response;
      
      // Process data for D3
      const processedData = {
        nodes: (data.nodes || []).map((node: any) => ({
          id: node.id,
          label: node.name || node.label,
          type: node.type || 'unknown',
          category: node.category || 'infrastructure',
          status: node.status || 'healthy',
          cost: node.cost || 0,
          risk: node.risk_score || 0,
          dependencies: node.dependencies || [],
          metrics: node.metrics || {},
          x: node.x || Math.random() * 1000,
          y: node.y || Math.random() * 1000,
          cluster: node.cluster,
          importance: node.importance || 1
        })),
        edges: (data.edges || []).map((edge: any) => ({
          id: edge.id || `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'connection',
          weight: edge.weight || 1,
          critical: edge.critical || false
        })),
        metadata: {
          totalNodes: data.metadata?.total_nodes || data.nodes?.length || 0,
          categories: data.metadata?.categories || [],
          lastUpdated: data.metadata?.last_updated || new Date().toISOString()
        }
      };
      
      setGraphData(processedData);
      setGraphStats(prev => ({
        ...prev,
        totalNodes: processedData.nodes.length,
        totalEdges: processedData.edges.length,
        visibleNodes: processedData.nodes.length,
        visibleEdges: processedData.edges.length
      }));
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load graph data:', error);
      addNotification('error', 'Failed to load infrastructure graph', 'Check API connectivity');
      setLoading(false);
      
      // Load mock data as fallback
      loadMockData();
    }
  }, [filterSettings, addNotification]);

  // Load mock data for demonstration
  const loadMockData = () => {
    const mockNodes = [];
    const mockEdges = [];
    
    // Create hierarchical mock data
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    const nodeTypes = ['vpc', 'eks-cluster', 'rds', 'ec2', 'lambda', 's3'];
    const statuses = ['healthy', 'warning', 'critical'];
    
    let nodeId = 0;
    
    // Create regions
    regions.forEach(region => {
      mockNodes.push({
        id: `region-${nodeId}`,
        label: region,
        type: 'region',
        category: 'infrastructure',
        status: 'healthy',
        cost: Math.random() * 100000,
        risk: Math.random() * 10,
        importance: 10,
        x: Math.random() * 1000,
        y: Math.random() * 1000
      });
      
      const regionId = `region-${nodeId}`;
      nodeId++;
      
      // Create VPCs in each region
      for (let v = 0; v < 3; v++) {
        const vpcId = `vpc-${nodeId}`;
        mockNodes.push({
          id: vpcId,
          label: `VPC-${v + 1}`,
          type: 'vpc',
          category: 'network',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          cost: Math.random() * 50000,
          risk: Math.random() * 10,
          importance: 8,
          x: Math.random() * 1000,
          y: Math.random() * 1000
        });
        
        mockEdges.push({
          id: `edge-${regionId}-${vpcId}`,
          source: regionId,
          target: vpcId,
          type: 'contains',
          weight: 2
        });
        
        nodeId++;
        
        // Create services in each VPC
        for (let s = 0; s < 5; s++) {
          const serviceType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
          const serviceId = `service-${nodeId}`;
          
          mockNodes.push({
            id: serviceId,
            label: `${serviceType}-${s + 1}`,
            type: serviceType,
            category: 'service',
            status: statuses[Math.floor(Math.random() * statuses.length)],
            cost: Math.random() * 10000,
            risk: Math.random() * 10,
            importance: Math.random() * 10,
            x: Math.random() * 1000,
            y: Math.random() * 1000
          });
          
          mockEdges.push({
            id: `edge-${vpcId}-${serviceId}`,
            source: vpcId,
            target: serviceId,
            type: 'contains',
            weight: 1
          });
          
          // Add some inter-service connections
          if (Math.random() > 0.7 && nodeId > 10) {
            const targetId = `service-${Math.floor(Math.random() * (nodeId - 10)) + 10}`;
            mockEdges.push({
              id: `edge-${serviceId}-${targetId}`,
              source: serviceId,
              target: targetId,
              type: 'connection',
              weight: 0.5,
              critical: Math.random() > 0.8
            });
          }
          
          nodeId++;
        }
      }
    });
    
    setGraphData({
      nodes: mockNodes,
      edges: mockEdges,
      metadata: {
        totalNodes: mockNodes.length,
        categories: ['infrastructure', 'network', 'service'],
        lastUpdated: new Date().toISOString()
      }
    });
    
    setGraphStats(prev => ({
      ...prev,
      totalNodes: mockNodes.length,
      totalEdges: mockEdges.length,
      visibleNodes: mockNodes.length,
      visibleEdges: mockEdges.length
    }));
  };

  // Initial load
  useEffect(() => {
    loadGraphData();
  }, []);

  // Handle zoom controls
  const handleZoom = (action: 'in' | 'out' | 'reset' | 'fit') => {
    if (graphRef.current) {
      graphRef.current.handleZoom(action);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (graphRef.current && filterSettings.searchQuery) {
      graphRef.current.searchNodes(filterSettings.searchQuery);
    }
  };

  // Handle export
  const handleExport = (format: 'png' | 'svg' | 'json') => {
    if (graphRef.current) {
      graphRef.current.export(format);
    }
    setExportModalOpen(false);
    addNotification('success', `Exported as ${format.toUpperCase()}`, 'Download started');
  };

  // Get performance color
  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return 'green';
    if (fps >= 30) return 'yellow';
    return 'red';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'yellow';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">
            <IconNetwork size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Infrastructure Topology
          </Title>
          <Text c="dimmed">
            Interactive visualization of your complete infrastructure with {graphStats.totalNodes.toLocaleString()} nodes
          </Text>
        </Stack>
        
        <Group>
          <Badge size="lg" color={getPerformanceColor(graphStats.performance.fps)}>
            {graphStats.performance.fps} FPS
          </Badge>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            color="cg-navy"
            onClick={loadGraphData}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* Main Layout */}
      <Grid>
        {/* Control Panel */}
        <Grid.Col span={panelCollapsed ? 0.5 : 3}>
          <Card withBorder padding="md" h="85vh" style={{ overflow: 'auto' }}>
            {!panelCollapsed ? (
              <Stack gap="md">
                {/* Panel Header */}
                <Group justify="space-between">
                  <Text fw={600}>Controls</Text>
                  <ActionIcon onClick={() => setPanelCollapsed(true)} size="sm">
                    <IconMinimize size={14} />
                  </ActionIcon>
                </Group>

                {/* Search */}
                <TextInput
                  placeholder="Search nodes..."
                  leftSection={<IconSearch size={16} />}
                  value={filterSettings.searchQuery}
                  onChange={(e) => setFilterSettings(prev => ({ ...prev, searchQuery: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  rightSection={
                    <ActionIcon onClick={handleSearch} size="sm">
                      <IconSearch size={14} />
                    </ActionIcon>
                  }
                />

                {/* View Settings */}
                <Paper withBorder p="xs">
                  <Text size="sm" fw={500} mb="xs">View Settings</Text>
                  
                  <Stack gap="xs">
                    <Select
                      label="Layout"
                      size="xs"
                      value={viewSettings.layout}
                      onChange={(value) => setViewSettings(prev => ({ ...prev, layout: value as any }))}
                      data={[
                        { value: 'force', label: 'Force Directed' },
                        { value: 'hierarchical', label: 'Hierarchical' },
                        { value: 'radial', label: 'Radial' },
                        { value: 'grid', label: 'Grid' }
                      ]}
                    />
                    
                    <Select
                      label="Node Size"
                      size="xs"
                      value={viewSettings.nodeSize}
                      onChange={(value) => setViewSettings(prev => ({ ...prev, nodeSize: value as any }))}
                      data={[
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                      ]}
                    />
                    
                    <Select
                      label="Labels"
                      size="xs"
                      value={viewSettings.labels}
                      onChange={(value) => setViewSettings(prev => ({ ...prev, labels: value as any }))}
                      data={[
                        { value: 'always', label: 'Always Show' },
                        { value: 'hover', label: 'On Hover' },
                        { value: 'selected', label: 'Selected Only' },
                        { value: 'none', label: 'Hide' }
                      ]}
                    />
                    
                    <Switch
                      label="Enable Clustering"
                      size="xs"
                      checked={viewSettings.clustering}
                      onChange={(e) => setViewSettings(prev => ({ ...prev, clustering: e.currentTarget.checked }))}
                    />
                    
                    {viewSettings.clustering && (
                      <Slider
                        label="Cluster Threshold"
                        size="xs"
                        value={viewSettings.clusterThreshold}
                        onChange={(value) => setViewSettings(prev => ({ ...prev, clusterThreshold: value }))}
                        min={10}
                        max={500}
                        step={10}
                      />
                    )}
                    
                    <Switch
                      label="Physics Simulation"
                      size="xs"
                      checked={viewSettings.physics}
                      onChange={(e) => setViewSettings(prev => ({ ...prev, physics: e.currentTarget.checked }))}
                    />
                  </Stack>
                </Paper>

                {/* Filters */}
                <Paper withBorder p="xs">
                  <Text size="sm" fw={500} mb="xs">Filters</Text>
                  
                  <Stack gap="xs">
                    <MultiSelect
                      label="Node Types"
                      size="xs"
                      placeholder="All types"
                      value={filterSettings.nodeTypes}
                      onChange={(value) => setFilterSettings(prev => ({ ...prev, nodeTypes: value }))}
                      data={[
                        { value: 'vpc', label: 'VPC' },
                        { value: 'eks', label: 'EKS Cluster' },
                        { value: 'rds', label: 'RDS' },
                        { value: 'ec2', label: 'EC2' },
                        { value: 'lambda', label: 'Lambda' },
                        { value: 's3', label: 'S3' }
                      ]}
                    />
                    
                    <MultiSelect
                      label="Status"
                      size="xs"
                      placeholder="All statuses"
                      value={filterSettings.statusFilter}
                      onChange={(value) => setFilterSettings(prev => ({ ...prev, statusFilter: value }))}
                      data={[
                        { value: 'healthy', label: 'Healthy' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'critical', label: 'Critical' }
                      ]}
                    />
                    
                    <Text size="xs" c="dimmed">Cost Range</Text>
                    <RangeSlider
                      size="xs"
                      value={filterSettings.costRange}
                      onChange={(value) => setFilterSettings(prev => ({ ...prev, costRange: value }))}
                      min={0}
                      max={1000000}
                      step={10000}
                      marks={[
                        { value: 0, label: '$0' },
                        { value: 500000, label: '$500K' },
                        { value: 1000000, label: '$1M' }
                      ]}
                    />
                    
                    <Slider
                      label="Depth Level"
                      size="xs"
                      value={filterSettings.depthLevel}
                      onChange={(value) => setFilterSettings(prev => ({ ...prev, depthLevel: value }))}
                      min={1}
                      max={5}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 3, label: '3' },
                        { value: 5, label: '5' }
                      ]}
                    />
                    
                    <Switch
                      label="Show Critical Only"
                      size="xs"
                      checked={filterSettings.showCriticalOnly}
                      onChange={(e) => setFilterSettings(prev => ({ ...prev, showCriticalOnly: e.currentTarget.checked }))}
                    />
                    
                    <Switch
                      label="Show Anomalies"
                      size="xs"
                      checked={filterSettings.showAnomalies}
                      onChange={(e) => setFilterSettings(prev => ({ ...prev, showAnomalies: e.currentTarget.checked }))}
                    />
                  </Stack>
                </Paper>

                {/* Display Options */}
                <Paper withBorder p="xs">
                  <Text size="sm" fw={500} mb="xs">Display</Text>
                  
                  <Stack gap="xs">
                    <Switch
                      label="Show Minimap"
                      size="xs"
                      checked={showMinimap}
                      onChange={(e) => setShowMinimap(e.currentTarget.checked)}
                    />
                    
                    <Switch
                      label="Show Legend"
                      size="xs"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.currentTarget.checked)}
                    />
                    
                    <Switch
                      label="Show Stats"
                      size="xs"
                      checked={showStats}
                      onChange={(e) => setShowStats(e.currentTarget.checked)}
                    />
                    
                    <Select
                      label="Theme"
                      size="xs"
                      value={viewSettings.theme}
                      onChange={(value) => setViewSettings(prev => ({ ...prev, theme: value as any }))}
                      data={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'contrast', label: 'High Contrast' }
                      ]}
                    />
                  </Stack>
                </Paper>

                {/* Actions */}
                <Stack gap="xs">
                  <Button
                    fullWidth
                    size="xs"
                    leftSection={<IconFileExport size={14} />}
                    onClick={() => setExportModalOpen(true)}
                  >
                    Export Graph
                  </Button>
                  
                  <Button
                    fullWidth
                    size="xs"
                    variant="light"
                    leftSection={<IconZoomReset size={14} />}
                    onClick={() => handleZoom('reset')}
                  >
                    Reset View
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack align="center" h="100%">
                <ActionIcon onClick={() => setPanelCollapsed(false)} size="sm">
                  <IconMaximize size={14} />
                </ActionIcon>
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Graph Visualization */}
        <Grid.Col span={panelCollapsed ? 11.5 : 9}>
          <Card withBorder padding={0} h="85vh" pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ backgroundOpacity: 0.7 }} />
            
            {/* Zoom Controls */}
            <Group 
              pos="absolute" 
              top={10} 
              right={10} 
              style={{ zIndex: 1000 }}
            >
              <Paper withBorder p="xs" bg="white">
                <Group gap="xs">
                  <Tooltip label="Zoom In">
                    <ActionIcon onClick={() => handleZoom('in')}>
                      <IconZoomIn size={18} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Zoom Out">
                    <ActionIcon onClick={() => handleZoom('out')}>
                      <IconZoomOut size={18} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Reset Zoom">
                    <ActionIcon onClick={() => handleZoom('reset')}>
                      <IconZoomReset size={18} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <Tooltip label="Fit to Screen">
                    <ActionIcon onClick={() => handleZoom('fit')}>
                      <IconMaximize size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Paper>
            </Group>

            {/* Graph Component */}
            <D3InfrastructureGraph
              ref={graphRef}
              data={graphData}
              viewSettings={viewSettings}
              filterSettings={filterSettings}
              onNodeSelect={(nodes) => setSelectedNodes(nodes)}
              onNodeHover={(node) => setHoveredNode(node)}
              onStatsUpdate={(stats) => setGraphStats(prev => ({ ...prev, ...stats }))}
              showMinimap={showMinimap}
              showLegend={showLegend}
              height="100%"
            />

            {/* Stats Overlay */}
            {showStats && (
              <Paper 
                withBorder 
                p="xs" 
                pos="absolute" 
                bottom={10} 
                left={10}
                bg="white"
                style={{ zIndex: 1000 }}
              >
                <Group gap="md">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">Nodes</Text>
                    <Text size="sm" fw={600}>
                      {graphStats.visibleNodes.toLocaleString()} / {graphStats.totalNodes.toLocaleString()}
                    </Text>
                  </Stack>
                  
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">Edges</Text>
                    <Text size="sm" fw={600}>
                      {graphStats.visibleEdges.toLocaleString()} / {graphStats.totalEdges.toLocaleString()}
                    </Text>
                  </Stack>
                  
                  {viewSettings.clustering && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Clusters</Text>
                      <Text size="sm" fw={600}>{graphStats.clusters}</Text>
                    </Stack>
                  )}
                  
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">Performance</Text>
                    <Badge size="sm" color={getPerformanceColor(graphStats.performance.fps)}>
                      {graphStats.performance.fps} FPS
                    </Badge>
                  </Stack>
                </Group>
              </Paper>
            )}

            {/* Node Info Tooltip */}
            {hoveredNode && (
              <Paper 
                withBorder 
                p="xs" 
                pos="absolute" 
                top={60} 
                left={10}
                bg="white"
                style={{ zIndex: 1000, maxWidth: 300 }}
              >
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>{hoveredNode}</Text>
                    <Badge size="xs" color={getStatusColor('healthy')}>Healthy</Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Click to select • Double-click to focus • Right-click for options
                  </Text>
                </Stack>
              </Paper>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Export Modal */}
      <Modal
        opened={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Infrastructure Graph"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Choose export format for the infrastructure visualization
          </Text>
          
          <Button
            fullWidth
            leftSection={<IconPhoto size={18} />}
            onClick={() => handleExport('png')}
          >
            Export as PNG Image
          </Button>
          
          <Button
            fullWidth
            leftSection={<IconFileExport size={18} />}
            onClick={() => handleExport('svg')}
          >
            Export as SVG Vector
          </Button>
          
          <Button
            fullWidth
            leftSection={<IconChartDots3 size={18} />}
            onClick={() => handleExport('json')}
          >
            Export as JSON Data
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
};

export default InfrastructureGraphPage;