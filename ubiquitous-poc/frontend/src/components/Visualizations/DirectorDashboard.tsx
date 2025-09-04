import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './DirectorDashboard.css';

interface OperationalMetric {
  id: string;
  department: 'operations' | 'development' | 'infrastructure' | 'quality' | 'support';
  name: string;
  currentValue: number;
  target: number;
  benchmark: number;
  unit: 'percentage' | 'count' | 'hours' | 'days' | 'tickets' | 'deployments';
  priority: 'high' | 'medium' | 'low';
  trend: 'improving' | 'stable' | 'declining';
  impact: 'critical' | 'high' | 'medium' | 'low';
}

interface TeamPerformance {
  teamName: string;
  productivity: number;
  quality: number;
  velocity: number;
  burnRate: number;
  satisfaction: number;
  utilization: number;
}

interface ResourceAllocation {
  category: string;
  allocated: number;
  utilized: number;
  efficiency: number;
  cost: number;
  forecast: number;
}

interface ProjectHealth {
  projectName: string;
  status: 'on-track' | 'at-risk' | 'delayed' | 'blocked';
  completion: number;
  budget: number;
  timeline: number;
  quality: number;
  team: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const DirectorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const teamChartRef = useRef<SVGSVGElement>(null);
  const resourceChartRef = useRef<SVGSVGElement>(null);
  const projectTimelineRef = useRef<SVGSVGElement>(null);
  const kpiTrendRef = useRef<SVGSVGElement>(null);

  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetric[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [resourceAllocation, setResourceAllocation] = useState<ResourceAllocation[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([]);

  useEffect(() => {
    loadDirectorData();
  }, [timeframe, selectedDepartment]);

  useEffect(() => {
    if (!loading) {
      createTeamPerformanceChart();
      createResourceAllocationChart();
      createProjectTimelineChart();
      createKPITrendChart();
    }
  }, [loading, teamPerformance, resourceAllocation, projectHealth]);

  const loadDirectorData = async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOperationalMetrics([
        {
          id: 'deployment-freq',
          department: 'operations',
          name: 'Deployment Frequency',
          currentValue: 24,
          target: 30,
          benchmark: 20,
          unit: 'deployments',
          priority: 'high',
          trend: 'improving',
          impact: 'high'
        },
        {
          id: 'incident-resolution',
          department: 'operations',
          name: 'Mean Time to Resolution',
          currentValue: 4.2,
          target: 3.0,
          benchmark: 6.0,
          unit: 'hours',
          priority: 'critical',
          trend: 'improving',
          impact: 'critical'
        },
        {
          id: 'code-quality',
          department: 'development',
          name: 'Code Quality Score',
          currentValue: 87,
          target: 90,
          benchmark: 85,
          unit: 'percentage',
          priority: 'medium',
          trend: 'stable',
          impact: 'medium'
        },
        {
          id: 'test-coverage',
          department: 'quality',
          name: 'Test Coverage',
          currentValue: 78,
          target: 85,
          benchmark: 75,
          unit: 'percentage',
          priority: 'high',
          trend: 'improving',
          impact: 'high'
        },
        {
          id: 'system-uptime',
          department: 'infrastructure',
          name: 'System Uptime',
          currentValue: 99.7,
          target: 99.9,
          benchmark: 99.5,
          unit: 'percentage',
          priority: 'critical',
          trend: 'stable',
          impact: 'critical'
        },
        {
          id: 'support-tickets',
          department: 'support',
          name: 'Support Ticket Resolution',
          currentValue: 89,
          target: 95,
          benchmark: 85,
          unit: 'percentage',
          priority: 'high',
          trend: 'declining',
          impact: 'medium'
        }
      ]);

      setTeamPerformance([
        {
          teamName: 'Frontend Team',
          productivity: 85,
          quality: 92,
          velocity: 78,
          burnRate: 82,
          satisfaction: 88,
          utilization: 89
        },
        {
          teamName: 'Backend Team',
          productivity: 91,
          quality: 87,
          velocity: 89,
          burnRate: 85,
          satisfaction: 84,
          utilization: 92
        },
        {
          teamName: 'DevOps Team',
          productivity: 88,
          quality: 94,
          velocity: 85,
          burnRate: 78,
          satisfaction: 91,
          utilization: 87
        },
        {
          teamName: 'QA Team',
          productivity: 82,
          quality: 96,
          velocity: 75,
          burnRate: 88,
          satisfaction: 89,
          utilization: 85
        }
      ]);

      setResourceAllocation([
        {
          category: 'Development',
          allocated: 2800000,
          utilized: 2650000,
          efficiency: 94.6,
          cost: 2650000,
          forecast: 2750000
        },
        {
          category: 'Infrastructure',
          allocated: 1200000,
          utilized: 1150000,
          efficiency: 95.8,
          cost: 1150000,
          forecast: 1100000
        },
        {
          category: 'Testing & QA',
          allocated: 800000,
          utilized: 720000,
          efficiency: 90.0,
          cost: 720000,
          forecast: 780000
        },
        {
          category: 'Support',
          allocated: 600000,
          utilized: 580000,
          efficiency: 96.7,
          cost: 580000,
          forecast: 590000
        },
        {
          category: 'Training',
          allocated: 400000,
          utilized: 320000,
          efficiency: 80.0,
          cost: 320000,
          forecast: 350000
        }
      ]);

      setProjectHealth([
        {
          projectName: 'Platform Migration',
          status: 'on-track',
          completion: 78,
          budget: 92,
          timeline: 85,
          quality: 89,
          team: 'Backend Team',
          priority: 'critical'
        },
        {
          projectName: 'Mobile App Redesign',
          status: 'at-risk',
          completion: 45,
          budget: 78,
          timeline: 65,
          quality: 92,
          team: 'Frontend Team',
          priority: 'high'
        },
        {
          projectName: 'Security Audit Implementation',
          status: 'delayed',
          completion: 23,
          budget: 95,
          timeline: 35,
          quality: 88,
          team: 'DevOps Team',
          priority: 'critical'
        },
        {
          projectName: 'API Gateway Upgrade',
          status: 'on-track',
          completion: 89,
          budget: 88,
          timeline: 95,
          quality: 85,
          team: 'Backend Team',
          priority: 'medium'
        },
        {
          projectName: 'Automated Testing Suite',
          status: 'blocked',
          completion: 12,
          budget: 98,
          timeline: 15,
          quality: 90,
          team: 'QA Team',
          priority: 'high'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load director data:', error);
      setLoading(false);
    }
  };

  const createTeamPerformanceChart = () => {
    if (!teamChartRef.current || !teamPerformance.length) return;

    const svg = d3.select(teamChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const metrics = ['productivity', 'quality', 'velocity', 'satisfaction'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    const xScale = d3.scaleBand()
      .domain(teamPerformance.map(d => d.teamName))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const xSubScale = d3.scaleBand()
      .domain(metrics)
      .range([0, xScale.bandwidth()])
      .padding(0.05);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    teamPerformance.forEach(team => {
      const teamGroup = g.append('g')
        .attr('transform', `translate(${xScale(team.teamName)},0)`);

      metrics.forEach((metric, i) => {
        const value = team[metric as keyof TeamPerformance] as number;
        
        teamGroup.append('rect')
          .attr('x', xSubScale(metric)!)
          .attr('y', yScale(value))
          .attr('width', xSubScale.bandwidth())
          .attr('height', height - yScale(value))
          .attr('fill', colors[i])
          .attr('opacity', 0.8)
          .on('mouseover', function() {
            d3.select(this).attr('opacity', 1);
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.8);
          });

        teamGroup.append('text')
          .attr('x', xSubScale(metric)! + xSubScale.bandwidth() / 2)
          .attr('y', yScale(value) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('font-weight', '600')
          .text(`${value}%`);
      });
    });

    const legend = svg.append('g')
      .attr('transform', `translate(${width - 60}, 30)`);

    metrics.forEach((metric, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors[i]);

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '11px')
        .style('text-transform', 'capitalize')
        .text(metric);
    });
  };

  const createResourceAllocationChart = () => {
    if (!resourceChartRef.current || !resourceAllocation.length) return;

    const svg = d3.select(resourceChartRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(resourceAllocation.map(d => d.category))
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    const pie = d3.pie<ResourceAllocation>()
      .value(d => d.utilized)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<ResourceAllocation>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(resourceAllocation))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.category) as string)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '10px')
          .style('border-radius', '5px')
          .style('font-size', '12px');

        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.data.category}</strong><br/>
          Utilized: $${(d.data.utilized / 1000).toFixed(0)}K<br/>
          Efficiency: ${d.data.efficiency.toFixed(1)}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        d3.selectAll('.tooltip').remove();
      });

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      .text(d => d.data.category);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', '#374151')
      .text('Resource');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', '#374151')
      .text('Allocation');
  };

  const createProjectTimelineChart = () => {
    if (!projectTimelineRef.current || !projectHealth.length) return;

    const svg = d3.select(projectTimelineRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 150 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
      .domain(projectHealth.map(d => d.projectName))
      .range([0, height])
      .padding(0.2);

    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    const statusColors: { [key: string]: string } = {
      'on-track': '#10b981',
      'at-risk': '#f59e0b',
      'delayed': '#ef4444',
      'blocked': '#6b7280'
    };

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px')
      .style('font-weight', '500');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    projectHealth.forEach(project => {
      const y = yScale(project.projectName)!;
      const barHeight = yScale.bandwidth();

      g.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', width)
        .attr('height', barHeight)
        .attr('fill', '#f3f4f6')
        .attr('rx', 4);

      g.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', xScale(project.completion))
        .attr('height', barHeight)
        .attr('fill', statusColors[project.status])
        .attr('rx', 4)
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', xScale(project.completion) + 10)
        .attr('y', y + barHeight / 2)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .text(`${project.completion}%`);

      g.append('text')
        .attr('x', 10)
        .attr('y', y + barHeight / 2)
        .attr('dy', '.35em')
        .style('font-size', '10px')
        .style('font-weight', '600')
        .style('fill', '#fff')
        .text(project.status.toUpperCase());
    });
  };

  const createKPITrendChart = () => {
    if (!kpiTrendRef.current || !operationalMetrics.length) return;

    const svg = d3.select(kpiTrendRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = operationalMetrics.map(metric => ({
      name: metric.name,
      current: (metric.currentValue / metric.target) * 100,
      target: 100,
      trend: metric.trend
    }));

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 120])
      .range([height, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '10px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(100))
      .attr('y2', yScale(100))
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    data.forEach(d => {
      const color = d.current >= 100 ? '#10b981' : d.current >= 80 ? '#f59e0b' : '#ef4444';
      
      g.append('rect')
        .attr('x', xScale(d.name)!)
        .attr('y', yScale(d.current))
        .attr('width', xScale.bandwidth())
        .attr('height', height - yScale(d.current))
        .attr('fill', color)
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', xScale(d.name)! + xScale.bandwidth() / 2)
        .attr('y', yScale(d.current) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(`${d.current.toFixed(0)}%`);
    });

    g.append('text')
      .attr('x', width - 100)
      .attr('y', yScale(100) - 10)
      .style('font-size', '11px')
      .style('fill', '#ef4444')
      .text('Target Line');
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return '#10b981';
      case 'at-risk': return '#f59e0b';
      case 'delayed': return '#ef4444';
      case 'blocked': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <div className="director-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading operational dashboard...</p>
      </div>
    );
  }

  return (
    <div className="director-dashboard">
      <div className="director-header">
        <div className="title-section">
          <h1 className="director-title">Director Operations Dashboard</h1>
          <p className="director-subtitle">
            Team performance, resource optimization, and project delivery insights
          </p>
        </div>
        
        <div className="controls-section">
          <div className="timeframe-selector">
            <label>Time Period:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="timeframe-select"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          
          <div className="department-selector">
            <label>Department:</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="department-select"
            >
              <option value="all">All Departments</option>
              <option value="operations">Operations</option>
              <option value="development">Development</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="quality">Quality</option>
              <option value="support">Support</option>
            </select>
          </div>
        </div>
      </div>

      <div className="operational-summary">
        {operationalMetrics.slice(0, 4).map((metric) => (
          <div key={metric.id} className={`metric-card ${metric.priority}`}>
            <div className="metric-header">
              <span className="metric-icon">{getPriorityIcon(metric.priority)}</span>
              <div className="metric-info">
                <h3 className="metric-name">{metric.name}</h3>
                <span className="metric-department">{metric.department}</span>
              </div>
              <span className="trend-icon">{getTrendIcon(metric.trend)}</span>
            </div>
            
            <div className="metric-value-section">
              <div className="current-value">
                {metric.currentValue} {metric.unit === 'percentage' ? '%' : metric.unit}
              </div>
              <div className="metric-targets">
                <span className="target">Target: {metric.target}{metric.unit === 'percentage' ? '%' : ''}</span>
                <span className="benchmark">Industry: {metric.benchmark}{metric.unit === 'percentage' ? '%' : ''}</span>
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min((metric.currentValue / metric.target) * 100, 100)}%`,
                  backgroundColor: metric.currentValue >= metric.target ? '#10b981' : 
                                  metric.currentValue >= metric.benchmark ? '#f59e0b' : '#ef4444'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="charts-row">
          <div className="chart-container">
            <h3 className="chart-title">Team Performance Metrics</h3>
            <svg ref={teamChartRef} width="600" height="400"></svg>
          </div>
          
          <div className="chart-container">
            <h3 className="chart-title">Resource Allocation</h3>
            <svg ref={resourceChartRef} width="400" height="400"></svg>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-container wide">
            <h3 className="chart-title">Project Delivery Status</h3>
            <svg ref={projectTimelineRef} width="700" height="300"></svg>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-container">
            <h3 className="chart-title">KPI Performance vs Targets</h3>
            <svg ref={kpiTrendRef} width="500" height="300"></svg>
          </div>
          
          <div className="project-health-container">
            <h3 className="chart-title">Critical Project Status</h3>
            <div className="project-list">
              {projectHealth.filter(p => p.priority === 'critical' || p.status !== 'on-track').map((project) => (
                <div key={project.projectName} className="project-item">
                  <div className="project-header">
                    <span 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    ></span>
                    <div className="project-info">
                      <h4 className="project-name">{project.projectName}</h4>
                      <span className="project-team">{project.team}</span>
                    </div>
                    <span className={`priority-badge ${project.priority}`}>
                      {getPriorityIcon(project.priority)} {project.priority}
                    </span>
                  </div>
                  
                  <div className="project-metrics">
                    <div className="metric-row">
                      <span>Completion:</span>
                      <div className="mini-progress">
                        <div 
                          className="mini-fill"
                          style={{ width: `${project.completion}%` }}
                        ></div>
                      </div>
                      <span>{project.completion}%</span>
                    </div>
                    
                    <div className="metric-row">
                      <span>Budget:</span>
                      <div className="mini-progress">
                        <div 
                          className="mini-fill"
                          style={{ 
                            width: `${project.budget}%`,
                            backgroundColor: project.budget < 80 ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                      </div>
                      <span>{project.budget}%</span>
                    </div>
                    
                    <div className="metric-row">
                      <span>Timeline:</span>
                      <div className="mini-progress">
                        <div 
                          className="mini-fill"
                          style={{ 
                            width: `${project.timeline}%`,
                            backgroundColor: project.timeline < 80 ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                      </div>
                      <span>{project.timeline}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="resource-breakdown">
        <h3 className="section-title">Resource Utilization Breakdown</h3>
        <div className="resource-grid">
          {resourceAllocation.map((resource) => (
            <div key={resource.category} className="resource-card">
              <div className="resource-header">
                <h4 className="resource-category">{resource.category}</h4>
                <div className="efficiency-badge">
                  {resource.efficiency.toFixed(1)}% efficient
                </div>
              </div>
              
              <div className="resource-details">
                <div className="resource-row">
                  <span>Allocated:</span>
                  <span className="amount">${(resource.allocated / 1000).toFixed(0)}K</span>
                </div>
                <div className="resource-row">
                  <span>Utilized:</span>
                  <span className="amount utilized">${(resource.utilized / 1000).toFixed(0)}K</span>
                </div>
                <div className="resource-row">
                  <span>Forecast:</span>
                  <span className="amount forecast">${(resource.forecast / 1000).toFixed(0)}K</span>
                </div>
              </div>
              
              <div className="utilization-bar">
                <div 
                  className="utilization-fill"
                  style={{ width: `${resource.efficiency}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;