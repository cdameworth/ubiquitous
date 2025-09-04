import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './SecurityScanner.css';

interface CVEDetails {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  description: string;
  publishedDate: Date;
  lastModified: Date;
  affectedProducts: string[];
  references: string[];
  exploitability: 'functional' | 'poc' | 'unproven' | 'high';
  impact: {
    confidentiality: 'high' | 'low' | 'none';
    integrity: 'high' | 'low' | 'none';
    availability: 'high' | 'low' | 'none';
  };
  attackVector: 'network' | 'adjacent' | 'local' | 'physical';
  attackComplexity: 'low' | 'high';
  authentication: 'none' | 'single' | 'multiple';
}

interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  cveId?: string;
  cveDetails?: CVEDetails;
  affectedAssets: string[];
  service: string;
  cluster: string;
  discoveryDate: Date;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_positive';
  category: 'code' | 'configuration' | 'dependency' | 'infrastructure' | 'policy';
  remediationSteps: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  exploitProbability: number;
  fixAvailable: boolean;
  patchVersion?: string;
  tags: string[];
}

interface SecurityScannerProps {
  vulnerabilities: SecurityVulnerability[];
  onVulnerabilitySelect: (vulnerability: SecurityVulnerability) => void;
  onStatusUpdate: (id: string, status: string) => void;
  selectedFilters: {
    severity: string[];
    status: string[];
    category: string[];
    cluster: string[];
  };
  onFilterChange: (filterType: string, value: string) => void;
  sortBy: 'severity' | 'cvss' | 'date' | 'impact';
  onSortChange: (sortBy: string) => void;
  className?: string;
}

