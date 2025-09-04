import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './ObservabilityGapAnalysis.css';

interface ObservabilityMetric {
  id: string;
  category: 'infrastructure' | 'application' | 'business' | 'security' | 'user_experience';
  name: string;
  description: string;
  currentCoverage: number; // 0-100
  recommendedCoverage: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  services: string[];
  clusters: string[];
  toolsRequired: string[];
  estimatedImplementationTime: string;
  businessImpact: string;
  technicalComplexity: 'low' | 'medium' | 'high';
  alertsConfigured: boolean;
  dashboardsConfigured: boolean;
  sloConfigured: boolean;
  runbookExists: boolean;
  lastReviewed: Date;
  gaps: ObservabilityGap[];
}

interface ObservabilityGap {
  id: string;
  type: 'missing_metric' | 'insufficient_coverage' | 'poor_quality' | 'missing_alerting' | 'missing_dashboard' | 'missing_runbook';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  recommendation: string;
  toolsNeeded: string[];
  estimatedEffort: string;
  dependencies: string[];
}

interface ServiceCoverage {
  serviceName: string;
  cluster: string;
  overallCoverage: number;
  categoryScores: {
    infrastructure: number;
    application: number;
    business: number;
    security: number;
    user_experience: number;
  };
  criticalGaps: number;
  alertsCount: number;
  dashboardsCount: number;
  sloCount: number;
}

