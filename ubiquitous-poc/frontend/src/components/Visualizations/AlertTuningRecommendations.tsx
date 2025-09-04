import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './AlertTuningRecommendations.css';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  service: string;
  cluster: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'muted' | 'disabled';
  firedCount: number;
  falsePositiveRate: number;
  meanTimeToResolution: number; // minutes
  businessImpact: 'high' | 'medium' | 'low';
  lastTriggered: Date;
  createdDate: Date;
  lastModified: Date;
  contactGroups: string[];
  runbookUrl?: string;
  dashboardUrl?: string;
  tuningRecommendations: TuningRecommendation[];
  performance: AlertPerformance;
}

interface TuningRecommendation {
  id: string;
  type: 'threshold_adjustment' | 'condition_refinement' | 'time_window_change' | 'disable_alert' | 'add_context' | 'split_alert';
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  description: string;
  rationale: string;
  suggestedChange: string;
  expectedImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  implementationEffort: 'low' | 'medium' | 'high';
  dataPoints: number; // Number of data points supporting this recommendation
  category: 'noise_reduction' | 'sensitivity_improvement' | 'coverage_gap' | 'maintenance';
}

interface AlertPerformance {
  accuracyScore: number; // 0-100
  noiseLevel: number; // 0-100 (higher is noisier)
  responseTime: number; // Average response time in minutes
  resolutionRate: number; // Percentage of alerts that were actionable
  escalationRate: number; // Percentage of alerts that required escalation
  weeklyTrend: 'increasing' | 'decreasing' | 'stable';
  seasonalPattern: boolean;
  correlatedAlerts: string[]; // IDs of frequently co-occurring alerts
}

interface AlertAnalytics {
  totalAlerts: number;
  activeAlerts: number;
  noisyAlerts: number; // >20% false positive rate
  underperformingAlerts: number; // Low resolution rate
  optimizationPotential: number; // Percentage improvement possible
  avgFalsePositiveRate: number;
  avgResolutionTime: number;
  criticalGaps: number;
}

