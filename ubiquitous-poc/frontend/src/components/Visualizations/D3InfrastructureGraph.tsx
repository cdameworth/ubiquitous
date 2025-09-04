import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { Box } from '@mantine/core';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  status: string;
  cost: number;
  risk: number;
  importance: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  cluster?: string;
  metrics?: any;
  dependencies?: string[];
}

interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  weight: number;
  critical?: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: {
    totalNodes: number;
    categories: string[];
    lastUpdated: string;
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

interface D3InfrastructureGraphProps {
  data: GraphData | null;
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  onNodeSelect?: (nodes: string[]) => void;
  onNodeHover?: (node: string | null) => void;
  onStatsUpdate?: (stats: any) => void;
  showMinimap?: boolean;
  showLegend?: boolean;
  height?: string | number;
}

const D3InfrastructureGraph = forwardRef<any, D3InfrastructureGraphProps>(({
  data,
  viewSettings,
  filterSettings,
  onNodeSelect,
  onNodeHover,
  onStatsUpdate,
  showMinimap = true,
  showLegend = true,
  height = '100%'
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [clusters, setClusters] = useState<Map<string, GraphNode[]>>(new Map());

  // Node type configuration
  const nodeConfig = {
    region: { color: '#ff6b35', size: 30, shape: 'rect' },
    vpc: { color: '#4a90e2', size: 25, shape: 'rect' },
    'eks-cluster': { color: '#f39c12', size: 20, shape: 'hexagon' },
    cluster: { color: '#f39c12', size: 20, shape: 'hexagon' },
    eks: { color: '#f39c12', size: 20, shape: 'hexagon' }, // AWS EKS clusters
    rds: { color: '#8e44ad', size: 18, shape: 'rect' },
    'rds-instance': { color: '#8e44ad', size: 18, shape: 'rect' },
    'rds-oracle': { color: '#8e44ad', size: 18, shape: 'rect' },
    ec2: { color: '#e74c3c', size: 15, shape: 'rect' },
    'ec2-sqlserver': { color: '#e74c3c', size: 15, shape: 'rect' },
    lambda: { color: '#27ae60', size: 12, shape: 'circle' },
    s3: { color: '#17a2b8', size: 12, shape: 'triangle' },
    // Additional AWS resource types from API
    awsresource: { color: '#95a5a6', size: 14, shape: 'circle' }, // Generic fallback for unmatched types
    service: { color: '#3498db', size: 14, shape: 'circle' } // Services
  };

  // Get node size based on settings
  const getNodeSize = (node: GraphNode) => {
    // Use properties.type for AWS resources, fall back to node.type
    const nodeType = node.properties?.type?.toLowerCase() || node.type;
    const baseSize = nodeConfig[nodeType]?.size || 10;
    const sizeMultiplier = viewSettings.nodeSize === 'small' ? 0.7 : 
                           viewSettings.nodeSize === 'large' ? 1.3 : 1;
    return baseSize * sizeMultiplier * (node.importance || 1);
  };

  // Get node color based on status and theme
  const getNodeColor = (node: GraphNode) => {
    // Use properties.type for AWS resources, fall back to node.type
    const nodeType = node.properties?.type?.toLowerCase() || node.type;
    const config = nodeConfig[nodeType];
    
    console.log('Getting color for node:', node.label, 'nodeType:', nodeType, 'properties:', node.properties, 'config found:', !!config);
    
    // Status-based coloring for dark theme
    if (viewSettings.theme === 'dark') {
      switch (node.status) {
        case 'critical': return '#ff4444';
        case 'warning': return '#ffaa00';
        case 'healthy': return '#00ff00';
        default: return config?.color || '#666';
      }
    }
    
    // Return type-based color or fallback
    const color = config?.color || '#999';
    console.log('Final color for', node.label, ':', color);
    return color;
  };

  // Initialize D3 visualization
  useEffect(() => {
    if (!data || !containerRef.current || !svgRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    
    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const width = rect.width || 1200;
    const height = rect.height || 800;
    setDimensions({ width, height });

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        setTransform(event.transform);
      });

    svg.call(zoom);

    // Filter data based on settings
    let filteredNodes = [...data.nodes];
    let filteredEdges = [...data.edges];

    // Apply filters
    if (filterSettings.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter(n => {
        const nodeType = n.properties?.type?.toLowerCase() || n.type;
        return filterSettings.nodeTypes.includes(nodeType);
      });
    }
    if (filterSettings.statusFilter.length > 0) {
      filteredNodes = filteredNodes.filter(n => filterSettings.statusFilter.includes(n.status));
    }
    if (filterSettings.showCriticalOnly) {
      filteredNodes = filteredNodes.filter(n => n.status === 'critical');
    }
    if (filterSettings.costRange) {
      filteredNodes = filteredNodes.filter(n => n.cost >= filterSettings.costRange[0] && n.cost <= filterSettings.costRange[1]);
    }

    // Filter edges to only include those with both nodes visible
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(e => {
      const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
      const targetId = typeof e.target === 'string' ? e.target : e.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    // Apply clustering if enabled
    if (viewSettings.clustering && filteredNodes.length > viewSettings.clusterThreshold) {
      const clustered = performClustering(filteredNodes, filteredEdges, viewSettings.clusterThreshold);
      filteredNodes = clustered.nodes;
      filteredEdges = clustered.edges;
      setClusters(clustered.clusters);
    }

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(filteredEdges)
        .id(d => d.id)
        .distance(d => 50 * (d.weight || 1))
        .strength(0.5))
      .force('charge', d3.forceManyBody()
        .strength(d => -100 * getNodeSize(d) / 10)
        .distanceMax(300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => getNodeSize(d) + 5));

    // Apply layout
    if (viewSettings.layout === 'hierarchical') {
      applyHierarchicalLayout(filteredNodes, filteredEdges, width, height);
    } else if (viewSettings.layout === 'radial') {
      applyRadialLayout(filteredNodes, filteredEdges, width, height);
    } else if (viewSettings.layout === 'grid') {
      applyGridLayout(filteredNodes, width, height);
    }

    // Add edges
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredEdges)
      .enter().append('line')
      .attr('stroke', d => d.critical ? '#ff0000' : '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight || 1))
      .attr('stroke-dasharray', d => d.type === 'connection' ? '5,5' : '');

    // Add nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add node shapes
    nodes.each(function(d) {
      const node = d3.select(this);
      const size = getNodeSize(d);
      const color = getNodeColor(d);
      const nodeType = d.properties?.type?.toLowerCase() || d.type;
      const shape = nodeConfig[nodeType]?.shape || 'circle';

      if (shape === 'circle') {
        node.append('circle')
          .attr('r', size)
          .attr('fill', color);
      } else if (shape === 'rect') {
        node.append('rect')
          .attr('x', -size)
          .attr('y', -size * 0.6)
          .attr('width', size * 2)
          .attr('height', size * 1.2)
          .attr('fill', color)
          .attr('rx', 3);
      } else if (shape === 'diamond') {
        node.append('path')
          .attr('d', d3.symbol().type(d3.symbolDiamond).size(size * size * 2))
          .attr('fill', color);
      } else if (shape === 'hexagon') {
        const hexagon = hexagonPath(size);
        node.append('path')
          .attr('d', hexagon)
          .attr('fill', color);
      } else if (shape === 'triangle') {
        node.append('path')
          .attr('d', d3.symbol().type(d3.symbolTriangle).size(size * size * 2))
          .attr('fill', color);
      }

      // Add labels based on settings
      if (viewSettings.labels === 'always' || 
          (viewSettings.labels === 'selected' && selectedNodes.has(d.id))) {
        node.append('text')
          .text(d.label)
          .attr('x', 0)
          .attr('y', size + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px')
          .attr('fill', viewSettings.theme === 'dark' ? '#fff' : '#000');
      }
    });

    // Add hover effects
    nodes
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        if (viewSettings.labels === 'hover') {
          d3.select(this).append('text')
            .attr('class', 'hover-label')
            .text(d.label)
            .attr('x', 0)
            .attr('y', getNodeSize(d) + 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', viewSettings.theme === 'dark' ? '#fff' : '#000');
        }
        onNodeHover?.(d.id);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).attr('opacity', 1);
        d3.select(this).select('.hover-label').remove();
        onNodeHover?.(null);
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        console.log('Node clicked:', d.id, d.type);
        const newSelected = new Set(selectedNodes);
        if (event.shiftKey) {
          if (newSelected.has(d.id)) {
            newSelected.delete(d.id);
          } else {
            newSelected.add(d.id);
          }
        } else {
          newSelected.clear();
          newSelected.add(d.id);
        }
        setSelectedNodes(newSelected);
        onNodeSelect?.(Array.from(newSelected));
      })
      .on('contextmenu', function(event, d) {
        event.preventDefault();
        console.log('Node right-clicked:', d.id, d.type);
        // Simple context menu - could be enhanced with actual menu
        const actions = [
          `Focus on ${d.label}`,
          `View ${d.type} details`,
          `Show connections`,
          `Export node data`
        ];
        const action = prompt(`Node: ${d.label}\nSelect action:\n${actions.map((a, i) => `${i+1}. ${a}`).join('\n')}`);
        if (action) {
          console.log(`Action ${action} for node ${d.id}`);
        }
      })
      .on('dblclick', function(event, d) {
        event.stopPropagation();
        // Center on node
        const scale = 2;
        const translate = [width / 2 - scale * d.x!, height / 2 - scale * d.y!];
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale));
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      nodes
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      if (!event.sourceEvent.shiftKey) {
        d.fx = null;
        d.fy = null;
      }
    }

    simulationRef.current = simulation;

    // Update stats
    onStatsUpdate?.({
      visibleNodes: filteredNodes.length,
      visibleEdges: filteredEdges.length,
      clusters: clusters.size,
      performance: {
        fps: 60, // Would need actual FPS monitoring
        renderTime: 0,
        memoryUsage: 0
      }
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, viewSettings, filterSettings]);

  // Clustering algorithm
  const performClustering = (nodes: GraphNode[], edges: GraphEdge[], threshold: number) => {
    const clusters = new Map<string, GraphNode[]>();
    const clusterNodes: GraphNode[] = [];
    const clusterEdges: GraphEdge[] = [];

    // Simple clustering by type and proximity
    nodes.forEach(node => {
      const clusterKey = `${node.type}-${Math.floor(node.x! / 200)}-${Math.floor(node.y! / 200)}`;
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(node);
    });

    // Create cluster nodes
    clusters.forEach((clusterMembers, key) => {
      if (clusterMembers.length > 5) {
        const clusterNode: GraphNode = {
          id: `cluster-${key}`,
          label: `Cluster (${clusterMembers.length})`,
          type: 'cluster',
          category: 'cluster',
          status: 'healthy',
          cost: clusterMembers.reduce((sum, n) => sum + n.cost, 0),
          risk: Math.max(...clusterMembers.map(n => n.risk)),
          importance: 10,
          x: d3.mean(clusterMembers, n => n.x) || 0,
          y: d3.mean(clusterMembers, n => n.y) || 0
        };
        clusterNodes.push(clusterNode);
      } else {
        clusterNodes.push(...clusterMembers);
      }
    });

    // Recreate edges for clusters
    // This is simplified - real implementation would aggregate edges
    clusterEdges.push(...edges);

    return { nodes: clusterNodes, edges: clusterEdges, clusters };
  };

  // Layout algorithms
  const applyHierarchicalLayout = (nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) => {
    // Filter nodes suitable for hierarchical layout
    const hierarchicalNodes = nodes.filter(n => n.type === 'region' || n.type === 'vpc' || n.type === 'cluster');
    
    if (hierarchicalNodes.length === 0) {
      // Fallback to force layout if no hierarchical nodes
      return;
    }

    try {
      // Create hierarchy from edges with proper root detection
      const root = d3.stratify<GraphNode>()
        .id(d => d.id)
        .parentId(d => {
          // Find parent from edges
          const edge = edges.find(e => {
            const targetId = typeof e.target === 'object' ? e.target.id : e.target;
            return targetId === d.id;
          });
          
          if (edge) {
            const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
            // Only return parent if it exists in our hierarchical nodes
            return hierarchicalNodes.find(n => n.id === sourceId) ? sourceId : null;
          }
          return null;
        })(hierarchicalNodes);

      const treeLayout = d3.tree<GraphNode>()
        .size([width - 100, height - 100]);

      const tree = treeLayout(root as any);

      // Apply positions to original nodes
      tree.descendants().forEach(d => {
        const node = nodes.find(n => n.id === d.id);
        if (node) {
          node.x = d.x + 50;
          node.y = d.y + 50;
        }
      });
    } catch (error) {
      console.warn('Hierarchical layout failed, falling back to force layout:', error);
      // Fallback to default positioning - let force simulation handle it
    }
  };

  const applyRadialLayout = (nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Group nodes by type
    const groups = d3.group(nodes, d => d.type);
    let angleStep = (2 * Math.PI) / groups.size;
    let groupIndex = 0;

    groups.forEach((groupNodes, type) => {
      const groupAngle = angleStep * groupIndex;
      const nodeAngleStep = angleStep / groupNodes.length;

      groupNodes.forEach((node, i) => {
        const angle = groupAngle + nodeAngleStep * i;
        const r = radius * (1 + (node.importance || 1) * 0.1);
        node.x = centerX + r * Math.cos(angle);
        node.y = centerY + r * Math.sin(angle);
      });

      groupIndex++;
    });
  };

  const applyGridLayout = (nodes: GraphNode[], width: number, height: number) => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const cellWidth = (width - 100) / cols;
    const cellHeight = (height - 100) / rows;

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      node.x = 50 + col * cellWidth + cellWidth / 2;
      node.y = 50 + row * cellHeight + cellHeight / 2;
    });
  };

  // Hexagon path generator
  const hexagonPath = (size: number) => {
    const angle = Math.PI / 3;
    const points = [];
    for (let i = 0; i < 6; i++) {
      points.push([
        size * Math.cos(angle * i),
        size * Math.sin(angle * i)
      ]);
    }
    return 'M' + points.join('L') + 'Z';
  };

  // Handle zoom controls
  const handleZoom = useCallback((action: 'in' | 'out' | 'reset' | 'fit') => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();

    switch (action) {
      case 'in':
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
        break;
      case 'out':
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
        break;
      case 'reset':
        svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
        break;
      case 'fit':
        if (data) {
          const bounds = d3.select('.main-group').node() as SVGGElement;
          if (bounds) {
            const bbox = bounds.getBBox();
            const fullWidth = dimensions.width;
            const fullHeight = dimensions.height;
            const width = bbox.width;
            const height = bbox.height;
            const midX = bbox.x + width / 2;
            const midY = bbox.y + height / 2;
            const scale = 0.9 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
            
            svg.transition().duration(300).call(
              zoom.transform,
              d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
          }
        }
        break;
    }
  }, [data, dimensions]);

  // Search nodes
  const searchNodes = useCallback((query: string) => {
    if (!query || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const nodes = svg.selectAll('.node');
    
    nodes.each(function(d: any) {
      const node = d3.select(this);
      const matches = d.label.toLowerCase().includes(query.toLowerCase()) ||
                      d.type.toLowerCase().includes(query.toLowerCase());
      
      node.attr('opacity', matches ? 1 : 0.2);
      
      if (matches) {
        // Highlight first match
        const scale = 2;
        const translate = [dimensions.width / 2 - scale * d.x, dimensions.height / 2 - scale * d.y];
        svg.transition()
          .duration(750)
          .call(d3.zoom<SVGSVGElement, unknown>().transform, 
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      }
    });
  }, [dimensions]);

  // Export functionality
  const exportGraph = useCallback((format: 'png' | 'svg' | 'json') => {
    if (!svgRef.current || !data) return;

    switch (format) {
      case 'svg':
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        downloadBlob(blob, `infrastructure-graph-${Date.now()}.svg`);
        break;
      
      case 'png':
        // Convert SVG to PNG using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgString = new XMLSerializer().serializeToString(svgRef.current);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              downloadBlob(blob, `infrastructure-graph-${Date.now()}.png`);
            }
          });
          URL.revokeObjectURL(url);
        };
        img.src = url;
        break;
      
      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(jsonBlob, `infrastructure-graph-${Date.now()}.json`);
        break;
    }
  }, [data, dimensions]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    handleZoom,
    searchNodes,
    export: exportGraph
  }));

  // Add minimap
  const renderMinimap = () => {
    if (!showMinimap || !data) return null;

    return (
      <Box
        pos="absolute"
        bottom={10}
        right={10}
        w={200}
        h={150}
        style={{
          border: '1px solid #ccc',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 1000
        }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
          <rect
            x={-transform.x / transform.k}
            y={-transform.y / transform.k}
            width={dimensions.width / transform.k}
            height={dimensions.height / transform.k}
            fill="none"
            stroke="red"
            strokeWidth={2}
          />
          {data.nodes.slice(0, 100).map(node => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={2}
              fill={getNodeColor(node)}
            />
          ))}
        </svg>
      </Box>
    );
  };

  // Add legend
  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <Box
        pos="absolute"
        top={10}
        left={10}
        p="xs"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          borderRadius: 4,
          zIndex: 1000
        }}
      >
        {Object.entries(nodeConfig).map(([type, config]) => (
          <Box key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <Box
              w={16}
              h={16}
              bg={config.color}
              style={{ borderRadius: config.shape === 'circle' ? '50%' : 2, marginRight: 8 }}
            />
            <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{type.replace('-', ' ')}</span>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box ref={containerRef} pos="relative" h={height} w="100%">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          background: viewSettings.theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
          cursor: 'grab'
        }}
      />
      {renderMinimap()}
      {renderLegend()}
    </Box>
  );
});

D3InfrastructureGraph.displayName = 'D3InfrastructureGraph';

export default D3InfrastructureGraph;