const ObservabilityGapAnalysis: React.FC = () => {
  const [metrics, setMetrics] = useState<ObservabilityMetric[]>([]);
  const [filteredMetrics, setFilteredMetrics] = useState<ObservabilityMetric[]>([]);
  const [serviceCoverage, setServiceCoverage] = useState<ServiceCoverage[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ObservabilityMetric | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    cluster: 'all',
    coverage: 'all' // all, good (>80%), needs_improvement (50-80%), poor (<50%)
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'heatmap' | 'radar' | 'timeline' | 'list'>('heatmap');
  const [loading, setLoading] = useState(true);
  
  const heatmapRef = useRef<SVGSVGElement>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const mockMetrics: ObservabilityMetric[] = [
    {
      id: 'metric-1',
      category: 'infrastructure',
      name: 'CPU Utilization Monitoring',
      description: 'Monitor CPU usage across all containers and nodes',
      currentCoverage: 85,
      recommendedCoverage: 95,
      priority: 'high',
      services: ['trading-api', 'portfolio-service', 'risk-calculator'],
      clusters: ['prod-trading', 'prod-portfolio'],
      toolsRequired: ['Prometheus', 'Grafana'],
      estimatedImplementationTime: '2 days',
      businessImpact: 'Critical for performance optimization and capacity planning',
      technicalComplexity: 'low',
      alertsConfigured: true,
      dashboardsConfigured: true,
      sloConfigured: false,
      runbookExists: true,
      lastReviewed: new Date('2024-08-15'),
      gaps: [
        {
          id: 'gap-1',
          type: 'insufficient_coverage',
          severity: 'medium',
          description: 'Missing CPU monitoring for 3 worker nodes',
          impact: 'Blind spots in infrastructure monitoring',
          recommendation: 'Deploy node-exporter on remaining worker nodes',
          toolsNeeded: ['node-exporter'],
          estimatedEffort: '4 hours',
          dependencies: []
        }
      ]
    },
    {
      id: 'metric-2',
      category: 'application',
      name: 'Application Response Time',
      description: 'Track API response times and latency percentiles',
      currentCoverage: 60,
      recommendedCoverage: 90,
      priority: 'critical',
      services: ['trading-api', 'auth-service'],
      clusters: ['prod-trading'],
      toolsRequired: ['Prometheus', 'Jaeger', 'Grafana'],
      estimatedImplementationTime: '1 week',
      businessImpact: 'Direct impact on user experience and trading performance',
      technicalComplexity: 'medium',
      alertsConfigured: false,
      dashboardsConfigured: true,
      sloConfigured: false,
      runbookExists: false,
      lastReviewed: new Date('2024-07-20'),
      gaps: [
        {
          id: 'gap-2',
          type: 'missing_alerting',
          severity: 'critical',
          description: 'No alerting configured for response time SLA breaches',
          impact: 'Unable to proactively respond to performance degradation',
          recommendation: 'Configure multi-tier alerting for P50, P95, P99 latencies',
          toolsNeeded: ['AlertManager', 'PagerDuty'],
          estimatedEffort: '2 days',
          dependencies: ['metric instrumentation']
        },
        {
          id: 'gap-3',
          type: 'missing_runbook',
          severity: 'high',
          description: 'No runbook for response time incidents',
          impact: 'Increased MTTR during performance incidents',
          recommendation: 'Create comprehensive runbook for latency troubleshooting',
          toolsNeeded: [],
          estimatedEffort: '3 days',
          dependencies: []
        }
      ]
    },
    {
      id: 'metric-3',
      category: 'business',
      name: 'Trading Volume Metrics',
      description: 'Monitor trading volume, success rates, and revenue impact',
      currentCoverage: 40,
      recommendedCoverage: 95,
      priority: 'critical',
      services: ['trading-api', 'settlement-service'],
      clusters: ['prod-trading'],
      toolsRequired: ['Custom metrics', 'Grafana', 'ElasticSearch'],
      estimatedImplementationTime: '3 weeks',
      businessImpact: 'Essential for understanding business health and revenue tracking',
      technicalComplexity: 'high',
      alertsConfigured: false,
      dashboardsConfigured: false,
      sloConfigured: false,
      runbookExists: false,
      lastReviewed: new Date('2024-06-10'),
      gaps: [
        {
          id: 'gap-4',
          type: 'missing_metric',
          severity: 'critical',
          description: 'No business metrics collection infrastructure',
          impact: 'No visibility into business KPIs and revenue impact',
          recommendation: 'Implement comprehensive business metrics collection',
          toolsNeeded: ['Custom application metrics', 'Kafka', 'ElasticSearch'],
          estimatedEffort: '2 weeks',
          dependencies: ['application instrumentation']
        }
      ]
    },
    {
      id: 'metric-4',
      category: 'security',
      name: 'Authentication Failure Monitoring',
      description: 'Track failed login attempts, suspicious activities, and security events',
      currentCoverage: 25,
      recommendedCoverage: 100,
      priority: 'critical',
      services: ['auth-service', 'trading-api'],
      clusters: ['prod-trading', 'prod-auth'],
      toolsRequired: ['Security monitoring', 'SIEM', 'Grafana'],
      estimatedImplementationTime: '2 weeks',
      businessImpact: 'Critical for security posture and compliance',
      technicalComplexity: 'high',
      alertsConfigured: false,
      dashboardsConfigured: false,
      sloConfigured: false,
      runbookExists: false,
      lastReviewed: new Date('2024-05-15'),
      gaps: [
        {
          id: 'gap-5',
          type: 'missing_metric',
          severity: 'critical',
          description: 'No security event monitoring configured',
          impact: 'Blind to security threats and compliance violations',
          recommendation: 'Implement comprehensive security monitoring and SIEM integration',
          toolsNeeded: ['Splunk', 'Falco', 'Custom security metrics'],
          estimatedEffort: '1 week',
          dependencies: ['SIEM setup']
        }
      ]
    },
    {
      id: 'metric-5',
      category: 'user_experience',
      name: 'User Journey Monitoring',
      description: 'Track user flows, conversion rates, and experience metrics',
      currentCoverage: 30,
      recommendedCoverage: 85,
      priority: 'high',
      services: ['web-frontend', 'mobile-app'],
      clusters: ['prod-frontend'],
      toolsRequired: ['RUM', 'Analytics', 'Grafana'],
      estimatedImplementationTime: '2 weeks',
      businessImpact: 'Direct correlation to user satisfaction and retention',
      technicalComplexity: 'medium',
      alertsConfigured: false,
      dashboardsConfigured: true,
      sloConfigured: false,
      runbookExists: false,
      lastReviewed: new Date('2024-07-01'),
      gaps: [
        {
          id: 'gap-6',
          type: 'insufficient_coverage',
          severity: 'high',
          description: 'Limited user journey tracking, missing key conversion funnels',
          impact: 'Unable to optimize user experience and identify drop-off points',
          recommendation: 'Implement comprehensive user journey tracking with analytics',
          toolsNeeded: ['Google Analytics', 'FullStory', 'Custom metrics'],
          estimatedEffort: '1 week',
          dependencies: []
        }
      ]
    }
  ];

  const mockServiceCoverage: ServiceCoverage[] = [
    {
      serviceName: 'trading-api',
      cluster: 'prod-trading',
      overallCoverage: 65,
      categoryScores: {
        infrastructure: 85,
        application: 60,
        business: 40,
        security: 25,
        user_experience: 50
      },
      criticalGaps: 3,
      alertsCount: 8,
      dashboardsCount: 4,
      sloCount: 1
    },
    {
      serviceName: 'portfolio-service',
      cluster: 'prod-portfolio',
      overallCoverage: 72,
      categoryScores: {
        infrastructure: 90,
        application: 75,
        business: 60,
        security: 30,
        user_experience: 45
      },
      criticalGaps: 2,
      alertsCount: 12,
      dashboardsCount: 6,
      sloCount: 3
    },
    {
      serviceName: 'auth-service',
      cluster: 'prod-auth',
      overallCoverage: 45,
      categoryScores: {
        infrastructure: 80,
        application: 55,
        business: 20,
        security: 25,
        user_experience: 35
      },
      criticalGaps: 5,
      alertsCount: 3,
      dashboardsCount: 2,
      sloCount: 0
    },
    {
      serviceName: 'risk-calculator',
      cluster: 'prod-risk',
      overallCoverage: 58,
      categoryScores: {
        infrastructure: 75,
        application: 70,
        business: 45,
        security: 40,
        user_experience: 30
      },
      criticalGaps: 2,
      alertsCount: 6,
      dashboardsCount: 3,
      sloCount: 1
    }
  ];

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setMetrics(mockMetrics);
      setFilteredMetrics(mockMetrics);
      setServiceCoverage(mockServiceCoverage);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = metrics.filter(metric => {
      const matchesSearch = searchTerm === '' || 
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        metric.services.some(service => 
          service.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory = filters.category === 'all' || 
        metric.category === filters.category;

      const matchesPriority = filters.priority === 'all' ||
        metric.priority === filters.priority;

      const matchesCluster = filters.cluster === 'all' ||
        metric.clusters.some(cluster => cluster === filters.cluster);

      const matchesCoverage = filters.coverage === 'all' ||
        (filters.coverage === 'good' && metric.currentCoverage > 80) ||
        (filters.coverage === 'needs_improvement' && metric.currentCoverage >= 50 && metric.currentCoverage <= 80) ||
        (filters.coverage === 'poor' && metric.currentCoverage < 50);

      return matchesSearch && matchesCategory && matchesPriority && 
             matchesCluster && matchesCoverage;
    });

    setFilteredMetrics(filtered);
  }, [metrics, searchTerm, filters]);

  useEffect(() => {
    if (viewMode === 'heatmap' && filteredMetrics.length > 0) {
      renderHeatmap();
    } else if (viewMode === 'radar' && filteredMetrics.length > 0) {
      renderRadarChart();
    } else if (viewMode === 'timeline' && filteredMetrics.length > 0) {
      renderTimeline();
    }
  }, [filteredMetrics, serviceCoverage, viewMode]);

  const renderHeatmap = () => {
    if (!heatmapRef.current) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 100, bottom: 120, left: 200 };
    const width = 800 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter serviceCoverage based on filtered metrics
    const filteredServiceNames = new Set(filteredMetrics.flatMap(m => m.services));
    const filteredClusters = new Set(filteredMetrics.flatMap(m => m.clusters));
    const filteredServiceCoverage = serviceCoverage.filter(service => 
      filteredServiceNames.has(service.serviceName) || 
      filteredClusters.has(service.cluster)
    );

    // Prepare data for heatmap
    const services = Array.from(new Set(filteredServiceCoverage.map(s => s.serviceName)));
    const categories = ['infrastructure', 'application', 'business', 'security', 'user_experience'];

    const data: any[] = [];
    filteredServiceCoverage.forEach(service => {
      categories.forEach(category => {
        data.push({
          service: service.serviceName,
          category: category,
          value: service.categoryScores[category as keyof typeof service.categoryScores],
          cluster: service.cluster
        });
      });
    });

    // Create scales
    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(services)
      .range([0, height])
      .padding(0.05);

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#dc2626', '#fbbf24', '#10b981']);

    // Create heatmap cells
    g.selectAll('.cell')
      .data(data)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.category)!)
      .attr('y', d => yScale(d.service)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', (event, d) => {
        showTooltip(event, `${d.service} - ${d.category}: ${d.value}%`);
      })
      .on('mouseout', hideTooltip);

    // Add cell labels
    g.selectAll('.cell-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'cell-label')
      .attr('x', d => xScale(d.category)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.service)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', d => d.value < 50 ? 'white' : 'black')
      .text(d => `${d.value}%`);

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')
      .style('font-size', '12px');

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + margin.left + 20}, ${margin.top})`);

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, 200]);

    const legendAxis = d3.axisRight(legendScale);

    const gradientId = 'coverage-gradient';
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#dc2626');

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#fbbf24');

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');

    legend.append('rect')
      .attr('width', 20)
      .attr('height', 200)
      .style('fill', `url(#${gradientId})`);

    legend.append('g')
      .attr('transform', 'translate(20, 0)')
      .call(legendAxis);
  };

  const renderRadarChart = () => {
    if (!radarRef.current || filteredMetrics.length === 0) return;

    const svg = d3.select(radarRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 600;
    const margin = 80;
    const radius = Math.min(width, height) / 2 - margin;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Filter serviceCoverage based on filtered metrics
    const filteredServiceNames = new Set(filteredMetrics.flatMap(m => m.services));
    const filteredClusters = new Set(filteredMetrics.flatMap(m => m.clusters));
    const filteredServiceCoverage = serviceCoverage.filter(service => 
      filteredServiceNames.has(service.serviceName) || 
      filteredClusters.has(service.cluster)
    );

    if (filteredServiceCoverage.length === 0) return;

    const categories = ['infrastructure', 'application', 'business', 'security', 'user_experience'];
    const angleSlice = Math.PI * 2 / categories.length;

    // Create scale
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, 100]);

    // Create radar grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = radius * (level / levels);
      
      g.append("circle")
        .attr("r", levelRadius)
        .style("fill", "none")
        .style("stroke", "#cdcdcd")
        .style("stroke-opacity", 0.5);

      g.append("text")
        .attr("x", 4)
        .attr("y", -levelRadius)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text((level * 20).toString());
    }

    // Create axes
    categories.forEach((category, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angle))
        .attr("y2", radius * Math.sin(angle))
        .style("stroke", "#cdcdcd")
        .style("stroke-width", "1px");

      g.append("text")
        .attr("x", (radius + 20) * Math.cos(angle))
        .attr("y", (radius + 20) * Math.sin(angle))
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(category.replace('_', ' '));
    });

    // Plot each service
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
    
    filteredServiceCoverage.forEach((service, serviceIndex) => {
      const points: [number, number][] = categories.map((category, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const value = service.categoryScores[category as keyof typeof service.categoryScores];
        const r = rScale(value);
        return [r * Math.cos(angle), r * Math.sin(angle)];
      });

      // Close the polygon
      points.push(points[0]);

      const line = d3.line<[number, number]>()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveLinearClosed);

      g.append("path")
        .datum(points)
        .attr("d", line)
        .style("stroke", colors[serviceIndex % colors.length])
        .style("stroke-width", 2)
        .style("fill", colors[serviceIndex % colors.length])
        .style("fill-opacity", 0.1);

      // Add dots
      points.slice(0, -1).forEach((point, i) => {
        g.append("circle")
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("r", 4)
          .style("fill", colors[serviceIndex % colors.length])
          .on("mouseover", (event) => {
            const category = categories[i];
            const value = service.categoryScores[category as keyof typeof service.categoryScores];
            showTooltip(event, `${service.serviceName} - ${category}: ${value}%`);
          })
          .on("mouseout", hideTooltip);
      });
    });

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, 20)`);

    filteredServiceCoverage.forEach((service, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("circle")
        .attr("r", 6)
        .style("fill", colors[i % colors.length]);

      legendRow.append("text")
        .attr("x", 15)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(service.serviceName);
    });
  };

  const renderTimeline = () => {
    if (!timelineRef.current) return;

    const svg = d3.select(timelineRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 200 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort metrics by priority and coverage gap
    const timelineData = filteredMetrics
      .map(metric => ({
        ...metric,
        gap: metric.recommendedCoverage - metric.currentCoverage,
        urgencyScore: (metric.recommendedCoverage - metric.currentCoverage) * 
                     (metric.priority === 'critical' ? 4 : 
                      metric.priority === 'high' ? 3 : 
                      metric.priority === 'medium' ? 2 : 1)
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    const yScale = d3.scaleBand()
      .domain(timelineData.map(d => d.name))
      .range([0, height])
      .padding(0.1);

    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    // Current coverage bars
    g.selectAll('.current-bar')
      .data(timelineData)
      .enter().append('rect')
      .attr('class', 'current-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.name)!)
      .attr('width', d => xScale(d.currentCoverage))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => {
        if (d.currentCoverage >= 80) return '#10b981';
        if (d.currentCoverage >= 50) return '#fbbf24';
        return '#ef4444';
      })
      .attr('opacity', 0.7);

    // Recommended coverage outline
    g.selectAll('.recommended-bar')
      .data(timelineData)
      .enter().append('rect')
      .attr('class', 'recommended-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.name)!)
      .attr('width', d => xScale(d.recommendedCoverage))
      .attr('height', yScale.bandwidth())
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add percentage labels
    g.selectAll('.percentage-label')
      .data(timelineData)
      .enter().append('text')
      .attr('class', 'percentage-label')
      .attr('x', d => xScale(d.currentCoverage) + 5)
      .attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => `${d.currentCoverage}%`);

    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '10px')
      .call(wrap, margin.left - 10);
  };

  // Text wrapping utility
  function wrap(text: any, width: number) {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line: string[] = [];
      let lineNumber = 0;
      const lineHeight = 1.1;
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy"));
      let tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", dy + "em");
      
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node()!.getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }

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

  const getCoverageStats = () => {
    const totalMetrics = filteredMetrics.length;
    const goodCoverage = filteredMetrics.filter(m => m.currentCoverage > 80).length;
    const needsImprovement = filteredMetrics.filter(m => m.currentCoverage >= 50 && m.currentCoverage <= 80).length;
    const poorCoverage = filteredMetrics.filter(m => m.currentCoverage < 50).length;
    const criticalGaps = filteredMetrics.filter(m => m.gaps.some(g => g.severity === 'critical')).length;

    return { totalMetrics, goodCoverage, needsImprovement, poorCoverage, criticalGaps };
  };

  const renderListView = () => {
    return (
      <div className="observability-list">
        {filteredMetrics.map(metric => (
          <div key={metric.id} className={`observability-item ${metric.priority}`}>
            <div className="metric-header">
              <div className="metric-info">
                <h3>{metric.name}</h3>
                <p className="metric-description">{metric.description}</p>
                <div className="metric-meta">
                  <span className="category">{metric.category.replace('_', ' ')}</span>
                  <span className="priority">{metric.priority}</span>
                  <span className="complexity">{metric.technicalComplexity} complexity</span>
                </div>
              </div>
              <div className="metric-coverage">
                <div className="coverage-bar">
                  <div 
                    className="coverage-fill" 
                    style={{ 
                      width: `${metric.currentCoverage}%`,
                      backgroundColor: metric.currentCoverage > 80 ? '#10b981' : 
                                     metric.currentCoverage > 50 ? '#fbbf24' : '#ef4444'
                    }}
                  ></div>
                  <div 
                    className="coverage-target" 
                    style={{ left: `${metric.recommendedCoverage}%` }}
                  ></div>
                </div>
                <div className="coverage-text">
                  {metric.currentCoverage}% / {metric.recommendedCoverage}%
                </div>
              </div>
            </div>
            
            <div className="metric-details">
              <div className="detail-section">
                <h4>Services</h4>
                <div className="service-tags">
                  {metric.services.map(service => (
                    <span key={service} className="service-tag">{service}</span>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Configuration Status</h4>
                <div className="config-status">
                  <span className={`status-item ${metric.alertsConfigured ? 'configured' : 'missing'}`}>
                    Alerts {metric.alertsConfigured ? '✓' : '✗'}
                  </span>
                  <span className={`status-item ${metric.dashboardsConfigured ? 'configured' : 'missing'}`}>
                    Dashboards {metric.dashboardsConfigured ? '✓' : '✗'}
                  </span>
                  <span className={`status-item ${metric.sloConfigured ? 'configured' : 'missing'}`}>
                    SLOs {metric.sloConfigured ? '✓' : '✗'}
                  </span>
                  <span className={`status-item ${metric.runbookExists ? 'configured' : 'missing'}`}>
                    Runbooks {metric.runbookExists ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Critical Gaps ({metric.gaps.length})</h4>
                <div className="gaps-list">
                  {metric.gaps.map(gap => (
                    <div key={gap.id} className={`gap-item ${gap.severity}`}>
                      <div className="gap-header">
                        <span className="gap-type">{gap.type.replace('_', ' ')}</span>
                        <span className={`gap-severity ${gap.severity}`}>{gap.severity}</span>
                      </div>
                      <p className="gap-description">{gap.description}</p>
                      <div className="gap-recommendation">
                        <strong>Recommendation:</strong> {gap.recommendation}
                      </div>
                      <div className="gap-effort">Effort: {gap.estimatedEffort}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const stats = getCoverageStats();

  if (loading) {
    return (
      <div className="observability-loading">
        <div className="spinner"></div>
        <p>Analyzing observability coverage...</p>
      </div>
    );
  }

  return (
    <div className="observability-gap-analysis">
      <div className="analysis-header">
        <div>
          <h2 className="analysis-title">Observability Gap Analysis</h2>
          <p className="analysis-subtitle">Identify and prioritize monitoring, alerting, and observability gaps</p>
        </div>
        <div className="analysis-actions">
          <button className="analyze-button">
            <span>🔍</span> Re-analyze
          </button>
          <button className="export-button">
            <span>📊</span> Export Report
          </button>
        </div>
      </div>

      {/* Coverage Overview */}
      <div className="coverage-overview">
        <div className="stat-card good">
          <div className="stat-number">{stats.goodCoverage}</div>
          <div className="stat-label">Good Coverage (&gt;80%)</div>
        </div>
        <div className="stat-card needs-improvement">
          <div className="stat-number">{stats.needsImprovement}</div>
          <div className="stat-label">Needs Improvement (50-80%)</div>
        </div>
        <div className="stat-card poor">
          <div className="stat-number">{stats.poorCoverage}</div>
          <div className="stat-label">Poor Coverage (&lt;50%)</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-number">{stats.criticalGaps}</div>
          <div className="stat-label">Critical Gaps</div>
        </div>
      </div>

      {/* Filters */}
      <div className="analysis-filters">
        <div className="filter-row">
          <div className="search-group">
            <input
              type="text"
              className="search-input"
              placeholder="Search metrics, services, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              className="filter-select"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="application">Application</option>
              <option value="business">Business</option>
              <option value="security">Security</option>
              <option value="user_experience">User Experience</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Priority</label>
            <select 
              className="filter-select"
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Coverage</label>
            <select 
              className="filter-select"
              value={filters.coverage}
              onChange={(e) => setFilters({...filters, coverage: e.target.value})}
            >
              <option value="all">All Coverage Levels</option>
              <option value="good">Good (&gt;80%)</option>
              <option value="needs_improvement">Needs Improvement (50-80%)</option>
              <option value="poor">Poor (&lt;50%)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Cluster</label>
            <select 
              className="filter-select"
              value={filters.cluster}
              onChange={(e) => setFilters({...filters, cluster: e.target.value})}
            >
              <option value="all">All Clusters</option>
              <option value="prod-trading">prod-trading</option>
              <option value="prod-portfolio">prod-portfolio</option>
              <option value="prod-auth">prod-auth</option>
              <option value="prod-risk">prod-risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`view-option ${viewMode === 'heatmap' ? 'active' : ''}`}
          onClick={() => setViewMode('heatmap')}
        >
          Heatmap
        </button>
        <button 
          className={`view-option ${viewMode === 'radar' ? 'active' : ''}`}
          onClick={() => setViewMode('radar')}
        >
          Radar Chart
        </button>
        <button 
          className={`view-option ${viewMode === 'timeline' ? 'active' : ''}`}
          onClick={() => setViewMode('timeline')}
        >
          Timeline
        </button>
        <button 
          className={`view-option ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          Detailed List
        </button>
      </div>

      {/* Main Content */}
      <div className="analysis-content">
        {viewMode === 'heatmap' && (
          <div className="chart-container">
            <h3>Service Coverage Heatmap</h3>
            <svg ref={heatmapRef} width="800" height="600" className="heatmap-chart"></svg>
          </div>
        )}
        
        {viewMode === 'radar' && (
          <div className="chart-container">
            <h3>Service Coverage Radar</h3>
            <svg ref={radarRef} width="600" height="600" className="radar-chart"></svg>
          </div>
        )}
        
        {viewMode === 'timeline' && (
          <div className="chart-container">
            <h3>Coverage Gap Timeline</h3>
            <svg ref={timelineRef} width="800" height="400" className="timeline-chart"></svg>
          </div>
        )}
        
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Tooltip */}
      <div ref={tooltipRef} className="analysis-tooltip"></div>
    </div>
  );
};

export default ObservabilityGapAnalysis;