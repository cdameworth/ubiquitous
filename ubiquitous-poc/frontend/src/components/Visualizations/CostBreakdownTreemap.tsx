import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './CostBreakdownTreemap.css';

interface CostItem {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'network' | 'database' | 'other';
  service: string;
  cost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  children?: CostItem[];
  region?: string;
  instanceType?: string;
  optimizable?: boolean;
  potentialSavings?: number;
}

interface CostBreakdownTreemapProps {
  data: CostItem[];
  onItemSelect: (item: CostItem) => void;
  selectedTimeRange: '7d' | '30d' | '90d';
  className?: string;
}

const CostBreakdownTreemap: React.FC<CostBreakdownTreemapProps> = ({
  data,
  onItemSelect,
  selectedTimeRange,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredItem, setHoveredItem] = useState<CostItem | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(600, rect.height - 10) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    drawTreemap();
  }, [data, dimensions, selectedTimeRange]);

  const drawTreemap = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create hierarchy from flat data
    const hierarchyData = {
      name: 'AWS Costs',
      children: data
    };

    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.cost || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3.treemap<CostItem>()
      .size([innerWidth, innerHeight])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true);

    treemap(root);

    // Create container group
    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale for categories
    const categoryColors = {
      compute: '#3b82f6',
      storage: '#10b981',
      network: '#f59e0b',
      database: '#8b5cf6',
      other: '#6b7280'
    };

    // Create treemap rectangles
    const leaves = container.selectAll('.treemap-item')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'treemap-item')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    leaves.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => {
        const category = d.data.category || 'other';
        return categoryColors[category] || categoryColors.other;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => handleMouseEnter(event, d.data))
      .on('mousemove', (event) => handleMouseMove(event))
      .on('mouseleave', handleMouseLeave)
      .on('click', (event, d) => onItemSelect(d.data));

    // Add optimization indicators
    leaves.filter(d => d.data.optimizable)
      .append('circle')
      .attr('r', 6)
      .attr('cx', d => (d.x1 - d.x0) - 12)
      .attr('cy', 12)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .append('title')
      .text(d => `Optimization available: $${(d.data.potentialSavings || 0).toLocaleString()} potential savings`);

    // Add trend indicators
    leaves.append('polygon')
      .attr('points', d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const size = Math.min(width, height) * 0.08;
        const x = width - size - 4;
        const y = 4;
        
        if (d.data.trend === 'increasing') {
          return `${x},${y + size} ${x + size/2},${y} ${x + size},${y + size}`;
        } else if (d.data.trend === 'decreasing') {
          return `${x},${y} ${x + size/2},${y + size} ${x + size},${y}`;
        } else {
          return `${x},${y + size/2} ${x + size},${y + size/2}`;
        }
      })
      .attr('fill', d => {
        switch (d.data.trend) {
          case 'increasing': return '#ef4444';
          case 'decreasing': return '#10b981';
          default: return '#6b7280';
        }
      })
      .attr('opacity', 0.9);

    // Add text labels
    leaves.append('text')
      .attr('x', 6)
      .attr('y', 16)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        const area = width * height;
        if (area > 5000) return '12px';
        if (area > 2000) return '10px';
        if (area > 1000) return '9px';
        return '8px';
      })
      .attr('font-weight', '600')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text(d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        
        // Show text for smaller rectangles too
        if (width < 50 || height < 20) return '';
        
        // More generous character calculation
        const maxLength = Math.floor(width / 6.5);
        
        // Extract service name from full name for better readability
        const serviceName = d.data.service || d.data.name.split(' ')[0];
        
        if (serviceName.length > maxLength) {
          return serviceName.substring(0, maxLength - 1);
        }
        return serviceName;
      });

    // Add cost labels
    leaves.append('text')
      .attr('x', 6)
      .attr('y', d => {
        const height = d.y1 - d.y0;
        return Math.min(32, height - 8);
      })
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
      .attr('pointer-events', 'none')
      .text(d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        if (width < 60 || height < 40) return '';
        return `$${(d.data.cost / 1000).toFixed(0)}K`;
      });

    // Add service type labels (environment info)
    leaves.append('text')
      .attr('x', 6)
      .attr('y', d => {
        const height = d.y1 - d.y0;
        return Math.min(46, height - 8);
      })
      .attr('font-family', 'system-ui, sans-serif')
      .attr('font-size', '8px')
      .attr('font-weight', '400')
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
      .attr('pointer-events', 'none')
      .text(d => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        if (width < 60 || height < 45) return '';
        
        // Show environment for context
        const envMatch = d.data.name.match(/\((.*?)\)/);
        return envMatch ? envMatch[1] : d.data.region || '';
      });
  };

  const handleMouseEnter = (event: MouseEvent, item: CostItem) => {
    setHoveredItem(item);
    setTooltip({ 
      x: event.clientX, 
      y: event.clientY, 
      visible: true 
    });
  };

  const handleMouseMove = (event: MouseEvent) => {
    setTooltip(prev => ({ 
      ...prev, 
      x: event.clientX, 
      y: event.clientY 
    }));
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className={`cost-breakdown-treemap ${className}`}>
      <div className="treemap-controls">
        <div className="treemap-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Compute</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span>Database</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
            <span>Storage</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Network</span>
          </div>
          <div className="optimization-indicator">
            <div className="optimization-dot"></div>
            <span>Optimization Available</span>
          </div>
        </div>
      </div>
      
      <svg
        ref={svgRef}
        className="treemap-svg"
        width={dimensions.width}
        height={dimensions.height}
      />

      {tooltip.visible && hoveredItem && (
        <div 
          className="treemap-tooltip"
          style={{ 
            left: tooltip.x + 10, 
            top: tooltip.y - 10,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="tooltip-header">
            <strong>{hoveredItem.name}</strong>
            <span className="tooltip-service">{hoveredItem.service}</span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">Monthly Cost:</span>
              <span className="tooltip-value">{formatCurrency(hoveredItem.cost)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Trend:</span>
              <span className={`tooltip-value trend-${hoveredItem.trend}`}>
                {getTrendIcon(hoveredItem.trend)} {hoveredItem.trendPercentage}%
              </span>
            </div>
            {hoveredItem.region && (
              <div className="tooltip-row">
                <span className="tooltip-label">Region:</span>
                <span className="tooltip-value">{hoveredItem.region}</span>
              </div>
            )}
            {hoveredItem.instanceType && (
              <div className="tooltip-row">
                <span className="tooltip-label">Type:</span>
                <span className="tooltip-value">{hoveredItem.instanceType}</span>
              </div>
            )}
            {hoveredItem.optimizable && hoveredItem.potentialSavings && (
              <div className="tooltip-row optimization-row">
                <span className="tooltip-label">Potential Savings:</span>
                <span className="tooltip-value savings-value">
                  {formatCurrency(hoveredItem.potentialSavings)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostBreakdownTreemap;