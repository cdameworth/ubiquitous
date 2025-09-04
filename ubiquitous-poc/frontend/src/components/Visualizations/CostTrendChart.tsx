import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './CostTrendChart.css';

interface CostDataPoint {
  date: Date;
  totalCost: number;
  compute: number;
  storage: number;
  network: number;
  database: number;
  other: number;
  forecast?: boolean;
  optimizedCost?: number;
}

interface CostTrendChartProps {
  data: CostDataPoint[];
  selectedServices: string[];
  onServiceToggle: (service: string) => void;
  showForecast?: boolean;
  showOptimization?: boolean;
  className?: string;
}

const CostTrendChart: React.FC<CostTrendChartProps> = ({
  data,
  selectedServices,
  onServiceToggle,
  showForecast = true,
  showOptimization = true,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredPoint, setHoveredPoint] = useState<CostDataPoint | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  const serviceColors = {
    compute: '#3b82f6',
    database: '#8b5cf6', 
    storage: '#10b981',
    network: '#f59e0b',
    other: '#6b7280'
  };

  const services = ['compute', 'database', 'storage', 'network', 'other'];

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(400, rect.height - 40) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;
    drawChart();
  }, [data, dimensions, selectedServices, showForecast, showOptimization]);

  const drawChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 60, bottom: 130, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const maxCost = d3.max(data, d => Math.max(
      d.totalCost, 
      d.optimizedCost || 0,
      ...selectedServices.map(service => d[service as keyof CostDataPoint] as number || 0)
    )) || 0;

    const yScale = d3.scaleLinear()
      .domain([0, maxCost * 1.1])
      .range([innerHeight, 0]);

    // Grid lines
    container.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      );

    container.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      );

    // Line generators
    const line = d3.line<CostDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.totalCost))
      .curve(d3.curveMonotoneX);

    const optimizedLine = d3.line<CostDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.optimizedCost || d.totalCost))
      .curve(d3.curveMonotoneX);

    // Historical and forecast data
    const historicalData = data.filter(d => !d.forecast);
    const forecastData = data.filter(d => d.forecast);
    const lastHistorical = historicalData[historicalData.length - 1];
    const forecastWithTransition = lastHistorical ? [lastHistorical, ...forecastData] : forecastData;

    // Main cost line (historical)
    container.append('path')
      .datum(historicalData)
      .attr('class', 'cost-line historical')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);

    // Forecast line
    if (showForecast && forecastWithTransition.length > 0) {
      container.append('path')
        .datum(forecastWithTransition)
        .attr('class', 'cost-line forecast')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.6);
    }

    // Optimized cost line
    if (showOptimization) {
      container.append('path')
        .datum(data.filter(d => d.optimizedCost !== undefined))
        .attr('class', 'optimized-line')
        .attr('d', optimizedLine)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.8);
    }

    // Service-specific lines
    selectedServices.forEach(service => {
      const serviceLine = d3.line<CostDataPoint>()
        .x(d => xScale(d.date))
        .y(d => yScale(d[service as keyof CostDataPoint] as number || 0))
        .curve(d3.curveMonotoneX);

      container.append('path')
        .datum(historicalData)
        .attr('class', `service-line ${service}`)
        .attr('d', serviceLine)
        .attr('fill', 'none')
        .attr('stroke', serviceColors[service as keyof typeof serviceColors])
        .attr('stroke-width', 2)
        .attr('opacity', 0.7);
    });

    // Data points for interaction
    container.selectAll('.data-point')
      .data(historicalData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.totalCost))
      .attr('r', 4)
      .attr('fill', '#1f2937')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => handleMouseEnter(event, d))
      .on('mousemove', handleMouseMove)
      .on('mouseleave', handleMouseLeave);

    // Forecast points
    if (showForecast) {
      container.selectAll('.forecast-point')
        .data(forecastData)
        .enter()
        .append('circle')
        .attr('class', 'forecast-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.totalCost))
        .attr('r', 3)
        .attr('fill', 'none')
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 2)
        .attr('opacity', 0.6)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => handleMouseEnter(event, d))
        .on('mousemove', handleMouseMove)
        .on('mouseleave', handleMouseLeave);
    }

    // Optimization points
    if (showOptimization) {
      container.selectAll('.optimization-point')
        .data(data.filter(d => d.optimizedCost !== undefined))
        .enter()
        .append('circle')
        .attr('class', 'optimization-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.optimizedCost || 0))
        .attr('r', 3)
        .attr('fill', '#10b981')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);
    }

    // Axes
    container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b %d'))
        .ticks(5)
      );

    container.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .tickFormat(d => `$${(d as number / 1000).toFixed(0)}K`)
      );

    // Axis labels
    container.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 65)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Date');

    container.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .text('Monthly Cost ($)');

    // Savings annotation
    if (showOptimization && data.length > 0) {
      const lastPoint = data[data.length - 1];
      if (lastPoint.optimizedCost && lastPoint.totalCost > lastPoint.optimizedCost) {
        const savings = lastPoint.totalCost - lastPoint.optimizedCost;
        const savingsPercentage = ((savings / lastPoint.totalCost) * 100).toFixed(1);
        
        container.append('text')
          .attr('x', innerWidth - 10)
          .attr('y', 20)
          .attr('text-anchor', 'end')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .style('fill', '#10b981')
          .text(`Potential Savings: $${(savings / 1000).toFixed(0)}K (${savingsPercentage}%)`);
      }
    }
  };

  const handleMouseEnter = (event: MouseEvent, point: CostDataPoint) => {
    setHoveredPoint(point);
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
    setHoveredPoint(null);
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className={`cost-trend-chart ${className}`}>
      <div className="chart-controls">
        <div className="service-toggles">
          {services.map(service => (
            <button
              key={service}
              className={`service-toggle ${selectedServices.includes(service) ? 'active' : ''}`}
              onClick={() => onServiceToggle(service)}
              style={{
                borderColor: selectedServices.includes(service) ? 
                  serviceColors[service as keyof typeof serviceColors] : 
                  '#d1d5db'
              }}
            >
              <div 
                className="service-color"
                style={{ backgroundColor: serviceColors[service as keyof typeof serviceColors] }}
              />
              {service.charAt(0).toUpperCase() + service.slice(1)}
            </button>
          ))}
        </div>
        <div className="chart-options">
          {showForecast && (
            <div className="legend-item">
              <div className="legend-line forecast"></div>
              <span>Forecast</span>
            </div>
          )}
          {showOptimization && (
            <div className="legend-item">
              <div className="legend-line optimized"></div>
              <span>Optimized</span>
            </div>
          )}
        </div>
      </div>
      
      <svg
        ref={svgRef}
        className="chart-svg"
        width={dimensions.width}
        height={dimensions.height}
      />

      {tooltip.visible && hoveredPoint && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="tooltip-header">
            <strong>{formatDate(hoveredPoint.date)}</strong>
            {hoveredPoint.forecast && <span className="forecast-badge">Forecast</span>}
          </div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">Total Cost:</span>
              <span className="tooltip-value">{formatCurrency(hoveredPoint.totalCost)}</span>
            </div>
            {hoveredPoint.optimizedCost && (
              <div className="tooltip-row optimization-row">
                <span className="tooltip-label">Optimized Cost:</span>
                <span className="tooltip-value optimized">
                  {formatCurrency(hoveredPoint.optimizedCost)}
                </span>
              </div>
            )}
            {selectedServices.map(service => (
              <div key={service} className="tooltip-row">
                <span className="tooltip-label" style={{ 
                  color: serviceColors[service as keyof typeof serviceColors] 
                }}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}:
                </span>
                <span className="tooltip-value">
                  {formatCurrency(hoveredPoint[service as keyof CostDataPoint] as number || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostTrendChart;