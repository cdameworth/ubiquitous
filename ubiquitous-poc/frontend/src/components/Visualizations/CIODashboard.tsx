import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './CIODashboard.css';

interface TechnicalMetric {
  id: string;
  category: 'infrastructure' | 'security' | 'performance' | 'architecture' | 'compliance';
  name: string;
  currentValue: number;
  target: number;
  unit: 'percentage' | 'count' | 'hours' | 'score' | 'incidents';
  status: 'critical' | 'warning' | 'good' | 'excellent';
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  description: string;
  technicalDetails: string;
  remediation?: string;
}

interface SystemHealth {
  category: string;
  systems: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastIncident?: Date;
  }>;
}

interface TechnologyStack {
  layer: string;
  technologies: Array<{
    name: string;
    version: string;
    status: 'current' | 'outdated' | 'deprecated';
    securityScore: number;
    licenseCompliance: boolean;
    updateAvailable?: string;
  }>;
}

interface ArchitectureInsight {
  domain: string;
  complexity: number;
  maintainability: number;
  scalability: number;
  security: number;
  recommendations: string[];
  technicalDebt: number;
}

const CIODashboard: React.FC = () => {
  const [technicalMetrics, setTechnicalMetrics] = useState<TechnicalMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [technologyStack, setTechnologyStack] = useState<TechnologyStack[]>([]);
  const [architectureInsights, setArchitectureInsights] = useState<ArchitectureInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');
  const [loading, setLoading] = useState(true);

  const healthChartRef = useRef<SVGSVGElement>(null);
  const performanceChartRef = useRef<SVGSVGElement>(null);
  const architectureChartRef = useRef<SVGSVGElement>(null);
  const complianceChartRef = useRef<SVGSVGElement>(null);

  const mockTechnicalMetrics: TechnicalMetric[] = [
    {
      id: 'system-availability',
      category: 'infrastructure',
      name: 'System Availability',
      currentValue: 99.97,
      target: 99.9,
      unit: 'percentage',
      status: 'excellent',
      trend: 'stable',
      lastUpdated: new Date(),
      description: 'Overall system uptime across all critical services',
      technicalDetails: 'Measured across 15 critical services with 5-minute monitoring intervals',
      remediation: 'Continue current monitoring and incident response procedures'
    },
    {
      id: 'security-vulnerabilities',
      category: 'security',
      name: 'High-Risk Vulnerabilities',
      currentValue: 12,
      target: 5,
      unit: 'count',
      status: 'warning',
      trend: 'declining',
      lastUpdated: new Date(),
      description: 'Critical and high-severity security vulnerabilities requiring immediate attention',
      technicalDetails: '8 critical, 4 high-severity vulnerabilities across infrastructure and applications',
      remediation: 'Prioritize patching of Log4j and OpenSSL vulnerabilities in next sprint'
    },
    {
      id: 'deployment-success-rate',
      category: 'performance',
      name: 'Deployment Success Rate',
      currentValue: 94.2,
      target: 95.0,
      unit: 'percentage',
      status: 'good',
      trend: 'improving',
      lastUpdated: new Date(),
      description: 'Percentage of successful deployments without rollback',
      technicalDetails: '847 deployments this month, 49 requiring rollback',
      remediation: 'Enhance automated testing coverage and improve canary deployment processes'
    },
    {
      id: 'mean-time-to-recovery',
      category: 'performance',
      name: 'Mean Time to Recovery (MTTR)',
      currentValue: 18,
      target: 15,
      unit: 'hours',
      status: 'warning',
      trend: 'improving',
      lastUpdated: new Date(),
      description: 'Average time to resolve critical incidents',
      technicalDetails: 'Based on 23 critical incidents over the last quarter',
      remediation: 'Implement automated incident response playbooks and improve monitoring'
    },
    {
      id: 'api-performance',
      category: 'performance',
      name: 'API Response Time P95',
      currentValue: 1.8,
      target: 2.0,
      unit: 'hours',
      status: 'good',
      trend: 'stable',
      lastUpdated: new Date(),
      description: '95th percentile API response time across all services',
      technicalDetails: 'Measured across 12 API services with 1-minute granularity',
      remediation: 'Continue current performance optimization initiatives'
    },
    {
      id: 'technical-debt-score',
      category: 'architecture',
      name: 'Technical Debt Score',
      currentValue: 7.2,
      target: 5.0,
      unit: 'score',
      status: 'warning',
      trend: 'stable',
      lastUpdated: new Date(),
      description: 'Overall technical debt based on code quality and architecture metrics',
      technicalDetails: 'Calculated from code complexity, test coverage, and architectural violations',
      remediation: 'Allocate 20% sprint capacity to technical debt reduction initiatives'
    },
    {
      id: 'compliance-score',
      category: 'compliance',
      name: 'Regulatory Compliance Score',
      currentValue: 87,
      target: 95,
      unit: 'percentage',
      status: 'warning',
      trend: 'improving',
      lastUpdated: new Date(),
      description: 'Overall compliance with regulatory requirements (SOX, PCI, GDPR)',
      technicalDetails: 'Based on automated compliance checks and manual audits',
      remediation: 'Address data retention policy gaps and enhance access control logging'
    }
  ];

  const mockSystemHealth: SystemHealth[] = [
    {
      category: 'Trading Infrastructure',
      systems: [
        {
          name: 'Trading API',
          status: 'healthy',
          uptime: 99.98,
          responseTime: 145,
          errorRate: 0.02,
          lastIncident: new Date('2024-08-15')
        },
        {
          name: 'Order Management',
          status: 'healthy',
          uptime: 99.95,
          responseTime: 89,
          errorRate: 0.01
        },
        {
          name: 'Risk Engine',
          status: 'warning',
          uptime: 99.87,
          responseTime: 234,
          errorRate: 0.08,
          lastIncident: new Date('2024-08-25')
        },
        {
          name: 'Settlement Service',
          status: 'healthy',
          uptime: 99.99,
          responseTime: 67,
          errorRate: 0.005
        }
      ]
    },
    {
      category: 'Data Infrastructure',
      systems: [
        {
          name: 'PostgreSQL Cluster',
          status: 'healthy',
          uptime: 100.0,
          responseTime: 12,
          errorRate: 0.001
        },
        {
          name: 'Redis Cache',
          status: 'healthy',
          uptime: 99.99,
          responseTime: 1.2,
          errorRate: 0.002
        },
        {
          name: 'Data Pipeline',
          status: 'warning',
          uptime: 99.78,
          responseTime: 2340,
          errorRate: 0.15,
          lastIncident: new Date('2024-08-20')
        }
      ]
    },
    {
      category: 'Security Infrastructure',
      systems: [
        {
          name: 'Authentication Service',
          status: 'healthy',
          uptime: 99.96,
          responseTime: 78,
          errorRate: 0.01
        },
        {
          name: 'Security Scanner',
          status: 'critical',
          uptime: 95.2,
          responseTime: 5670,
          errorRate: 2.3,
          lastIncident: new Date('2024-08-28')
        },
        {
          name: 'Audit Logging',
          status: 'healthy',
          uptime: 99.94,
          responseTime: 234,
          errorRate: 0.03
        }
      ]
    }
  ];

  const mockTechnologyStack: TechnologyStack[] = [
    {
      layer: 'Frontend',
      technologies: [
        {
          name: 'React',
          version: '18.2.0',
          status: 'current',
          securityScore: 98,
          licenseCompliance: true
        },
        {
          name: 'TypeScript',
          version: '4.9.5',
          status: 'current',
          securityScore: 99,
          licenseCompliance: true,
          updateAvailable: '5.1.6'
        },
        {
          name: 'D3.js',
          version: '7.8.5',
          status: 'current',
          securityScore: 95,
          licenseCompliance: true
        }
      ]
    },
    {
      layer: 'Backend',
      technologies: [
        {
          name: 'FastAPI',
          version: '0.100.1',
          status: 'current',
          securityScore: 92,
          licenseCompliance: true,
          updateAvailable: '0.103.0'
        },
        {
          name: 'Python',
          version: '3.11.4',
          status: 'current',
          securityScore: 96,
          licenseCompliance: true
        },
        {
          name: 'Node.js',
          version: '16.14.2',
          status: 'outdated',
          securityScore: 78,
          licenseCompliance: true,
          updateAvailable: '18.17.1'
        }
      ]
    },
    {
      layer: 'Database',
      technologies: [
        {
          name: 'PostgreSQL',
          version: '15.3',
          status: 'current',
          securityScore: 97,
          licenseCompliance: true
        },
        {
          name: 'Neo4j',
          version: '5.13.0',
          status: 'current',
          securityScore: 94,
          licenseCompliance: true
        },
        {
          name: 'Redis',
          version: '7.0.12',
          status: 'current',
          securityScore: 91,
          licenseCompliance: true
        }
      ]
    },
    {
      layer: 'Infrastructure',
      technologies: [
        {
          name: 'Docker',
          version: '24.0.5',
          status: 'current',
          securityScore: 89,
          licenseCompliance: true
        },
        {
          name: 'Kubernetes',
          version: '1.27.3',
          status: 'current',
          securityScore: 93,
          licenseCompliance: true,
          updateAvailable: '1.28.2'
        },
        {
          name: 'Nginx',
          version: '1.21.6',
          status: 'outdated',
          securityScore: 72,
          licenseCompliance: true,
          updateAvailable: '1.25.2'
        }
      ]
    }
  ];

  const mockArchitectureInsights: ArchitectureInsight[] = [
    {
      domain: 'Trading Services',
      complexity: 7.2,
      maintainability: 8.1,
      scalability: 9.0,
      security: 7.8,
      technicalDebt: 6.5,
      recommendations: [
        'Implement circuit breakers for external API calls',
        'Refactor order processing logic to reduce complexity',
        'Add comprehensive integration tests for critical paths'
      ]
    },
    {
      domain: 'Data Pipeline',
      complexity: 8.9,
      maintainability: 6.2,
      scalability: 7.5,
      security: 8.9,
      technicalDebt: 8.1,
      recommendations: [
        'Migrate to event-driven architecture',
        'Implement data lineage tracking',
        'Standardize error handling across pipeline stages'
      ]
    },
    {
      domain: 'Security Infrastructure',
      complexity: 6.8,
      maintainability: 7.9,
      scalability: 8.2,
      security: 9.2,
      technicalDebt: 5.3,
      recommendations: [
        'Implement zero-trust network architecture',
        'Enhance automated threat detection',
        'Standardize security logging format'
      ]
    },
    {
      domain: 'Frontend Applications',
      complexity: 5.4,
      maintainability: 8.9,
      scalability: 7.8,
      security: 7.2,
      technicalDebt: 4.1,
      recommendations: [
        'Implement micro-frontend architecture',
        'Enhance client-side security measures',
        'Optimize bundle size and loading performance'
      ]
    }
  ];

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setTechnicalMetrics(mockTechnicalMetrics);
      setSystemHealth(mockSystemHealth);
      setTechnologyStack(mockTechnologyStack);
      setArchitectureInsights(mockArchitectureInsights);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      renderHealthChart();
      renderPerformanceChart();
      renderArchitectureChart();
      renderComplianceChart();
    }
  }, [loading, selectedCategory]);

  const renderHealthChart = () => {
    if (!healthChartRef.current) return;

    const svg = d3.select(healthChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 60, left: 100 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Flatten system health data
    const systems = systemHealth.flatMap(category => 
      category.systems.map(system => ({
        ...system,
        category: category.category
      }))
    );

    const yScale = d3.scaleBand()
      .domain(systems.map(s => s.name))
      .range([0, height])
      .padding(0.1);

    const xScale = d3.scaleLinear()
      .domain([95, 100])
      .range([0, width]);

    const colorScale = d3.scaleOrdinal()
      .domain(['healthy', 'warning', 'critical'])
      .range(['#10b981', '#f59e0b', '#ef4444']);

    // Create bars
    g.selectAll('.uptime-bar')
      .data(systems)
      .enter().append('rect')
      .attr('class', 'uptime-bar')
      .attr('x', d => xScale(95))
      .attr('y', d => yScale(d.name)!)
      .attr('width', d => xScale(d.uptime) - xScale(95))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.status) as string)
      .attr('rx', 4);

    // Add uptime labels
    g.selectAll('.uptime-label')
      .data(systems)
      .enter().append('text')
      .attr('class', 'uptime-label')
      .attr('x', d => xScale(d.uptime) + 5)
      .attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text(d => `${d.uptime.toFixed(2)}%`);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('System Health - Uptime Percentage');
  };

  const renderPerformanceChart = () => {
    if (!performanceChartRef.current) return;

    const svg = d3.select(performanceChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter performance metrics
    const performanceMetrics = technicalMetrics.filter(m => 
      m.category === 'performance' && m.unit !== 'hours'
    );

    const xScale = d3.scaleBand()
      .domain(performanceMetrics.map(d => d.name))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['excellent', 'good', 'warning', 'critical'])
      .range(['#10b981', '#84cc16', '#f59e0b', '#ef4444']);

    // Create bars for current values
    g.selectAll('.current-bar')
      .data(performanceMetrics)
      .enter().append('rect')
      .attr('class', 'current-bar')
      .attr('x', d => xScale(d.name)!)
      .attr('width', xScale.bandwidth() * 0.7)
      .attr('y', d => yScale(d.currentValue))
      .attr('height', d => height - yScale(d.currentValue))
      .attr('fill', d => colorScale(d.status) as string)
      .attr('rx', 4);

    // Create target lines
    g.selectAll('.target-line')
      .data(performanceMetrics)
      .enter().append('line')
      .attr('class', 'target-line')
      .attr('x1', d => xScale(d.name)!)
      .attr('x2', d => xScale(d.name)! + xScale.bandwidth())
      .attr('y1', d => yScale(d.target))
      .attr('y2', d => yScale(d.target))
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add value labels
    g.selectAll('.value-label')
      .data(performanceMetrics)
      .enter().append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.name)! + xScale.bandwidth() * 0.35)
      .attr('y', d => yScale(d.currentValue) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => `${d.currentValue}${d.unit === 'percentage' ? '%' : ''}`);

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
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));

    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Performance Metrics vs Targets');
  };

  const renderArchitectureChart = () => {
    if (!architectureChartRef.current) return;

    const svg = d3.select(architectureChartRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const categories = ['complexity', 'maintainability', 'scalability', 'security'];
    const angleSlice = Math.PI * 2 / categories.length;

    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, 10]);

    // Create grid
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
        .text((level * 2).toString());
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
        .text(category.charAt(0).toUpperCase() + category.slice(1));
    });

    // Colors for different domains
    const colorScale = d3.scaleOrdinal()
      .domain(architectureInsights.map(d => d.domain))
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444']);

    // Plot each domain
    architectureInsights.forEach((domain, domainIndex) => {
      const points: [number, number][] = categories.map((category, i) => {
        const angle = i * angleSlice - Math.PI / 2;
        const value = domain[category as keyof ArchitectureInsight] as number;
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
        .style("stroke", colorScale(domain.domain) as string)
        .style("stroke-width", 2)
        .style("fill", colorScale(domain.domain) as string)
        .style("fill-opacity", 0.1);

      // Add dots for each point
      points.slice(0, -1).forEach((point, i) => {
        g.append("circle")
          .attr("cx", point[0])
          .attr("cy", point[1])
          .attr("r", 3)
          .style("fill", colorScale(domain.domain) as string);
      });
    });

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(20, 20)`);

    architectureInsights.forEach((domain, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("circle")
        .attr("r", 6)
        .style("fill", colorScale(domain.domain) as string);

      legendRow.append("text")
        .attr("x", 15)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .text(domain.domain);
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Architecture Quality Assessment');
  };

  const renderComplianceChart = () => {
    if (!complianceChartRef.current) return;

    const svg = d3.select(complianceChartRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    const complianceData = [
      { name: 'SOX Compliance', value: 92, color: '#10b981' },
      { name: 'PCI DSS', value: 88, color: '#3b82f6' },
      { name: 'GDPR', value: 95, color: '#8b5cf6' },
      { name: 'ISO 27001', value: 84, color: '#f59e0b' }
    ];

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(complianceData))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color);

    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(d => `${d.data.value}%`);

    // Add center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Overall');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.8em')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('fill', '#3b82f6')
      .text('90%');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 20)`);

    complianceData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color);

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .text(item.name);
    });

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Compliance Scores');
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'warning': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div className="cio-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading technical infrastructure analysis...</p>
      </div>
    );
  }

  return (
    <div className="cio-dashboard">
      <div className="cio-header">
        <div>
          <h1 className="cio-title">CIO Technical Dashboard</h1>
          <p className="cio-subtitle">Infrastructure performance, security, and architectural insights</p>
        </div>
        <div className="category-selector">
          <label>Focus Area: </label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="overview">Overview</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="architecture">Architecture</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>

      {/* Key Technical Metrics */}
      <div className="technical-metrics">
        {technicalMetrics.slice(0, 4).map(metric => (
          <div key={metric.id} className={`metric-card ${metric.status}`}>
            <div className="metric-header">
              <span className="status-icon">{getStatusIcon(metric.status)}</span>
              <span className="trend-icon">{getTrendIcon(metric.trend)}</span>
            </div>
            <div className="metric-content">
              <div className="metric-value">
                {metric.currentValue}
                {metric.unit === 'percentage' ? '%' : 
                 metric.unit === 'hours' ? 'h' :
                 metric.unit === 'count' ? '' : ''}
              </div>
              <div className="metric-name">{metric.name}</div>
              <div className="metric-target">
                Target: {metric.target}{metric.unit === 'percentage' ? '%' : metric.unit === 'hours' ? 'h' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-panel">
          <svg ref={healthChartRef} width="600" height="400"></svg>
        </div>
        
        <div className="chart-panel">
          <svg ref={performanceChartRef} width="600" height="400"></svg>
        </div>
        
        <div className="chart-panel">
          <svg ref={architectureChartRef} width="500" height="500"></svg>
        </div>
        
        <div className="chart-panel">
          <svg ref={complianceChartRef} width="400" height="300"></svg>
        </div>
      </div>

      {/* System Health Details */}
      <div className="system-health-section">
        <h3>System Health Details</h3>
        <div className="health-categories">
          {systemHealth.map(category => (
            <div key={category.category} className="health-category">
              <h4>{category.category}</h4>
              <div className="systems-grid">
                {category.systems.map(system => (
                  <div key={system.name} className={`system-card ${system.status}`}>
                    <div className="system-header">
                      <span className="system-name">{system.name}</span>
                      <span className="system-status">{getStatusIcon(system.status)}</span>
                    </div>
                    <div className="system-metrics">
                      <div className="system-metric">
                        <span>Uptime:</span>
                        <span>{system.uptime.toFixed(2)}%</span>
                      </div>
                      <div className="system-metric">
                        <span>Response:</span>
                        <span>{system.responseTime}ms</span>
                      </div>
                      <div className="system-metric">
                        <span>Error Rate:</span>
                        <span>{system.errorRate.toFixed(3)}%</span>
                      </div>
                    </div>
                    {system.lastIncident && (
                      <div className="last-incident">
                        Last incident: {system.lastIncident.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Overview */}
      <div className="technology-stack-section">
        <h3>Technology Stack Status</h3>
        <div className="stack-layers">
          {technologyStack.map(layer => (
            <div key={layer.layer} className="stack-layer">
              <h4>{layer.layer}</h4>
              <div className="technologies-grid">
                {layer.technologies.map(tech => (
                  <div key={tech.name} className={`tech-card ${tech.status}`}>
                    <div className="tech-header">
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-version">{tech.version}</span>
                    </div>
                    <div className="tech-details">
                      <div className="security-score">
                        Security: {tech.securityScore}%
                      </div>
                      <div className="license-status">
                        {tech.licenseCompliance ? '✅ Licensed' : '❌ License Issue'}
                      </div>
                      {tech.updateAvailable && (
                        <div className="update-available">
                          Update: {tech.updateAvailable}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Insights */}
      <div className="architecture-insights-section">
        <h3>Architecture Quality Insights</h3>
        <div className="insights-grid">
          {architectureInsights.map(insight => (
            <div key={insight.domain} className="insight-card">
              <div className="insight-header">
                <h4>{insight.domain}</h4>
                <div className="debt-score">
                  Technical Debt: {insight.technicalDebt}/10
                </div>
              </div>
              <div className="quality-metrics">
                <div className="quality-metric">
                  <span>Complexity:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill complexity" 
                      style={{ width: `${insight.complexity * 10}%` }}
                    ></div>
                  </div>
                  <span>{insight.complexity}/10</span>
                </div>
                <div className="quality-metric">
                  <span>Maintainability:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill maintainability" 
                      style={{ width: `${insight.maintainability * 10}%` }}
                    ></div>
                  </div>
                  <span>{insight.maintainability}/10</span>
                </div>
                <div className="quality-metric">
                  <span>Scalability:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill scalability" 
                      style={{ width: `${insight.scalability * 10}%` }}
                    ></div>
                  </div>
                  <span>{insight.scalability}/10</span>
                </div>
                <div className="quality-metric">
                  <span>Security:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill security" 
                      style={{ width: `${insight.security * 10}%` }}
                    ></div>
                  </div>
                  <span>{insight.security}/10</span>
                </div>
              </div>
              <div className="recommendations">
                <h5>Recommendations:</h5>
                <ul>
                  {insight.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CIODashboard;