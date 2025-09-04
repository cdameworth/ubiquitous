import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './ServiceDependencyMap.css';

interface ServiceNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'external_api' | 'queue' | 'cache' | 'storage';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  status: 'healthy' | 'degraded' | 'down';
  region?: string;
  cluster?: string;
  metrics?: {
    latency: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
  costs?: {
    monthly: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface ServiceDependency {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'data_flow';
  strength: number; // 1-10 scale
  latency: number;
  errorRate: number;
  callVolume: number;
  isCircular?: boolean;
}

interface ServiceDependencyMapProps {
  services: ServiceNode[];
  dependencies: ServiceDependency[];
  onServiceSelect: (service: ServiceNode) => void;
  onDependencySelect: (dependency: ServiceDependency) => void;
  selectedService?: string;
  showCriticalPath?: boolean;
  impactAnalysisMode?: boolean;
}

const ServiceDependencyMap: React.FC<ServiceDependencyMapProps> = ({
  services,
  dependencies,
  onServiceSelect,
  onDependencySelect,
  selectedService,
  showCriticalPath = false,
  impactAnalysisMode = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const simulationRef = useRef<d3.Simulation<ServiceNode, ServiceDependency> | null>(null);

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
    if (showCriticalPath) {
      const path = calculateCriticalPath(services, dependencies);
      setCriticalPath(path);
    } else {
      setCriticalPath([]);
    }
  }, [services, dependencies, showCriticalPath]);

  useEffect(() => {
    if (!svgRef.current || !services.length) return;

    drawServiceMap();
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [services, dependencies, dimensions, selectedService, criticalPath, impactAnalysisMode]);

  const calculateCriticalPath = (nodes: ServiceNode[], links: ServiceDependency[]): string[] => {
    // Find the path through highest criticality services
    const criticalServices = nodes.filter(n => n.criticality === 'critical').map(n => n.id);
    const highServices = nodes.filter(n => n.criticality === 'high').map(n => n.id);
    
    // Simple path calculation - in reality this would be more sophisticated
    return [...criticalServices, ...highServices].slice(0, 5);
  };

  const drawServiceMap = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Validate dimensions before proceeding
    if (width <= 0 || height <= 0 || innerWidth <= 0 || innerHeight <= 0) {
      console.log('Invalid dimensions, skipping render:', { width, height, innerWidth, innerHeight });
      return;
    }

    // Validate data before proceeding
    if (!services || services.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#6b7280')
        .text('No service data available');
      return;
    }

    console.log('Drawing service map with:', { services, dependencies });

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Add click to recenter functionality
    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        // Reset zoom to center view
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      }
    });

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Initialize node positions with wide distribution to prevent clustering
    services.forEach((node: any, i: number) => {
      // Use larger radius for better initial spread
      const angle = (i / services.length) * 2 * Math.PI;
      const radius = Math.min(innerWidth, innerHeight) * 0.25; // 25% of viewport for initial spread
      node.x = innerWidth / 2 + Math.cos(angle) * radius;
      node.y = innerHeight / 2 + Math.sin(angle) * radius;
      console.log(`Initial position for ${node.name}: x=${node.x}, y=${node.y} (center: ${innerWidth/2}, ${innerHeight/2})`);
      // Clear any previous fixed positions
      delete node.fx;
      delete node.fy;
    });

    // Validate dependencies before creating links
    const validDependencies = dependencies.filter(dep => {
      // Handle both string IDs and potential object references
      const sourceId = typeof dep.source === 'object' ? (dep.source as any).id : dep.source;
      const targetId = typeof dep.target === 'object' ? (dep.target as any).id : dep.target;
      
      const hasSource = services.some(s => s.id === sourceId);
      const hasTarget = services.some(s => s.id === targetId);
      
      if (!hasSource || !hasTarget) {
        console.warn('Invalid dependency found:', {
          dep, 
          sourceId, 
          targetId, 
          availableIds: services.map(s => s.id)
        });
      }
      return hasSource && hasTarget;
    });

    console.log('Valid dependencies after filtering:', validDependencies.length, validDependencies);
    console.log('Drawing area dimensions:', { width, height, innerWidth, innerHeight });

    // Create force simulation with maximum spacing for clear node separation
    simulationRef.current = d3.forceSimulation(services as any)
      .force('link', d3.forceLink(validDependencies as any)
        .id((d: any) => d.id)
        .distance(180) // Much longer link distance for maximum spread
        .strength(0.2) // Very weak link strength to allow maximum freedom
      )
      .force('charge', d3.forceManyBody().strength(-800)) // Very strong repulsion for maximum separation
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2).strength(0.05)) // Very weak centering
      .force('collision', d3.forceCollide().radius(80)) // Large collision radius to prevent overlap
      .force('x', d3.forceX(innerWidth / 2).strength(0.02)) // Minimal X constraint
      .force('y', d3.forceY(innerHeight / 2).strength(0.02)) // Minimal Y constraint
      .alphaTarget(0) // Let it settle naturally
      .alphaDecay(0.008); // Slower settling for maximum distribution

    // If no dependencies, manually position nodes in a grid to prevent clustering
    if (validDependencies.length === 0) {
      console.log('No dependencies found, using manual grid positioning');
      const cols = Math.ceil(Math.sqrt(services.length));
      const rows = Math.ceil(services.length / cols);
      
      // Add padding to prevent nodes from being too close to edges
      const padding = 80;
      const spacingX = (innerWidth - 2 * padding) / Math.max(1, cols - 1);
      const spacingY = (innerHeight - 2 * padding) / Math.max(1, rows - 1);
      
      services.forEach((node: any, i: number) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        node.x = padding + spacingX * col;
        node.y = padding + spacingY * row;
        // Fix nodes in position to prevent force simulation from moving them
        node.fx = node.x;
        node.fy = node.y;
        console.log(`Node ${node.name} positioned at (${node.x}, ${node.y})`);
      });
      // Stop simulation since nodes are manually positioned
      simulationRef.current.stop();
    }

    // Create arrow markers
    createArrowMarkers(svg);

    // Restart simulation with proper alpha to ensure nodes move
    setTimeout(() => {
      if (simulationRef.current) {
        simulationRef.current.alpha(1).restart();
      }
    }, 100);

    // Draw dependencies (links) using validated dependencies
    const links = g.append('g')
      .selectAll('.dependency-link')
      .data(validDependencies)
      .enter().append('g')
      .attr('class', 'dependency-link');

    // Draw link paths with curves for better visibility
    const linkPaths = links.append('path')
      .attr('fill', 'none')
      .attr('stroke', d => getDependencyColor(d))
      .attr('stroke-width', d => Math.max(2, Math.log(d.callVolume + 1) * 2))
      .attr('stroke-opacity', d => d.errorRate > 0.05 ? 0.4 : 0.7)
      .attr('stroke-dasharray', d => d.type === 'async' ? '5,5' : null)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onDependencySelect(d);
      })
      .on('mouseover', (event, d) => showDependencyTooltip(event, d))
      .on('mouseout', () => d3.selectAll('.dependency-tooltip').remove());

    // Add dependency labels for high-strength connections
    const linkLabels = links.filter(d => d.strength > 7)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text(d => `${d.callVolume}/s`);

    // Create service nodes
    const nodes = g.append('g')
      .selectAll('.service-node')
      .data(services)
      .enter().append('g')
      .attr('class', 'service-node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        onServiceSelect(d);
      })
      .on('mouseover', (event, d) => showServiceTooltip(event, d))
      .on('mouseout', () => d3.selectAll('.service-tooltip').remove());

    // Add node circles with size based on criticality
    nodes.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => {
        if (impactAnalysisMode && selectedService) {
          const impactLevel = getImpactLevel(d.id, selectedService, dependencies);
          return getImpactColor(impactLevel);
        }
        if (criticalPath.includes(d.id)) {
          return '#fbbf24'; // Gold for critical path
        }
        return getServiceColor(d);
      })
      .attr('stroke', d => {
        if (d.id === selectedService) return '#1f2937';
        if (d.status === 'down') return '#dc2626';
        if (d.status === 'degraded') return '#f59e0b';
        return 'white';
      })
      .attr('stroke-width', d => {
        if (d.id === selectedService) return 4;
        if (d.status !== 'healthy') return 3;
        return 2;
      })
      .attr('filter', d => d.status === 'down' ? 'url(#drop-shadow)' : null);

    // Add service icons
    nodes.append('text')
      .text(d => getServiceIcon(d.type))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', d => `${Math.max(14, getNodeSize(d) / 2.5)}px`)
      .style('fill', 'white')
      .style('pointer-events', 'none');

    // Add service labels
    nodes.append('text')
      .text(d => truncateText(d.name, 15))
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeSize(d) + 20)
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .style('pointer-events', 'none');

    // Add criticality indicators
    nodes.filter(d => d.criticality === 'critical')
      .append('circle')
      .attr('r', 6)
      .attr('cx', d => getNodeSize(d) - 10)
      .attr('cy', d => -getNodeSize(d) + 10)
      .attr('fill', '#dc2626')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .append('title')
      .text('Critical Service');

    // Add status indicators
    addStatusIndicators(nodes);

    // Add metrics indicators
    if (!impactAnalysisMode) {
      addMetricsIndicators(nodes);
    }

    // Update positions on simulation tick
    simulationRef.current.on('tick', () => {
      linkPaths.attr('d', d => {
        const sourceX = (d.source as any).x || innerWidth / 2;
        const sourceY = (d.source as any).y || innerHeight / 2;
        const targetX = (d.target as any).x || innerWidth / 2;
        const targetY = (d.target as any).y || innerHeight / 2;
        
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3; // Curve factor
        
        return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      });

      linkLabels.attr('transform', d => {
        const sourceX = (d.source as any).x || innerWidth / 2;
        const sourceY = (d.source as any).y || innerHeight / 2;
        const targetX = (d.target as any).x || innerWidth / 2;
        const targetY = (d.target as any).y || innerHeight / 2;
        
        const x = (sourceX + targetX) / 2;
        const y = (sourceY + targetY) / 2;
        return `translate(${x},${y})`;
      });

      nodes.attr('transform', (d: any) => {
        // Allow more space for nodes to spread out, with fallback to center if coordinates are invalid
        const nodeRadius = 30;
        const x = isNaN(d.x) ? innerWidth / 2 : Math.max(nodeRadius, Math.min(innerWidth - nodeRadius, d.x));
        const y = isNaN(d.y) ? innerHeight / 2 : Math.max(nodeRadius, Math.min(innerHeight - nodeRadius, d.y));
        return `translate(${x},${y})`;
      });
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text('Service Dependency Map');

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

  const createArrowMarkers = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');

    // Create different arrow markers for different dependency types
    const dependencyTypes = ['sync', 'async', 'data_flow'];
    
    dependencyTypes.forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', getDependencyColor({ type } as ServiceDependency));
    });

    // Create drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');

    filter.append('feDropShadow')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-opacity', 0.3);
  };

  const addStatusIndicators = (nodes: d3.Selection<SVGGElement, ServiceNode, SVGGElement, unknown>) => {
    nodes.each(function(d) {
      const group = d3.select(this);
      const nodeSize = getNodeSize(d);
      
      // Add availability indicator
      if (d.metrics?.availability !== undefined) {
        const availability = d.metrics.availability;
        const indicatorColor = availability >= 99 ? '#10b981' : 
                               availability >= 95 ? '#f59e0b' : '#dc2626';
        
        group.append('rect')
          .attr('x', nodeSize - 15)
          .attr('y', nodeSize - 10)
          .attr('width', 12)
          .attr('height', 6)
          .attr('fill', indicatorColor)
          .attr('rx', 3)
          .append('title')
          .text(`Availability: ${availability}%`);
      }
    });
  };

  const addMetricsIndicators = (nodes: d3.Selection<SVGGElement, ServiceNode, SVGGElement, unknown>) => {
    nodes.filter(d => d.metrics)
      .each(function(d) {
        const group = d3.select(this);
        const nodeSize = getNodeSize(d);
        
        if (!d.metrics) return;

        // Error rate indicator (red circle if high)
        if (d.metrics.errorRate > 0.05) {
          group.append('circle')
            .attr('cx', -nodeSize + 10)
            .attr('cy', -nodeSize + 10)
            .attr('r', 5)
            .attr('fill', '#dc2626')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .append('title')
            .text(`Error Rate: ${(d.metrics.errorRate * 100).toFixed(2)}%`);
        }

        // Latency indicator (gauge-like arc)
        const latencyLevel = Math.min(d.metrics.latency / 100, 1); // Normalize to 0-1
        const arc = d3.arc()
          .innerRadius(nodeSize + 5)
          .outerRadius(nodeSize + 10)
          .startAngle(-Math.PI / 2)
          .endAngle(-Math.PI / 2 + latencyLevel * Math.PI);

        group.append('path')
          .attr('d', arc as any)
          .attr('fill', latencyLevel > 0.7 ? '#dc2626' : latencyLevel > 0.4 ? '#f59e0b' : '#10b981')
          .attr('opacity', 0.8);
      });
  };

  const getImpactLevel = (nodeId: string, selectedId: string, deps: ServiceDependency[]): number => {
    if (nodeId === selectedId) return 3; // Direct impact
    
    // Check if this service depends on the selected service (upstream impact)
    const directDependency = deps.find(d => d.source === nodeId && d.target === selectedId);
    if (directDependency) return 2;
    
    // Check if selected service depends on this service (downstream impact) 
    const affectedBy = deps.find(d => d.source === selectedId && d.target === nodeId);
    if (affectedBy) return 2;
    
    // Check for indirect dependencies (2 hops)
    const indirectUp = deps.some(d1 => 
      d1.source === nodeId && deps.some(d2 => d2.source === d1.target && d2.target === selectedId)
    );
    const indirectDown = deps.some(d1 => 
      d1.source === selectedId && deps.some(d2 => d2.source === d1.target && d2.target === nodeId)
    );
    
    if (indirectUp || indirectDown) return 1;
    
    return 0; // No impact
  };

  const getImpactColor = (level: number): string => {
    const colors = ['#e5e7eb', '#fbbf24', '#f59e0b', '#dc2626'];
    return colors[level] || '#e5e7eb';
  };

  const showServiceTooltip = (event: MouseEvent, d: ServiceNode) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'service-tooltip')
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
        <div class="tooltip-row">
          <span class="tooltip-label">Criticality:</span>
          <span class="tooltip-value criticality-${d.criticality}">${d.criticality}</span>
        </div>
    `;

    if (d.metrics) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Latency:</span>
          <span class="tooltip-value">${d.metrics.latency}ms</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Error Rate:</span>
          <span class="tooltip-value">${(d.metrics.errorRate * 100).toFixed(2)}%</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Throughput:</span>
          <span class="tooltip-value">${d.metrics.throughput}/s</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Availability:</span>
          <span class="tooltip-value">${d.metrics.availability}%</span>
        </div>
      `;
    }

    if (d.costs) {
      content += `
        <div class="tooltip-row">
          <span class="tooltip-label">Monthly Cost:</span>
          <span class="tooltip-value">$${d.costs.monthly.toLocaleString()}</span>
        </div>
      `;
    }

    content += '</div>';

    tooltip.html(content)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const showDependencyTooltip = (event: MouseEvent, d: ServiceDependency) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'dependency-tooltip')
      .style('opacity', 0);

    tooltip.transition().duration(200).style('opacity', 1);

    const content = `
      <div class="tooltip-header">
        <strong>Dependency</strong>
        <span class="tooltip-type">${d.type}</span>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span class="tooltip-label">Strength:</span>
          <span class="tooltip-value">${d.strength}/10</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Call Volume:</span>
          <span class="tooltip-value">${d.callVolume}/s</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Latency:</span>
          <span class="tooltip-value">${d.latency}ms</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Error Rate:</span>
          <span class="tooltip-value">${(d.errorRate * 100).toFixed(2)}%</span>
        </div>
      </div>
    `;

    tooltip.html(content)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  };

  const getNodeSize = (service: ServiceNode): number => {
    const baseSizes = {
      service: 30,
      database: 35,
      external_api: 25,
      queue: 28,
      cache: 25,
      storage: 32
    };
    
    const criticalityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
      critical: 1.4
    };
    
    return (baseSizes[service.type] || 30) * criticalityMultiplier[service.criticality];
  };

  const getServiceColor = (service: ServiceNode): string => {
    const colors = {
      service: '#3b82f6',
      database: '#f59e0b',
      external_api: '#8b5cf6',
      queue: '#10b981',
      cache: '#06b6d4',
      storage: '#ec4899'
    };
    return colors[service.type] || '#6b7280';
  };

  const getDependencyColor = (dependency: ServiceDependency): string => {
    const colors = {
      sync: '#3b82f6',
      async: '#10b981',
      data_flow: '#f59e0b'
    };
    return colors[dependency.type] || '#6b7280';
  };

  const getServiceIcon = (type: string): string => {
    const icons = {
      service: '⚙️',
      database: '🗄️',
      external_api: '🌐',
      queue: '📬',
      cache: '⚡',
      storage: '💾'
    };
    return icons[type] || '🔧';
  };

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="service-dependency-map-container">
      <svg 
        ref={svgRef} 
        className="service-dependency-svg"
        width="100%" 
        height="100%"
      />
    </div>
  );
};

export default ServiceDependencyMap;