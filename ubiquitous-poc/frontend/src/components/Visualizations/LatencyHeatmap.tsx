import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './LatencyHeatmap.css';

interface LatencyDataPoint {
  service: string;
  hour: number;
  day: string;
  latency: number;
  requests: number;
  errors: number;
  region?: string;
  cluster?: string;
}

interface LatencyHeatmapProps {
  data: LatencyDataPoint[];
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
  onCellSelect: (dataPoint: LatencyDataPoint) => void;
  selectedService?: string;
}

const LatencyHeatmap: React.FC<LatencyHeatmapProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
  onCellSelect,
  selectedService
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

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
    if (!svgRef.current || !data.length) return;
    drawHeatmap();
  }, [data, dimensions, timeRange, selectedService]);

  const drawHeatmap = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 120, bottom: 60, left: 120 };
    const { width, height } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data based on selected service
    const filteredData = selectedService 
      ? data.filter(d => d.service === selectedService)
      : data;

    if (!filteredData.length) return;

    // Get unique services and time periods
    const services = Array.from(new Set(filteredData.map(d => d.service))).sort();
    const timePeriods = getTimePeriods(timeRange, filteredData);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(timePeriods)
      .range([0, innerWidth])
      .padding(0.02);

    const yScale = d3.scaleBand()
      .domain(services)
      .range([0, innerHeight])
      .padding(0.02);

    // Create color scale with better gradients
    const maxLatency = d3.max(filteredData, d => d.latency) || 100;
    const colorScale = d3.scaleSequential()
      .domain([0, maxLatency])
      .interpolator(d3.interpolateSpectral)
      .range(['#2563eb', '#dc2626']); // Blue to red

    // Create size scale based on request volume
    const maxRequests = d3.max(filteredData, d => d.requests) || 1000;
    const sizeScale = d3.scaleLinear()
      .domain([0, maxRequests])
      .range([0.6, 1]); // Scale factor for cell size

    // Create heatmap cells
    const cells = g.selectAll('.heatmap-cell')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell');

    // Add cell rectangles
    cells.append('rect')
      .attr('x', d => {
        const time = getTimeKey(d, timeRange);
        return xScale(time) || 0;
      })
      .attr('y', d => yScale(d.service) || 0)
      .attr('width', d => {
        const baseWidth = xScale.bandwidth();
        return baseWidth * sizeScale(d.requests);
      })
      .attr('height', d => {
        const baseHeight = yScale.bandwidth();
        return baseHeight * sizeScale(d.requests);
      })
      .attr('fill', d => colorScale(d.latency))
      .attr('stroke', d => d.errors > 0 ? '#dc2626' : 'none')
      .attr('stroke-width', d => d.errors > 0 ? 2 : 0)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onCellSelect(d))
      .on('mouseover', function(event, d) {
        // Highlight cell
        d3.select(this)
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 3);

        // Show tooltip
        showTooltip(event, d);
      })
      .on('mouseout', function(event, d) {
        // Remove highlight
        d3.select(this)
          .attr('stroke', d.errors > 0 ? '#dc2626' : 'none')
          .attr('stroke-width', d.errors > 0 ? 2 : 0);

        // Hide tooltip
        d3.selectAll('.heatmap-tooltip').remove();
      });

    // Add error indicators for cells with errors
    cells.filter(d => d.errors > 0)
      .append('circle')
      .attr('cx', d => {
        const time = getTimeKey(d, timeRange);
        return (xScale(time) || 0) + xScale.bandwidth() - 6;
      })
      .attr('cy', d => (yScale(d.service) || 0) + 6)
      .attr('r', 4)
      .attr('fill', '#dc2626')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none');

    // Add X axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '11px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '11px');

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Service Latency Heatmap - ${timeRange.toUpperCase()}`);

    // Add X axis label
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text(getXAxisLabel(timeRange));

    // Add Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text('Services');

    // Add legend
    createColorLegend(svg, colorScale, maxLatency, width, height, margin);
  };

  const createColorLegend = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    colorScale: d3.ScaleSequential<string, never>,
    maxLatency: number,
    width: number,
    height: number,
    margin: any
  ) => {
    const legendWidth = 20;
    const legendHeight = 200;
    const legendX = width - margin.right + 20;
    const legendY = margin.top;

    const legend = svg.append('g')
      .attr('class', 'color-legend');

    // Create gradient definition
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    // Add gradient stops
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const value = (i / steps) * maxLatency;
      gradient.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', colorScale(value));
    }

    // Add legend rectangle
    legend.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#heatmap-legend-gradient)')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1);

    // Add legend scale
    const legendScale = d3.scaleLinear()
      .domain([0, maxLatency])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}ms`);

    legend.append('g')
      .attr('transform', `translate(${legendX + legendWidth}, ${legendY})`)
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '10px');

    // Add legend title
    legend.append('text')
      .attr('x', legendX + legendWidth / 2)
      .attr('y', legendY - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text('Latency');
  };

  const showTooltip = (event: MouseEvent, d: LatencyDataPoint) => {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0);

    tooltip.transition().duration(200).style('opacity', 1);
    
    const errorRate = d.requests > 0 ? ((d.errors / d.requests) * 100).toFixed(2) : '0';
    
    tooltip.html(`
      <div class="tooltip-header">
        <strong>${d.service}</strong>
        ${d.cluster ? `<span class="tooltip-cluster">${d.cluster}</span>` : ''}
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span class="tooltip-label">Time:</span>
          <span class="tooltip-value">${getTimeKey(d, timeRange)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Latency:</span>
          <span class="tooltip-value">${d.latency.toFixed(1)}ms</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Requests:</span>
          <span class="tooltip-value">${d.requests.toLocaleString()}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Error Rate:</span>
          <span class="tooltip-value ${parseFloat(errorRate) > 1 ? 'error-high' : ''}">${errorRate}%</span>
        </div>
        ${d.region ? `
          <div class="tooltip-row">
            <span class="tooltip-label">Region:</span>
            <span class="tooltip-value">${d.region}</span>
          </div>
        ` : ''}
      </div>
    `)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px');
  };

  const getTimePeriods = (range: '24h' | '7d' | '30d', data: LatencyDataPoint[]): string[] => {
    switch (range) {
      case '24h':
        return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      case '7d':
        return Array.from(new Set(data.map(d => d.day))).sort();
      case '30d':
        return Array.from(new Set(data.map(d => d.day))).sort().slice(-30);
      default:
        return [];
    }
  };

  const getTimeKey = (d: LatencyDataPoint, range: '24h' | '7d' | '30d'): string => {
    switch (range) {
      case '24h':
        return `${d.hour.toString().padStart(2, '0')}:00`;
      case '7d':
      case '30d':
        return d.day;
      default:
        return d.day;
    }
  };

  const getXAxisLabel = (range: '24h' | '7d' | '30d'): string => {
    switch (range) {
      case '24h':
        return 'Hour of Day';
      case '7d':
        return 'Day of Week';
      case '30d':
        return 'Date';
      default:
        return 'Time';
    }
  };

  return (
    <div className="latency-heatmap-container">
      <div className="heatmap-controls">
        <div className="time-range-controls">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              className={`time-range-button ${timeRange === range ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(range)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
        <div className="heatmap-legend-text">
          <span>🔴 High Latency</span>
          <span>🟡 Medium Latency</span> 
          <span>🔵 Low Latency</span>
          <span>⚫ Errors</span>
        </div>
      </div>
      <svg 
        ref={svgRef} 
        className="latency-heatmap-svg"
        width="100%" 
        height="100%"
      />
    </div>
  );
};

export default LatencyHeatmap;