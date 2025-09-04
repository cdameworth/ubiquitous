import React, { useEffect, useRef, useState } from 'react';
import './ClusterTopology.css';

interface ClusterNode {
  id: string;
  name: string;
  type: 'cluster' | 'namespace' | 'pod' | 'service' | 'ingress' | 'volume';
  status: 'running' | 'pending' | 'failed' | 'warning';
  cluster?: string;
  namespace?: string;
  resources?: {
    cpu: { requested: number; limit: number; usage: number };
    memory: { requested: number; limit: number; usage: number };
  };
  replicas?: {
    desired: number;
    ready: number;
    available: number;
  };
  metadata?: {
    version?: string;
    region?: string;
    zone?: string;
    cost?: number;
  };
}

interface ClusterTopologyProps {
  clusterName: string;
  nodes: ClusterNode[];
  onNodeSelect: (node: ClusterNode) => void;
  onNamespaceFilter: (namespace: string) => void;
  selectedNamespace?: string;
  showResourceUsage?: boolean;
}

const ClusterTopology: React.FC<ClusterTopologyProps> = ({
  clusterName,
  nodes,
  onNodeSelect,
  onNamespaceFilter,
  selectedNamespace,
  showResourceUsage = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const simulationRef = useRef<any>(null);
  const [d3, setD3] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadD3 = async () => {
      try {
        const d3Module = await import('d3');
        setD3(d3Module);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load D3.js:', error);
        setLoading(false);
      }
    };

    loadD3();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !nodes.length || !d3 || loading) return;

    drawClusterTopology();
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, dimensions, selectedNamespace, showResourceUsage, d3, loading]);

  const drawClusterTopology = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Filter nodes by namespace if selected
    const filteredNodes = selectedNamespace 
      ? nodes.filter(n => n.namespace === selectedNamespace || n.type === 'cluster')
      : nodes;

    // Group nodes by type for hierarchical layout
    const nodesByType = d3.group(filteredNodes, d => d.type);
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create hierarchical layout
    const hierarchy = createHierarchicalLayout(filteredNodes, innerWidth, innerHeight);

    // Apply hierarchical positions to nodes
    hierarchy.nodes.forEach(node => {
      node.x = node.x || Math.random() * innerWidth;
      node.y = node.y || Math.random() * innerHeight;
    });

    // Create simulation with gentle forces to maintain hierarchy
    simulationRef.current = d3.forceSimulation(hierarchy.nodes as any)
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeSize(d) + 15))
      .force('x', d3.forceX(d => d.x).strength(0.5))
      .force('y', d3.forceY(d => d.y).strength(0.5));

    // Draw namespace boundaries
    drawNamespaceBoundaries(g, hierarchy.namespaces, innerWidth, innerHeight);

    // Create node groups
    const nodeGroups = g.selectAll('.cluster-node')
      .data(hierarchy.nodes)
      .enter().append('g')
      .attr('class', 'cluster-node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d) => onNodeSelect(d))
      .on('mouseover', (event, d) => showNodeTooltip(event, d))
      .on('mouseout', () => d3.selectAll('.cluster-tooltip').remove());

    // Add node circles with dynamic sizing
    nodeGroups.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => getNodeStroke(d))
      .attr('stroke-width', d => d.status === 'failed' ? 3 : 2)
      .attr('stroke-dasharray', d => d.status === 'pending' ? '5,5' : null);

    // Add node icons
    nodeGroups.append('text')
      .text(d => getNodeIcon(d.type))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => `${Math.max(12, getNodeSize(d) / 2)}px`)
      .style('fill', 'white')
      .style('pointer-events', 'none');

    // Add node labels
    nodeGroups.append('text')
      .text(d => truncateText(d.name, 15))
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeSize(d) + 15)
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .style('pointer-events', 'none');

    // Add resource usage indicators
    if (showResourceUsage) {
      addResourceIndicators(nodeGroups);
    }

    // Add replica status indicators for pods
    addReplicaIndicators(nodeGroups);

    // Update positions on simulation tick
    simulationRef.current.on('tick', () => {
      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(`${clusterName} - Cluster Topology`);

    function dragstarted(event: any, d: any) {
      if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulationRef.current?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const createHierarchicalLayout = (nodes: ClusterNode[], width: number, height: number) => {
    const namespaces = Array.from(new Set(nodes.map(n => n.namespace).filter(Boolean)));
    const nodePositions = new Map();

    // Position nodes hierarchically
    const clusterNodes = nodes.filter(n => n.type === 'cluster');
    const serviceNodes = nodes.filter(n => n.type === 'service');
    const podNodes = nodes.filter(n => n.type === 'pod');
    const otherNodes = nodes.filter(n => !['cluster', 'service', 'pod'].includes(n.type));

    // Arrange clusters at the top
    clusterNodes.forEach((node, i) => {
      nodePositions.set(node.id, {
        x: width / 2,
        y: 80,
        ...node
      });
    });

    // Arrange services in middle layer
    serviceNodes.forEach((node, i) => {
      const angle = (i / serviceNodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.2;
      nodePositions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
        ...node
      });
    });

    // Arrange pods around services
    podNodes.forEach((node, i) => {
      const angle = (i / podNodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      nodePositions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
        ...node
      });
    });

    // Arrange other nodes at the bottom
    otherNodes.forEach((node, i) => {
      nodePositions.set(node.id, {
        x: (width / (otherNodes.length + 1)) * (i + 1),
        y: height - 80,
        ...node
      });
    });

    return {
      nodes: Array.from(nodePositions.values()),
      namespaces
    };
  };

  const drawNamespaceBoundaries = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    namespaces: string[],
    width: number,
    height: number
  ) => {
    if (!selectedNamespace) return;

    // Draw a subtle boundary for the selected namespace
    g.append('rect')
      .attr('x', 20)
      .attr('y', 20)
      .attr('width', width - 40)
      .attr('height', height - 40)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '10,5')
      .attr('opacity', 0.5);

    g.append('text')
      .attr('x', 30)
      .attr('y', 40)
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text(`Namespace: ${selectedNamespace}`);
  };

  const addResourceIndicators = (nodeGroups: d3.Selection<SVGGElement, ClusterNode, SVGGElement, unknown>) => {
    nodeGroups.filter(d => d.resources)
      .each(function(d) {
        const group = d3.select(this);
        const nodeSize = getNodeSize(d);
        
        if (!d.resources) return;

        // CPU usage indicator
        const cpuUsage = d.resources.cpu.usage / d.resources.cpu.limit;
        group.append('rect')
          .attr('x', nodeSize + 5)
          .attr('y', -8)
          .attr('width', 20)
          .attr('height', 4)
          .attr('fill', '#e5e7eb')
          .attr('rx', 2);

        group.append('rect')
          .attr('x', nodeSize + 5)
          .attr('y', -8)
          .attr('width', 20 * Math.min(cpuUsage, 1))
          .attr('height', 4)
          .attr('fill', cpuUsage > 0.8 ? '#dc2626' : cpuUsage > 0.6 ? '#f59e0b' : '#10b981')
          .attr('rx', 2);

        // Memory usage indicator
        const memUsage = d.resources.memory.usage / d.resources.memory.limit;
        group.append('rect')
          .attr('x', nodeSize + 5)
          .attr('y', -2)
          .attr('width', 20)
          .attr('height', 4)
          .attr('fill', '#e5e7eb')
          .attr('rx', 2);

        group.append('rect')
          .attr('x', nodeSize + 5)
          .attr('y', -2)
          .attr('width', 20 * Math.min(memUsage, 1))
          .attr('height', 4)
          .attr('fill', memUsage > 0.8 ? '#dc2626' : memUsage > 0.6 ? '#f59e0b' : '#10b981')
          .attr('rx', 2);

        // Resource labels
        group.append('text')
          .attr('x', nodeSize + 30)
          .attr('y', -4)
          .style('font-size', '9px')
          .style('fill', '#6b7280')
          .text(`CPU: ${(cpuUsage * 100).toFixed(0)}%`);

        group.append('text')
          .attr('x', nodeSize + 30)
          .attr('y', 6)
          .style('font-size', '9px')
          .style('fill', '#6b7280')
          .text(`MEM: ${(memUsage * 100).toFixed(0)}%`);
      });
  };

  const addReplicaIndicators = (nodeGroups: d3.Selection<SVGGElement, ClusterNode, SVGGElement, unknown>) => {
    nodeGroups.filter(d => d.replicas && d.type === 'pod')
      .each(function(d) {
        const group = d3.select(this);
        const nodeSize = getNodeSize(d);
        
        if (!d.replicas) return;

        const { desired, ready, available } = d.replicas;
        
        // Create small circles for replica status
        const replicaRadius = 3;
        const startX = -nodeSize - 10;
        
        for (let i = 0; i < desired; i++) {
          let fillColor = '#e5e7eb'; // Default gray
          
          if (i < available) {
            fillColor = '#10b981'; // Green for available
          } else if (i < ready) {
            fillColor = '#f59e0b'; // Yellow for ready but not available
          }
          
          group.append('circle')
            .attr('cx', startX - (i * (replicaRadius * 2 + 2)))
            .attr('cy', 0)
            .attr('r', replicaRadius)
            .attr('fill', fillColor)
            .attr('stroke', 'white')
            .attr('stroke-width', 1);
        }
      });
  };

  const showNodeTooltip = (event: MouseEvent, d: ClusterNode) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'cluster-tooltip')
      .style('opacity', 0);

    tooltip.transition().duration(200).style('opacity', 1);

    let content = `
      <div class="tooltip-header">
        <strong>${d.name}</strong>
        <span class="tooltip-type">${d.type}</span>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span class="tooltip-label">Status:</span>
          <span class="tooltip-value status-${d.status}">${d.status}</span>
        </div>
    `;

    if (d.namespace) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Namespace:</span>
          <span class="tooltip-value">${d.namespace}</span>
        </div>
      `;
    }

    if (d.resources) {
      const cpuUsage = ((d.resources.cpu.usage / d.resources.cpu.limit) * 100).toFixed(1);
      const memUsage = ((d.resources.memory.usage / d.resources.memory.limit) * 100).toFixed(1);
      
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">CPU Usage:</span>
          <span class="tooltip-value">${cpuUsage}%</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Memory Usage:</span>
          <span class="tooltip-value">${memUsage}%</span>
        </div>
      `;
    }

    if (d.replicas) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Replicas:</span>
          <span class="tooltip-value">${d.replicas.available}/${d.replicas.desired}</span>
        </div>
      `;
    }

    if (d.metadata?.region) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Region:</span>
          <span class="tooltip-value">${d.metadata.region}</span>
        </div>
      `;
    }

    content += '</div>';

    tooltip.html(content)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const getNodeSize = (node: ClusterNode): number => {
    const baseSizes = {
      cluster: 40,
      namespace: 35,
      service: 25,
      pod: 20,
      ingress: 30,
      volume: 18
    };
    return baseSizes[node.type] || 20;
  };

  const getNodeColor = (node: ClusterNode): string => {
    const colors = {
      cluster: '#3b82f6',
      namespace: '#8b5cf6',
      service: '#10b981',
      pod: '#06b6d4',
      ingress: '#f59e0b',
      volume: '#ec4899'
    };
    
    if (node.status === 'failed') return '#dc2626';
    if (node.status === 'warning') return '#f59e0b';
    
    return colors[node.type] || '#6b7280';
  };

  const getNodeStroke = (node: ClusterNode): string => {
    if (node.status === 'failed') return '#b91c1c';
    if (node.status === 'warning') return '#d97706';
    return 'white';
  };

  const getNodeIcon = (type: string): string => {
    const icons = {
      cluster: '⚡',
      namespace: '📁',
      service: '⚙️',
      pod: '📦',
      ingress: '🚪',
      volume: '💾'
    };
    return icons[type] || '🔧';
  };

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="cluster-topology-container">
        <div className="topology-loading">
          <div className="topology-loading-spinner"></div>
          Loading D3.js visualization...
        </div>
      </div>
    );
  }

  if (!d3) {
    return (
      <div className="cluster-topology-container">
        <div className="topology-loading">
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            ⚠️ D3.js visualization unavailable
            <br />
            <small>Unable to load D3.js library</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cluster-topology-container">
      <svg 
        ref={svgRef} 
        className="cluster-topology-svg"
        width="100%" 
        height="100%"
      />
    </div>
  );
};

export default ClusterTopology;