const SecurityScanner: React.FC<SecurityScannerProps> = ({
  vulnerabilities,
  onVulnerabilitySelect,
  onStatusUpdate,
  selectedFilters,
  onFilterChange,
  sortBy,
  onSortChange,
  className = ''
}) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<SecurityVulnerability | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartView, setChartView] = useState<'severity' | 'timeline' | 'assets'>('severity');

  const severityColors = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#65a30d'
  };

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

  useEffect(() => {
    let filtered = vulnerabilities.filter(vuln => {
      const matchesSearch = !searchQuery || 
        vuln.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.cveId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vuln.service.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = !selectedFilters.severity || selectedFilters.severity.length === 0 || 
        selectedFilters.severity.includes(vuln.severity);

      const matchesStatus = !selectedFilters.status || selectedFilters.status.length === 0 || 
        selectedFilters.status.includes(vuln.status);

      const matchesCategory = !selectedFilters.category || selectedFilters.category.length === 0 || 
        selectedFilters.category.includes(vuln.category);

      const matchesCluster = !selectedFilters.cluster || selectedFilters.cluster.length === 0 || 
        selectedFilters.cluster.includes(vuln.cluster);

      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesCluster;
    });

    // Sort vulnerabilities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'cvss':
          return b.cvss - a.cvss;
        case 'date':
          return b.discoveryDate.getTime() - a.discoveryDate.getTime();
        case 'impact':
          const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return impactOrder[b.businessImpact] - impactOrder[a.businessImpact];
        default:
          return 0;
      }
    });

    setFilteredVulnerabilities(filtered);
  }, [vulnerabilities, selectedFilters, searchQuery, sortBy]);

  useEffect(() => {
    if (filteredVulnerabilities.length > 0) {
      drawChart();
    }
  }, [filteredVulnerabilities, chartView]);

  const drawChart = () => {
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    if (!chartRef.current) return;

    const { width, height } = { width: 400, height: 300 };
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    switch (chartView) {
      case 'severity':
        drawSeverityChart(svg, width, height, margin);
        break;
      case 'timeline':
        drawTimelineChart(svg, width, height, margin);
        break;
      case 'assets':
        drawAssetsChart(svg, width, height, margin);
        break;
    }
  };

  const drawSeverityChart = (svg: any, width: number, height: number, margin: any) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const severityCount = {
      critical: filteredVulnerabilities.filter(v => v.severity === 'critical').length,
      high: filteredVulnerabilities.filter(v => v.severity === 'high').length,
      medium: filteredVulnerabilities.filter(v => v.severity === 'medium').length,
      low: filteredVulnerabilities.filter(v => v.severity === 'low').length
    };

    const data = Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count
    }));

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.severity))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 1])
      .range([innerHeight, 0]);

    // Bars
    container.selectAll('.severity-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'severity-bar')
      .attr('x', d => xScale(d.severity) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', d => severityColors[d.severity as keyof typeof severityColors])
      .attr('rx', 4);

    // Labels
    container.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(d.severity) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .text(d => d.count);

    // Axes
    container.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-transform', 'capitalize');

    container.append('g')
      .call(d3.axisLeft(yScale));
  };

  const drawTimelineChart = (svg: any, width: number, height: number, margin: any) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group vulnerabilities by day
    const timeGroup = d3.rollup(
      filteredVulnerabilities,
      v => v.length,
      d => d3.timeDay(d.discoveryDate)
    );

    const timeData = Array.from(timeGroup, ([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (timeData.length === 0) return;

    const xScale = d3.scaleTime()
      .domain(d3.extent(timeData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.count) || 1])
      .range([innerHeight, 0]);

    const line = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);

    // Line
    container.append('path')
      .datum(timeData)
      .attr('class', 'timeline-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    // Points
    container.selectAll('.timeline-point')
      .data(timeData)
      .enter()
      .append('circle')
      .attr('class', 'timeline-point')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.count))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Axes
    container.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

    container.append('g')
      .call(d3.axisLeft(yScale));
  };

  const drawAssetsChart = (svg: any, width: number, height: number, margin: any) => {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Count vulnerabilities by service
    const serviceCount = d3.rollup(
      filteredVulnerabilities,
      v => v.length,
      d => d.service
    );

    const data = Array.from(serviceCount, ([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 services

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.service))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 1])
      .range([innerHeight, 0]);

    // Bars
    container.selectAll('.asset-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'asset-bar')
      .attr('x', d => xScale(d.service) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', '#8b5cf6')
      .attr('rx', 4);

    // Axes
    container.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    container.append('g')
      .call(d3.axisLeft(yScale));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getCVSSRating = (score: number) => {
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    return 'Low';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'acknowledged': return '#f59e0b';
      case 'false_positive': return '#6b7280';
      default: return '#ef4444';
    }
  };

  const getTotalRiskScore = () => {
    return filteredVulnerabilities.reduce((total, vuln) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const impactWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return total + (severityWeight[vuln.severity] * impactWeight[vuln.businessImpact] * vuln.exploitProbability);
    }, 0).toFixed(0);
  };

  return (
    <div className={`security-scanner ${className}`}>
      <div className="scanner-header">
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{filteredVulnerabilities.length}</span>
            <span className="stat-label">Total Vulnerabilities</span>
          </div>
          <div className="stat-card">
            <span className="stat-value critical">{filteredVulnerabilities.filter(v => v.severity === 'critical').length}</span>
            <span className="stat-label">Critical</span>
          </div>
          <div className="stat-card">
            <span className="stat-value high">{filteredVulnerabilities.filter(v => v.severity === 'high').length}</span>
            <span className="stat-label">High</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getTotalRiskScore()}</span>
            <span className="stat-label">Risk Score</span>
          </div>
        </div>
      </div>

      <div className="scanner-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search vulnerabilities, CVEs, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Severity:</label>
            {['critical', 'high', 'medium', 'low'].map(severity => (
              <button
                key={severity}
                className={`filter-button severity ${selectedFilters.severity.includes(severity) ? 'active' : ''}`}
                onClick={() => onFilterChange('severity', severity)}
                style={{ 
                  borderColor: selectedFilters.severity.includes(severity) ? severityColors[severity as keyof typeof severityColors] : '#d1d5db',
                  color: selectedFilters.severity.includes(severity) ? severityColors[severity as keyof typeof severityColors] : '#6b7280'
                }}
              >
                {getSeverityIcon(severity)} {severity}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <label>Status:</label>
            {['open', 'acknowledged', 'in_progress', 'resolved', 'false_positive'].map(status => (
              <button
                key={status}
                className={`filter-button ${selectedFilters.status.includes(status) ? 'active' : ''}`}
                onClick={() => onFilterChange('status', status)}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-section">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option value="severity">Severity</option>
            <option value="cvss">CVSS Score</option>
            <option value="date">Discovery Date</option>
            <option value="impact">Business Impact</option>
          </select>
        </div>
      </div>

      <div className="scanner-content">
        <div className="vulnerabilities-list">
          {filteredVulnerabilities.map(vulnerability => (
            <div 
              key={vulnerability.id} 
              className={`vulnerability-card ${selectedVulnerability?.id === vulnerability.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedVulnerability(vulnerability);
                onVulnerabilitySelect(vulnerability);
              }}
            >
              <div className="vulnerability-header">
                <div className="vulnerability-title">
                  <span className="severity-icon">{getSeverityIcon(vulnerability.severity)}</span>
                  <h3>{vulnerability.title}</h3>
                  {vulnerability.cveId && (
                    <span className="cve-badge">{vulnerability.cveId}</span>
                  )}
                </div>
                <div className="vulnerability-meta">
                  <span className="cvss-score">
                    CVSS: {vulnerability.cvss} ({getCVSSRating(vulnerability.cvss)})
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(vulnerability.status) }}
                  >
                    {vulnerability.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="vulnerability-description">{vulnerability.description}</p>

              <div className="vulnerability-details">
                <div className="detail-item">
                  <span className="detail-label">Service:</span>
                  <span className="detail-value">{vulnerability.service}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cluster:</span>
                  <span className="detail-value">{vulnerability.cluster}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{vulnerability.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Discovery:</span>
                  <span className="detail-value">{formatDate(vulnerability.discoveryDate)}</span>
                </div>
              </div>

              <div className="vulnerability-actions">
                <select
                  value={vulnerability.status}
                  onChange={(e) => onStatusUpdate(vulnerability.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
                
                {vulnerability.fixAvailable && (
                  <button className="fix-button">
                    Apply Fix {vulnerability.patchVersion && `(${vulnerability.patchVersion})`}
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredVulnerabilities.length === 0 && (
            <div className="no-vulnerabilities">
              <div className="no-vulnerabilities-icon">🛡️</div>
              <h3>No vulnerabilities found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        <div className="chart-section">
          <div className="chart-controls">
            <button
              className={`chart-button ${chartView === 'severity' ? 'active' : ''}`}
              onClick={() => setChartView('severity')}
            >
              By Severity
            </button>
            <button
              className={`chart-button ${chartView === 'timeline' ? 'active' : ''}`}
              onClick={() => setChartView('timeline')}
            >
              Timeline
            </button>
            <button
              className={`chart-button ${chartView === 'assets' ? 'active' : ''}`}
              onClick={() => setChartView('assets')}
            >
              By Assets
            </button>
          </div>
          
          <svg ref={chartRef} className="vulnerability-chart" />
        </div>
      </div>
    </div>
  );
};

export default SecurityScanner;