const AlertTuningRecommendations: React.FC = () => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertRule[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AlertRule | null>(null);
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [filters, setFilters] = useState({
    service: 'all',
    severity: 'all',
    status: 'all',
    cluster: 'all',
    performanceIssue: 'all' // all, noisy, underperforming, good
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'firedCount' | 'falsePositiveRate' | 'lastTriggered' | 'businessImpact'>('falsePositiveRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'recommendations' | 'performance' | 'timeline'>('recommendations');
  const [loading, setLoading] = useState(true);
  
  const performanceChartRef = useRef<SVGSVGElement>(null);
  const timelineChartRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const mockAlertRules: AlertRule[] = [
    {
      id: 'alert-1',
      name: 'High CPU Usage',
      description: 'CPU usage is above 80% for more than 5 minutes',
      service: 'trading-api',
      cluster: 'prod-trading',
      metric: 'cpu_utilization',
      condition: 'cpu_usage > 80',
      threshold: 80,
      severity: 'warning',
      status: 'active',
      firedCount: 145,
      falsePositiveRate: 35,
      meanTimeToResolution: 25,
      businessImpact: 'medium',
      lastTriggered: new Date('2024-08-27T14:30:00'),
      createdDate: new Date('2024-01-15T10:00:00'),
      lastModified: new Date('2024-06-20T16:45:00'),
      contactGroups: ['platform-team', 'trading-oncall'],
      runbookUrl: 'https://wiki.company.com/runbooks/cpu-high',
      dashboardUrl: 'https://grafana.company.com/dashboard/cpu-monitoring',
      tuningRecommendations: [
        {
          id: 'rec-1',
          type: 'threshold_adjustment',
          priority: 'high',
          confidence: 85,
          description: 'Increase threshold from 80% to 85% to reduce false positives',
          rationale: 'Analysis shows CPU spikes to 80-84% are normal during market hours and resolve automatically',
          suggestedChange: 'Change threshold from 80% to 85%',
          expectedImpact: 'Reduce false positives by ~40% while maintaining alert effectiveness',
          riskLevel: 'low',
          implementationEffort: 'low',
          dataPoints: 89,
          category: 'noise_reduction'
        },
        {
          id: 'rec-2',
          type: 'time_window_change',
          priority: 'medium',
          confidence: 70,
          description: 'Extend evaluation window from 5 to 8 minutes',
          rationale: 'Short-term spikes often resolve within 6-7 minutes without intervention',
          suggestedChange: 'Change evaluation window to 8 minutes',
          expectedImpact: 'Reduce noise by 25% and improve signal quality',
          riskLevel: 'low',
          implementationEffort: 'low',
          dataPoints: 67,
          category: 'noise_reduction'
        }
      ],
      performance: {
        accuracyScore: 65,
        noiseLevel: 35,
        responseTime: 8.5,
        resolutionRate: 72,
        escalationRate: 15,
        weeklyTrend: 'stable',
        seasonalPattern: true,
        correlatedAlerts: ['alert-3', 'alert-7']
      }
    },
    {
      id: 'alert-2',
      name: 'Database Connection Pool Exhausted',
      description: 'Database connection pool utilization above 90%',
      service: 'portfolio-service',
      cluster: 'prod-portfolio',
      metric: 'db_pool_utilization',
      condition: 'db_pool_usage > 90',
      threshold: 90,
      severity: 'critical',
      status: 'active',
      firedCount: 23,
      falsePositiveRate: 8,
      meanTimeToResolution: 45,
      businessImpact: 'high',
      lastTriggered: new Date('2024-08-26T09:15:00'),
      createdDate: new Date('2024-02-10T14:20:00'),
      lastModified: new Date('2024-08-15T11:30:00'),
      contactGroups: ['database-team', 'portfolio-oncall'],
      runbookUrl: 'https://wiki.company.com/runbooks/db-pool',
      dashboardUrl: 'https://grafana.company.com/dashboard/db-monitoring',
      tuningRecommendations: [
        {
          id: 'rec-3',
          type: 'add_context',
          priority: 'high',
          confidence: 92,
          description: 'Add query latency context to alert',
          rationale: 'Pool exhaustion combined with high query latency indicates real issues vs. temporary spikes',
          suggestedChange: 'Add condition: AND query_latency > 500ms',
          expectedImpact: 'Improve alert precision and reduce investigation time',
          riskLevel: 'low',
          implementationEffort: 'medium',
          dataPoints: 23,
          category: 'sensitivity_improvement'
        }
      ],
      performance: {
        accuracyScore: 92,
        noiseLevel: 8,
        responseTime: 4.2,
        resolutionRate: 87,
        escalationRate: 35,
        weeklyTrend: 'decreasing',
        seasonalPattern: false,
        correlatedAlerts: ['alert-5']
      }
    },
    {
      id: 'alert-3',
      name: 'Memory Usage High',
      description: 'Memory usage exceeds 85% for sustained period',
      service: 'risk-calculator',
      cluster: 'prod-risk',
      metric: 'memory_utilization',
      condition: 'memory_usage > 85',
      threshold: 85,
      severity: 'warning',
      status: 'active',
      firedCount: 67,
      falsePositiveRate: 42,
      meanTimeToResolution: 18,
      businessImpact: 'low',
      lastTriggered: new Date('2024-08-28T11:20:00'),
      createdDate: new Date('2024-03-05T09:30:00'),
      lastModified: new Date('2024-03-05T09:30:00'),
      contactGroups: ['platform-team'],
      runbookUrl: 'https://wiki.company.com/runbooks/memory-high',
      tuningRecommendations: [
        {
          id: 'rec-4',
          type: 'threshold_adjustment',
          priority: 'high',
          confidence: 88,
          description: 'Increase threshold from 85% to 90%',
          rationale: 'Risk calculator routinely uses 85-89% memory as normal operation during calculations',
          suggestedChange: 'Change threshold from 85% to 90%',
          expectedImpact: 'Reduce false positives by ~50%',
          riskLevel: 'low',
          implementationEffort: 'low',
          dataPoints: 67,
          category: 'noise_reduction'
        },
        {
          id: 'rec-5',
          type: 'split_alert',
          priority: 'medium',
          confidence: 75,
          description: 'Split into business hours vs. off-hours alerts',
          rationale: 'Memory patterns differ significantly between business and off hours',
          suggestedChange: 'Create separate alerts: 90% (business hours), 95% (off hours)',
          expectedImpact: 'Better context-aware alerting and reduced noise',
          riskLevel: 'medium',
          implementationEffort: 'high',
          dataPoints: 67,
          category: 'sensitivity_improvement'
        }
      ],
      performance: {
        accuracyScore: 58,
        noiseLevel: 42,
        responseTime: 12.3,
        resolutionRate: 63,
        escalationRate: 8,
        weeklyTrend: 'increasing',
        seasonalPattern: true,
        correlatedAlerts: ['alert-1', 'alert-4']
      }
    },
    {
      id: 'alert-4',
      name: 'API Response Time Slow',
      description: 'API response time P95 exceeds 2 seconds',
      service: 'trading-api',
      cluster: 'prod-trading',
      metric: 'response_time_p95',
      condition: 'response_time_p95 > 2000',
      threshold: 2000,
      severity: 'critical',
      status: 'active',
      firedCount: 12,
      falsePositiveRate: 50,
      meanTimeToResolution: 75,
      businessImpact: 'high',
      lastTriggered: new Date('2024-08-25T16:45:00'),
      createdDate: new Date('2024-04-12T13:15:00'),
      lastModified: new Date('2024-04-12T13:15:00'),
      contactGroups: ['trading-team', 'platform-oncall'],
      runbookUrl: 'https://wiki.company.com/runbooks/api-slow',
      dashboardUrl: 'https://grafana.company.com/dashboard/api-performance',
      tuningRecommendations: [
        {
          id: 'rec-6',
          type: 'condition_refinement',
          priority: 'high',
          confidence: 82,
          description: 'Add request volume context to avoid false alarms during low traffic',
          rationale: 'P95 can be misleading with < 100 requests/min due to statistical variance',
          suggestedChange: 'Add condition: AND request_rate > 100/min',
          expectedImpact: 'Eliminate false positives during low-traffic periods',
          riskLevel: 'low',
          implementationEffort: 'medium',
          dataPoints: 12,
          category: 'sensitivity_improvement'
        },
        {
          id: 'rec-7',
          type: 'threshold_adjustment',
          priority: 'medium',
          confidence: 68,
          description: 'Consider increasing threshold to 2.5 seconds',
          rationale: 'Business team indicates 2-2.5s is acceptable for complex trading operations',
          suggestedChange: 'Increase threshold to 2500ms',
          expectedImpact: 'Focus on truly problematic response times',
          riskLevel: 'medium',
          implementationEffort: 'low',
          dataPoints: 12,
          category: 'noise_reduction'
        }
      ],
      performance: {
        accuracyScore: 50,
        noiseLevel: 50,
        responseTime: 18.7,
        resolutionRate: 58,
        escalationRate: 42,
        weeklyTrend: 'stable',
        seasonalPattern: false,
        correlatedAlerts: ['alert-3']
      }
    },
    {
      id: 'alert-5',
      name: 'Disk Space Critical',
      description: 'Disk usage above 90% on database volumes',
      service: 'database',
      cluster: 'prod-data',
      metric: 'disk_usage',
      condition: 'disk_usage > 90',
      threshold: 90,
      severity: 'critical',
      status: 'active',
      firedCount: 3,
      falsePositiveRate: 0,
      meanTimeToResolution: 120,
      businessImpact: 'high',
      lastTriggered: new Date('2024-08-20T22:30:00'),
      createdDate: new Date('2024-01-08T10:00:00'),
      lastModified: new Date('2024-05-15T14:20:00'),
      contactGroups: ['database-team', 'infrastructure-oncall'],
      runbookUrl: 'https://wiki.company.com/runbooks/disk-space',
      tuningRecommendations: [
        {
          id: 'rec-8',
          type: 'add_context',
          priority: 'medium',
          confidence: 78,
          description: 'Add predictive alerting at 80% with growth rate context',
          rationale: 'Early warning would allow proactive capacity management',
          suggestedChange: 'Create additional alert at 80% with growth trend analysis',
          expectedImpact: 'Enable proactive capacity management and reduce emergency responses',
          riskLevel: 'low',
          implementationEffort: 'high',
          dataPoints: 3,
          category: 'coverage_gap'
        }
      ],
      performance: {
        accuracyScore: 100,
        noiseLevel: 0,
        responseTime: 15.2,
        resolutionRate: 100,
        escalationRate: 67,
        weeklyTrend: 'stable',
        seasonalPattern: false,
        correlatedAlerts: ['alert-2']
      }
    }
  ];

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setAlertRules(mockAlertRules);
      setFilteredAlerts(mockAlertRules);
      
      // Calculate analytics
      const analytics: AlertAnalytics = {
        totalAlerts: mockAlertRules.length,
        activeAlerts: mockAlertRules.filter(a => a.status === 'active').length,
        noisyAlerts: mockAlertRules.filter(a => a.falsePositiveRate > 20).length,
        underperformingAlerts: mockAlertRules.filter(a => a.performance.resolutionRate < 70).length,
        optimizationPotential: Math.round(mockAlertRules.reduce((acc, alert) => 
          acc + (alert.falsePositiveRate > 20 ? alert.falsePositiveRate : 0), 0) / mockAlertRules.length),
        avgFalsePositiveRate: Math.round(mockAlertRules.reduce((acc, a) => acc + a.falsePositiveRate, 0) / mockAlertRules.length),
        avgResolutionTime: Math.round(mockAlertRules.reduce((acc, a) => acc + a.meanTimeToResolution, 0) / mockAlertRules.length),
        criticalGaps: mockAlertRules.filter(a => 
          a.tuningRecommendations.some(r => r.priority === 'high' && r.category === 'coverage_gap')).length
      };
      
      setAnalytics(analytics);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = alertRules.filter(alert => {
      const matchesSearch = searchTerm === '' || 
        alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.service.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService = filters.service === 'all' || 
        alert.service === filters.service;

      const matchesSeverity = filters.severity === 'all' ||
        alert.severity === filters.severity;

      const matchesStatus = filters.status === 'all' ||
        alert.status === filters.status;

      const matchesCluster = filters.cluster === 'all' ||
        alert.cluster === filters.cluster;

      const matchesPerformance = filters.performanceIssue === 'all' ||
        (filters.performanceIssue === 'noisy' && alert.falsePositiveRate > 20) ||
        (filters.performanceIssue === 'underperforming' && alert.performance.resolutionRate < 70) ||
        (filters.performanceIssue === 'good' && alert.falsePositiveRate <= 20 && alert.performance.resolutionRate >= 70);

      return matchesSearch && matchesService && matchesSeverity && 
             matchesStatus && matchesCluster && matchesPerformance;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'firedCount':
          aValue = a.firedCount;
          bValue = b.firedCount;
          break;
        case 'falsePositiveRate':
          aValue = a.falsePositiveRate;
          bValue = b.falsePositiveRate;
          break;
        case 'lastTriggered':
          aValue = a.lastTriggered.getTime();
          bValue = b.lastTriggered.getTime();
          break;
        case 'businessImpact':
          const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = impactOrder[a.businessImpact];
          bValue = impactOrder[b.businessImpact];
          break;
        default:
          aValue = a.falsePositiveRate;
          bValue = b.falsePositiveRate;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredAlerts(filtered);
  }, [alertRules, searchTerm, filters, sortBy, sortOrder]);

  useEffect(() => {
    if (viewMode === 'performance' && filteredAlerts.length > 0) {
      renderPerformanceChart();
    } else if (viewMode === 'timeline' && filteredAlerts.length > 0) {
      renderTimelineChart();
    }
  }, [filteredAlerts, viewMode]);

  const renderPerformanceChart = () => {
    if (!performanceChartRef.current) return;

    const svg = d3.select(performanceChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scatter plot: False Positive Rate vs Resolution Rate
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filteredAlerts, d => d.falsePositiveRate) || 100])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['critical', 'warning', 'info'])
      .range(['#dc2626', '#f59e0b', '#3b82f6']);

    // Add quadrant guidelines
    g.append("rect")
      .attr("x", 0)
      .attr("y", yScale(70))
      .attr("width", xScale(20))
      .attr("height", yScale(0) - yScale(70))
      .attr("fill", "#10b981")
      .attr("opacity", 0.1);

    g.append("text")
      .attr("x", xScale(10))
      .attr("y", yScale(85))
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#059669")
      .text("Good Performance");

    g.append("rect")
      .attr("x", xScale(20))
      .attr("y", 0)
      .attr("width", width - xScale(20))
      .attr("height", yScale(70))
      .attr("fill", "#dc2626")
      .attr("opacity", 0.1);

    g.append("text")
      .attr("x", width - 10)
      .attr("y", yScale(85))
      .attr("text-anchor", "end")
      .attr("font-size", "12px")
      .attr("fill", "#dc2626")
      .text("Needs Tuning");

    // Add data points
    g.selectAll(".data-point")
      .data(filteredAlerts)
      .enter().append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(d.falsePositiveRate))
      .attr("cy", d => yScale(d.performance.resolutionRate))
      .attr("r", d => Math.max(4, d.tuningRecommendations.length * 2))
      .attr("fill", d => colorScale(d.severity) as string)
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        showTooltip(event, `
          <div class="tooltip-title">${d.name}</div>
          <div>False Positive Rate: ${d.falsePositiveRate}%</div>
          <div>Resolution Rate: ${d.performance.resolutionRate}%</div>
          <div>Recommendations: ${d.tuningRecommendations.length}</div>
        `);
      })
      .on("mouseout", hideTooltip)
      .on("click", (event, d) => {
        setSelectedAlert(d);
      });

    // Add axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

    // Add axis labels
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Resolution Rate (%)");

    g.append("text")
      .attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("False Positive Rate (%)");
  };

  const renderTimelineChart = () => {
    if (!timelineChartRef.current) return;

    const svg = d3.select(timelineChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 120 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create timeline of alert firing frequency over the last 30 days
    const timeRange = d3.timeDay.range(d3.timeDay.offset(new Date(), -30), new Date());
    const yScale = d3.scaleBand()
      .domain(filteredAlerts.map(d => d.name))
      .range([0, height])
      .padding(0.1);

    const xScale = d3.scaleTime()
      .domain(d3.extent(timeRange) as [Date, Date])
      .range([0, width]);

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 10, 30])
      .range(['#10b981', '#f59e0b', '#dc2626']);

    // Generate mock timeline data
    const timelineData: Array<{alert: string, date: Date, count: number}> = [];
    filteredAlerts.forEach(alert => {
      timeRange.forEach(date => {
        // Simulate firing frequency based on alert characteristics
        const baseFiring = alert.firedCount / 30; // Average per day
        const randomFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25x variation
        const count = Math.round(baseFiring * randomFactor);
        if (count > 0) {
          timelineData.push({
            alert: alert.name,
            date: date,
            count: count
          });
        }
      });
    });

    // Create heatmap cells
    g.selectAll('.timeline-cell')
      .data(timelineData)
      .enter().append('rect')
      .attr('class', 'timeline-cell')
      .attr('x', d => xScale(d.date))
      .attr('y', d => yScale(d.alert)!)
      .attr('width', width / 30)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.count))
      .on('mouseover', (event, d) => {
        showTooltip(event, `
          <div class="tooltip-title">${d.alert}</div>
          <div>Date: ${d.date.toLocaleDateString()}</div>
          <div>Alerts fired: ${d.count}</div>
        `);
      })
      .on('mouseout', hideTooltip);

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '10px');
  };

  const showTooltip = (event: MouseEvent, content: string) => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.opacity = '1';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY - 10}px`;
    tooltip.innerHTML = content;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.opacity = '0';
    }
  };

  const renderRecommendationsList = () => {
    return (
      <div className="recommendations-list">
        {filteredAlerts.map(alert => (
          <div key={alert.id} className={`alert-card ${alert.severity}`}>
            <div className="alert-header">
              <div className="alert-info">
                <h3 className="alert-name">{alert.name}</h3>
                <p className="alert-description">{alert.description}</p>
                <div className="alert-meta">
                  <span className="service-tag">{alert.service}</span>
                  <span className="cluster-tag">{alert.cluster}</span>
                  <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                  <span className={`status-badge ${alert.status}`}>{alert.status}</span>
                </div>
              </div>
              <div className="alert-metrics">
                <div className="metric-item">
                  <span className="metric-value">{alert.firedCount}</span>
                  <span className="metric-label">Fired</span>
                </div>
                <div className="metric-item">
                  <span className={`metric-value ${alert.falsePositiveRate > 20 ? 'warning' : ''}`}>
                    {alert.falsePositiveRate}%
                  </span>
                  <span className="metric-label">False Positive</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{alert.performance.resolutionRate}%</span>
                  <span className="metric-label">Resolution Rate</span>
                </div>
              </div>
            </div>
            
            <div className="recommendations-section">
              <h4>Tuning Recommendations ({alert.tuningRecommendations.length})</h4>
              <div className="recommendations-grid">
                {alert.tuningRecommendations.map(rec => (
                  <div key={rec.id} className={`recommendation-item ${rec.priority}`}>
                    <div className="recommendation-header">
                      <div className="recommendation-type">
                        {rec.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="recommendation-badges">
                        <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                        <span className="confidence-badge">{rec.confidence}% confidence</span>
                      </div>
                    </div>
                    <div className="recommendation-content">
                      <p className="recommendation-description">{rec.description}</p>
                      <div className="recommendation-details">
                        <div className="detail-row">
                          <strong>Suggested Change:</strong> {rec.suggestedChange}
                        </div>
                        <div className="detail-row">
                          <strong>Expected Impact:</strong> {rec.expectedImpact}
                        </div>
                        <div className="detail-row">
                          <strong>Rationale:</strong> {rec.rationale}
                        </div>
                      </div>
                      <div className="recommendation-footer">
                        <span className={`risk-level ${rec.riskLevel}`}>Risk: {rec.riskLevel}</span>
                        <span className={`effort-level ${rec.implementationEffort}`}>Effort: {rec.implementationEffort}</span>
                        <span className="data-points">Based on {rec.dataPoints} data points</span>
                      </div>
                    </div>
                    <div className="recommendation-actions">
                      <button className="apply-button">Apply Suggestion</button>
                      <button className="dismiss-button">Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="alert-tuning-loading">
        <div className="spinner"></div>
        <p>Analyzing alert performance and generating recommendations...</p>
      </div>
    );
  }

  return (
    <div className="alert-tuning-recommendations">
      <div className="tuning-header">
        <div>
          <h2 className="tuning-title">Alert Tuning Recommendations</h2>
          <p className="tuning-subtitle">Optimize alert rules to reduce noise and improve signal quality</p>
        </div>
        <div className="tuning-actions">
          <button className="analyze-button">
            <span>🔄</span> Re-analyze
          </button>
          <button className="export-button">
            <span>📊</span> Export Report
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="analytics-overview">
          <div className="stat-card">
            <div className="stat-number">{analytics.totalAlerts}</div>
            <div className="stat-label">Total Alerts</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{analytics.noisyAlerts}</div>
            <div className="stat-label">Noisy Alerts (&gt;20% FP)</div>
          </div>
          <div className="stat-card critical">
            <div className="stat-number">{analytics.underperformingAlerts}</div>
            <div className="stat-label">Underperforming (&lt;70% Resolution)</div>
          </div>
          <div className="stat-card info">
            <div className="stat-number">{analytics.optimizationPotential}%</div>
            <div className="stat-label">Optimization Potential</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{analytics.avgResolutionTime}m</div>
            <div className="stat-label">Avg Resolution Time</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="tuning-filters">
        <div className="filter-row">
          <div className="search-group">
            <input
              type="text"
              className="search-input"
              placeholder="Search alerts, services, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Service</label>
            <select 
              className="filter-select"
              value={filters.service}
              onChange={(e) => setFilters({...filters, service: e.target.value})}
            >
              <option value="all">All Services</option>
              <option value="trading-api">trading-api</option>
              <option value="portfolio-service">portfolio-service</option>
              <option value="risk-calculator">risk-calculator</option>
              <option value="database">database</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Severity</label>
            <select 
              className="filter-select"
              value={filters.severity}
              onChange={(e) => setFilters({...filters, severity: e.target.value})}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Performance</label>
            <select 
              className="filter-select"
              value={filters.performanceIssue}
              onChange={(e) => setFilters({...filters, performanceIssue: e.target.value})}
            >
              <option value="all">All Alerts</option>
              <option value="noisy">Noisy (&gt;20% FP)</option>
              <option value="underperforming">Underperforming</option>
              <option value="good">Good Performance</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="falsePositiveRate">False Positive Rate</option>
              <option value="firedCount">Fired Count</option>
              <option value="lastTriggered">Last Triggered</option>
              <option value="businessImpact">Business Impact</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Order</label>
            <select 
              className="filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`view-option ${viewMode === 'recommendations' ? 'active' : ''}`}
          onClick={() => setViewMode('recommendations')}
        >
          Recommendations
        </button>
        <button 
          className={`view-option ${viewMode === 'performance' ? 'active' : ''}`}
          onClick={() => setViewMode('performance')}
        >
          Performance Analysis
        </button>
        <button 
          className={`view-option ${viewMode === 'timeline' ? 'active' : ''}`}
          onClick={() => setViewMode('timeline')}
        >
          Timeline View
        </button>
      </div>

      {/* Main Content */}
      <div className="tuning-content">
        {viewMode === 'recommendations' && renderRecommendationsList()}
        
        {viewMode === 'performance' && (
          <div className="chart-container">
            <h3>Alert Performance Analysis</h3>
            <p className="chart-description">
              False Positive Rate vs Resolution Rate. Lower-left quadrant represents well-tuned alerts.
            </p>
            <svg ref={performanceChartRef} width="600" height="400" className="performance-chart"></svg>
          </div>
        )}
        
        {viewMode === 'timeline' && (
          <div className="chart-container">
            <h3>Alert Firing Timeline (Last 30 Days)</h3>
            <p className="chart-description">
              Frequency of alert firing over time. Darker colors indicate higher frequency.
            </p>
            <svg ref={timelineChartRef} width="800" height="400" className="timeline-chart"></svg>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} className="tuning-tooltip"></div>
    </div>
  );
};

export default AlertTuningRecommendations;