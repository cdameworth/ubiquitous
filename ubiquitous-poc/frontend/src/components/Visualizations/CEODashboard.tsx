import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './CEODashboard.css';

interface BusinessMetric {
  id: string;
  category: 'financial' | 'operational' | 'strategic' | 'risk';
  name: string;
  currentValue: number;
  previousValue: number;
  target: number;
  unit: 'dollars' | 'percentage' | 'count' | 'days';
  trend: 'up' | 'down' | 'stable';
  priority: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
  forecast: number[];
  quarterlyData: number[];
}

interface ExecutiveSummary {
  totalROI: number;
  annualSavings: number;
  riskReduction: number;
  operationalEfficiency: number;
  strategicInitiatives: number;
  complianceScore: number;
  marketPosition: string;
  nextQuarterForecast: number;
}

interface ROIBreakdown {
  category: string;
  investment: number;
  savings: number;
  roi: number;
  timeframe: string;
  confidence: number;
}

const CEODashboard: React.FC = () => {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [metrics, setMetrics] = useState<BusinessMetric[]>([]);
  const [roiBreakdown, setROIBreakdown] = useState<ROIBreakdown[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'quarter' | 'year' | 'multi-year'>('year');
  const [loading, setLoading] = useState(true);

  const roiChartRef = useRef<SVGSVGElement>(null);
  const trendsChartRef = useRef<SVGSVGElement>(null);
  const strategicChartRef = useRef<SVGSVGElement>(null);

  const mockExecutiveSummary: ExecutiveSummary = {
    totalROI: 342.5,
    annualSavings: 23.2,
    riskReduction: 67,
    operationalEfficiency: 89,
    strategicInitiatives: 85,
    complianceScore: 94,
    marketPosition: 'Leading',
    nextQuarterForecast: 28.7
  };

  const mockMetrics: BusinessMetric[] = [
    {
      id: 'infrastructure-costs',
      category: 'financial',
      name: 'Infrastructure Cost Optimization',
      currentValue: 23.2,
      previousValue: 31.8,
      target: 25.0,
      unit: 'dollars',
      trend: 'down',
      priority: 'high',
      businessImpact: 'Direct impact on operational expenses and profit margins',
      forecast: [23.2, 24.1, 22.8, 21.5, 20.2],
      quarterlyData: [31.8, 29.4, 26.7, 23.2]
    },
    {
      id: 'incident-resolution',
      category: 'operational',
      name: 'Mean Time to Resolution (MTTR)',
      currentValue: 18,
      previousValue: 45,
      target: 15,
      unit: 'days',
      trend: 'down',
      priority: 'critical',
      businessImpact: 'Reduces service downtime and improves customer satisfaction',
      forecast: [18, 16, 15, 14, 13],
      quarterlyData: [45, 38, 28, 18]
    },
    {
      id: 'security-compliance',
      category: 'risk',
      name: 'Security Compliance Score',
      currentValue: 94,
      previousValue: 78,
      target: 95,
      unit: 'percentage',
      trend: 'up',
      priority: 'high',
      businessImpact: 'Reduces regulatory risk and protects brand reputation',
      forecast: [94, 95, 96, 97, 98],
      quarterlyData: [78, 84, 89, 94]
    },
    {
      id: 'automation-coverage',
      category: 'strategic',
      name: 'Process Automation Coverage',
      currentValue: 73,
      previousValue: 45,
      target: 85,
      unit: 'percentage',
      trend: 'up',
      priority: 'medium',
      businessImpact: 'Improves operational efficiency and reduces manual errors',
      forecast: [73, 76, 79, 82, 85],
      quarterlyData: [45, 56, 64, 73]
    },
    {
      id: 'deployment-frequency',
      category: 'operational',
      name: 'Deployment Frequency',
      currentValue: 847,
      previousValue: 312,
      target: 1000,
      unit: 'count',
      trend: 'up',
      priority: 'medium',
      businessImpact: 'Accelerates time-to-market and improves competitive advantage',
      forecast: [847, 892, 936, 981, 1025],
      quarterlyData: [312, 498, 673, 847]
    }
  ];

  const mockROIBreakdown: ROIBreakdown[] = [
    {
      category: 'Infrastructure Optimization',
      investment: 2.8,
      savings: 8.4,
      roi: 200,
      timeframe: '12 months',
      confidence: 92
    },
    {
      category: 'Security Improvements',
      investment: 1.5,
      savings: 3.2,
      roi: 113,
      timeframe: '18 months',
      confidence: 87
    },
    {
      category: 'Process Automation',
      investment: 3.2,
      savings: 7.1,
      roi: 122,
      timeframe: '24 months',
      confidence: 89
    },
    {
      category: 'Compliance Enhancement',
      investment: 0.8,
      savings: 2.1,
      roi: 163,
      timeframe: '6 months',
      confidence: 95
    },
    {
      category: 'Operational Excellence',
      investment: 1.9,
      savings: 4.6,
      roi: 142,
      timeframe: '15 months',
      confidence: 91
    }
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setSummary(mockExecutiveSummary);
      setMetrics(mockMetrics);
      setROIBreakdown(mockROIBreakdown);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (metrics.length > 0 && roiBreakdown.length > 0) {
      renderROIChart();
      renderTrendsChart();
      renderStrategicChart();
    }
  }, [metrics, roiBreakdown, selectedTimeframe]);

  const renderROIChart = () => {
    if (!roiChartRef.current) return;

    const svg = d3.select(roiChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(roiBreakdown.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(roiBreakdown, d => d.roi) || 250])
      .range([height, 0]);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, roiBreakdown.length - 1]);

    // Create bars
    g.selectAll('.roi-bar')
      .data(roiBreakdown)
      .enter().append('rect')
      .attr('class', 'roi-bar')
      .attr('x', d => xScale(d.category)!)
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d.roi))
      .attr('height', d => height - yScale(d.roi))
      .attr('fill', (d, i) => colorScale(i))
      .attr('rx', 4);

    // Add value labels
    g.selectAll('.roi-label')
      .data(roiBreakdown)
      .enter().append('text')
      .attr('class', 'roi-label')
      .attr('x', d => xScale(d.category)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.roi) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(d => `${d.roi}%`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .style('font-size', '10px');

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('ROI by Investment Category');
  };

  const renderTrendsChart = () => {
    if (!trendsChartRef.current) return;

    const svg = d3.select(trendsChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter financial metrics for trends
    const financialMetrics = metrics.filter(m => m.category === 'financial' || m.category === 'operational');
    
    const xScale = d3.scaleLinear()
      .domain([0, 4]) // 4 quarters
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(financialMetrics.flatMap(m => m.quarterlyData)) || 100])
      .range([height, 0]);

    const line = d3.line<number>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Draw lines for each metric
    financialMetrics.forEach((metric, index) => {
      g.append('path')
        .datum(metric.quarterlyData)
        .attr('fill', 'none')
        .attr('stroke', colorScale(index.toString()))
        .attr('stroke-width', 3)
        .attr('d', line);

      // Add dots
      g.selectAll(`.dot-${index}`)
        .data(metric.quarterlyData)
        .enter().append('circle')
        .attr('class', `dot-${index}`)
        .attr('cx', (d, i) => xScale(i))
        .attr('cy', d => yScale(d))
        .attr('r', 4)
        .attr('fill', colorScale(index.toString()));
    });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d => `Q${Math.floor(d as number) + 1}`))
      .style('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '10px');

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Quarterly Performance Trends');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, 40)`);

    financialMetrics.forEach((metric, index) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${index * 20})`);

      legendRow.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(index.toString()));

      legendRow.append('text')
        .attr('x', 15)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .text(metric.name.substring(0, 20) + '...');
    });
  };

  const renderStrategicChart = () => {
    if (!strategicChartRef.current) return;

    const svg = d3.select(strategicChartRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Strategic metrics data
    const strategicData = [
      { name: 'Process Automation', value: 73, target: 85 },
      { name: 'Digital Transformation', value: 68, target: 80 },
      { name: 'Cloud Migration', value: 82, target: 90 },
      { name: 'Data Analytics', value: 76, target: 85 },
      { name: 'Security Posture', value: 94, target: 95 }
    ];

    const angleScale = d3.scaleBand()
      .domain(strategicData.map(d => d.name))
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);

    // Draw grid circles
    const gridLevels = [20, 40, 60, 80, 100];
    gridLevels.forEach(level => {
      g.append('circle')
        .attr('r', radiusScale(level))
        .attr('fill', 'none')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', 5)
        .attr('y', -radiusScale(level))
        .style('font-size', '10px')
        .style('fill', '#9ca3af')
        .text(`${level}%`);
    });

    // Draw spokes
    strategicData.forEach(d => {
      const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angle - Math.PI / 2))
        .attr('y2', radius * Math.sin(angle - Math.PI / 2))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);
    });

    // Draw current values
    const currentLine = d3.line<any>()
      .x(d => {
        const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
        return radiusScale(d.value) * Math.cos(angle - Math.PI / 2);
      })
      .y(d => {
        const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
        return radiusScale(d.value) * Math.sin(angle - Math.PI / 2);
      })
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(strategicData)
      .attr('d', currentLine)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    // Draw target values
    const targetLine = d3.line<any>()
      .x(d => {
        const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
        return radiusScale(d.target) * Math.cos(angle - Math.PI / 2);
      })
      .y(d => {
        const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
        return radiusScale(d.target) * Math.sin(angle - Math.PI / 2);
      })
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(strategicData)
      .attr('d', targetLine)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add labels
    strategicData.forEach(d => {
      const angle = angleScale(d.name)! + angleScale.bandwidth() / 2;
      const labelRadius = radius + 20;
      const x = labelRadius * Math.cos(angle - Math.PI / 2);
      const y = labelRadius * Math.sin(angle - Math.PI / 2);

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', x > 0 ? 'start' : 'end')
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(d.name);

      // Add current value
      const valueX = radiusScale(d.value) * Math.cos(angle - Math.PI / 2);
      const valueY = radiusScale(d.value) * Math.sin(angle - Math.PI / 2);

      g.append('circle')
        .attr('cx', valueX)
        .attr('cy', valueY)
        .attr('r', 4)
        .attr('fill', '#3b82f6');

      g.append('text')
        .attr('x', valueX)
        .attr('y', valueY - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .style('fill', '#1f2937')
        .text(`${d.value}%`);
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Strategic Initiative Progress');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 350)');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .text('Current Progress');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 15)
      .attr('y2', 15)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 15)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .text('Target Goals');
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1) {
      return `$${value.toFixed(1)}M`;
    }
    return `$${(value * 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value: number): string => `${value}%`;

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="ceo-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading executive insights...</p>
      </div>
    );
  }

  return (
    <div className="ceo-dashboard">
      <div className="ceo-header">
        <div>
          <h1 className="ceo-title">CEO Executive Dashboard</h1>
          <p className="ceo-subtitle">Strategic business insights and ROI analysis</p>
        </div>
        <div className="timeframe-selector">
          <label>View: </label>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="timeframe-select"
          >
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
            <option value="multi-year">Multi-Year</option>
          </select>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="executive-summary">
        <div className="summary-card primary">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="metric-value">{formatCurrency(summary!.totalROI)}</div>
            <div className="metric-label">Total ROI</div>
            <div className="metric-change positive">+{formatCurrency(summary!.nextQuarterForecast - summary!.totalROI)} projected</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="metric-value">{formatCurrency(summary!.annualSavings)}</div>
            <div className="metric-label">Annual Savings</div>
            <div className="metric-change positive">+27% vs last year</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">🛡️</div>
          <div className="card-content">
            <div className="metric-value">{formatPercentage(summary!.riskReduction)}</div>
            <div className="metric-label">Risk Reduction</div>
            <div className="metric-change positive">+12% this quarter</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <div className="metric-value">{formatPercentage(summary!.operationalEfficiency)}</div>
            <div className="metric-label">Operational Efficiency</div>
            <div className="metric-change positive">+15% improvement</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="metric-value">{formatPercentage(summary!.strategicInitiatives)}</div>
            <div className="metric-label">Strategic Progress</div>
            <div className="metric-change positive">On track</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <div className="metric-value">{formatPercentage(summary!.complianceScore)}</div>
            <div className="metric-label">Compliance Score</div>
            <div className="metric-change">{summary!.marketPosition} position</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <svg ref={roiChartRef} width="500" height="300"></svg>
        </div>
        
        <div className="chart-container">
          <svg ref={trendsChartRef} width="500" height="300"></svg>
        </div>
      </div>

      <div className="strategic-section">
        <div className="chart-container wide">
          <svg ref={strategicChartRef} width="400" height="400"></svg>
        </div>
        
        <div className="key-metrics">
          <h3>Key Business Metrics</h3>
          {metrics.slice(0, 3).map(metric => (
            <div key={metric.id} className={`metric-item ${metric.priority}`}>
              <div className="metric-header">
                <span className="metric-name">{metric.name}</span>
                <span className="trend-indicator" style={{ color: getTrendColor(metric.trend) }}>
                  {getTrendIcon(metric.trend)}
                </span>
              </div>
              <div className="metric-details">
                <div className="current-value">
                  Current: {metric.unit === 'dollars' ? formatCurrency(metric.currentValue) : 
                           metric.unit === 'percentage' ? formatPercentage(metric.currentValue) :
                           metric.currentValue.toLocaleString()}
                  {metric.unit === 'days' ? ' days' : metric.unit === 'count' ? ' deployments' : ''}
                </div>
                <div className="metric-impact">{metric.businessImpact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Breakdown Table */}
      <div className="roi-breakdown-section">
        <h3>Investment ROI Breakdown</h3>
        <div className="roi-table">
          <div className="table-header">
            <div>Category</div>
            <div>Investment</div>
            <div>Savings</div>
            <div>ROI</div>
            <div>Timeframe</div>
            <div>Confidence</div>
          </div>
          {roiBreakdown.map(item => (
            <div key={item.category} className="table-row">
              <div className="category-cell">{item.category}</div>
              <div>{formatCurrency(item.investment)}</div>
              <div className="savings-cell">{formatCurrency(item.savings)}</div>
              <div className="roi-cell">{item.roi}%</div>
              <div>{item.timeframe}</div>
              <div className="confidence-cell">
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${item.confidence}%` }}
                  ></div>
                </div>
                {item.confidence}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;