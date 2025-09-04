import React, { useEffect, useRef, useState } from 'react';
import './NetworkTopology.css';

interface NetworkNode {
  id: string;
  name: string;
  type: 'cluster' | 'service' | 'database' | 'gateway' | 'loadbalancer' | 'vpc';
  status: 'healthy' | 'warning' | 'critical';
  region?: string;
  cost?: number;
  metrics?: {
    cpu: number;
    memory: number;
    latency: number;
    connections: number;
  };
  cluster?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  type: 'api_call' | 'database_query' | 'vpc_connection' | 'load_balance';
  latency: number;
  bandwidth: number;
  packetLoss: number;
  requestRate: number;
}

interface NetworkTopologyProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeSelect: (node: NetworkNode) => void;
  onLinkSelect: (link: NetworkLink) => void;
  selectedCluster?: string;
  highlightPath?: string[];
}

const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  nodes,
  links,
  onNodeSelect,
  onLinkSelect,
  selectedCluster,
  highlightPath = []
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
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

    drawTopology();
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, links, dimensions, selectedCluster, highlightPath, d3, loading]);

  const drawTopology = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group for zooming
    const g = svg.append('g');

    // Filter nodes and links based on selected cluster
    const filteredNodes = selectedCluster 
      ? nodes.filter(n => n.cluster === selectedCluster || n.type === 'vpc')
      : nodes;
    
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(l => 
      nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
    );

    // Initialize node positions at center - all start exactly at center
    filteredNodes.forEach((node: any) => {
      node.x = width / 2;
      node.y = height / 2;
      // Clear any fixed positions
      delete node.fx;
      delete node.fy;
    });

    // Create simulation with very constrained forces
    simulationRef.current = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredLinks as any)
        .id((d: any) => d.id)
        .distance(60) // Shorter links
        .strength(0.3) // Weaker links
      )
      .force('charge', d3.forceManyBody().strength(-50)) // Very weak repulsion
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.8)) // Strong centering
      .force('collision', d3.forceCollide().radius(40)) // User specified collision radius
      .force('x', d3.forceX(width / 2).strength(0.8)) // Very strong X constraint
      .force('y', d3.forceY(height / 2).strength(0.8)) // Very strong Y constraint
      .alphaTarget(0.01) // Almost static
      .alphaDecay(0.1); // Fast settling

    // Create gradients for links
    const defs = svg.append('defs');
    
    // Create gradient for each link type
    const linkTypes = ['api_call', 'database_query', 'vpc_connection', 'load_balance'];
    linkTypes.forEach(type => {
      const gradient = defs.append('linearGradient')
        .attr('id', `link-gradient-${type}`)
        .attr('gradientUnits', 'userSpaceOnUse');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', getLinkColor(type))
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', getLinkColor(type))
        .attr('stop-opacity', 0.3);
    });

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', (d: NetworkLink) => `url(#link-gradient-${d.type})`)
      .attr('stroke-width', (d: NetworkLink) => {
        const base = Math.log(d.requestRate + 1) * 2;
        return Math.max(1, Math.min(8, base));
      })
      .attr('stroke-dasharray', (d: NetworkLink) => 
        d.packetLoss > 0.05 ? '5,5' : null
      )
      .style('cursor', 'pointer')
      .on('click', (event: any, d: NetworkLink) => {
        event.stopPropagation();
        onLinkSelect(d);
      })
      .on('mouseover', function(event: any, d: NetworkLink) {
        // Show link tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'network-tooltip')
          .style('opacity', 0);

        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <strong>${d.type.replace('_', ' ').toUpperCase()}</strong><br/>
          Latency: ${d.latency}ms<br/>
          Bandwidth: ${(d.bandwidth / 1000).toFixed(1)}GB/s<br/>
          Requests: ${d.requestRate}/sec<br/>
          Packet Loss: ${(d.packetLoss * 100).toFixed(2)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.network-tooltip').remove();
      });

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event: any, d: NetworkNode) => {
        event.stopPropagation();
        onNodeSelect(d);
      })
      .on('mouseover', function(event: any, d: NetworkNode) {
        // Show node tooltip with metrics
        const tooltip = d3.select('body').append('div')
          .attr('class', 'network-tooltip')
          .style('opacity', 0);

        tooltip.transition().duration(200).style('opacity', 1);
        
        let tooltipContent = `<strong>${d.name}</strong><br/>Type: ${d.type}<br/>Status: ${d.status}`;
        
        if (d.metrics) {
          tooltipContent += `<br/>CPU: ${d.metrics.cpu}%<br/>Memory: ${d.metrics.memory}%<br/>Latency: ${d.metrics.latency}ms<br/>Connections: ${d.metrics.connections}`;
        }
        
        if (d.cost) {
          tooltipContent += `<br/>Cost: $${d.cost.toLocaleString()}/month`;
        }
        
        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.selectAll('.network-tooltip').remove();
      });

    // Add node circles with size based on importance
    node.append('circle')
      .attr('r', (d: NetworkNode) => {
        const baseSize = 20;
        const typeMultiplier = {
          'vpc': 2,
          'cluster': 1.5,
          'loadbalancer': 1.3,
          'service': 1,
          'database': 1.2,
          'gateway': 1.1
        }[d.type] || 1;
        
        return baseSize * typeMultiplier;
      })
      .attr('fill', (d: NetworkNode) => {
        if (highlightPath.includes(d.id)) {
          return '#ffd700'; // Gold for highlighted path
        }
        return getNodeColor(d);
      })
      .attr('stroke', (d: NetworkNode) => {
        if (d.status === 'critical') return '#dc2626';
        if (d.status === 'warning') return '#f59e0b';
        return '#10b981';
      })
      .attr('stroke-width', (d: NetworkNode) => {
        if (highlightPath.includes(d.id)) return 4;
        if (d.status !== 'healthy') return 3;
        return 2;
      });

    // Add node icons
    node.append('text')
      .text((d: NetworkNode) => getNodeIcon(d.type))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '16px')
      .style('fill', 'white')
      .style('pointer-events', 'none');

    // Add node labels
    node.append('text')
      .text((d: NetworkNode) => truncateText(d.name, 12))
      .attr('text-anchor', 'middle')
      .attr('dy', '35px')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', '#374151')
      .style('pointer-events', 'none');

    // Add CPU usage indicators for services
    node.filter((d: NetworkNode) => d.metrics)
      .append('circle')
      .attr('r', 12)
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('fill', (d: NetworkNode) => {
        const cpu = d.metrics?.cpu || 0;
        if (cpu > 90) return '#dc2626';
        if (cpu > 70) return '#f59e0b';
        return '#10b981';
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Add CPU percentage text
    node.filter((d: NetworkNode) => d.metrics)
      .append('text')
      .text((d: NetworkNode) => `${d.metrics?.cpu || 0}%`)
      .attr('x', 20)
      .attr('y', -16)
      .attr('text-anchor', 'middle')
      .style('font-size', '8px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulationRef.current.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => {
        const x = isNaN(d.x) ? width / 2 : d.x;
        const y = isNaN(d.y) ? height / 2 : d.y;
        return `translate(${x},${y})`;
      });
    });

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

  const getNodeColor = (node: NetworkNode): string => {
    const colors = {
      'vpc': '#8b5cf6',
      'cluster': '#3b82f6',
      'service': '#10b981',
      'database': '#f59e0b',
      'gateway': '#06b6d4',
      'loadbalancer': '#ec4899'
    };
    return colors[node.type] || '#6b7280';
  };

  const getNodeIcon = (type: string): string => {
    const icons = {
      'vpc': '🌐',
      'cluster': '⚡',
      'service': '⚙️',
      'database': '🗄️',
      'gateway': '🚪',
      'loadbalancer': '⚖️'
    };
    return icons[type] || '📦';
  };

  const getLinkColor = (type: string): string => {
    const colors = {
      'api_call': '#3b82f6',
      'database_query': '#f59e0b',
      'vpc_connection': '#8b5cf6',
      'load_balance': '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="network-topology-container">
        <div className="topology-loading">
          <div className="topology-loading-spinner"></div>
          Loading D3.js visualization...
        </div>
      </div>
    );
  }

  if (!d3) {
    return (
      <div className="network-topology-container">
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
    <div className="network-topology-container">
      <svg 
        ref={svgRef} 
        className="network-topology-svg"
        width="100%" 
        height="100%"
      />
    </div>
  );
};

export default NetworkTopology;