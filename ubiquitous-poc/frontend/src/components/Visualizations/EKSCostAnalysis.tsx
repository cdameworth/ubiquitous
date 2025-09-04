import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './EKSCostAnalysis.css';

interface EKSCluster {
  id: string;
  name: string;
  region: string;
  nodeGroups: EKSNodeGroup[];
  totalCost: number;
  optimizedCost?: number;
  utilization: {
    cpu: number;
    memory: number;
    network: number;
  };
  recommendations: EKSRecommendation[];
  status: 'healthy' | 'warning' | 'critical';
}

interface EKSNodeGroup {
  id: string;
  name: string;
  instanceType: string;
  desiredCapacity: number;
  minCapacity: number;
  maxCapacity: number;
  runningCapacity: number;
  cost: number;
  utilization: {
    cpu: number;
    memory: number;
  };
  optimizable: boolean;
  recommendedInstanceType?: string;
  potentialSavings?: number;
}

interface EKSRecommendation {
  id: string;
  type: 'rightsizing' | 'instance_type' | 'autoscaling' | 'spot_instances' | 'reserved_instances';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number;
  implementation: 'easy' | 'medium' | 'complex';
  targetNodeGroup?: string;
}

interface EKSCostAnalysisProps {
  clusters: EKSCluster[];
  selectedCluster: string | null;
  onClusterSelect: (clusterId: string) => void;
  onRecommendationApply: (recommendation: EKSRecommendation) => void;
  className?: string;
}

const EKSCostAnalysis: React.FC<EKSCostAnalysisProps> = ({
  clusters,
  selectedCluster,
  onClusterSelect,
  onRecommendationApply,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [viewMode, setViewMode] = useState<'overview' | 'utilization' | 'nodegroups'>('overview');
  
  const cluster = selectedCluster ? clusters.find(c => c.id === selectedCluster) : clusters[0];

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(300, rect.height - 100) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!cluster) return;
    
    switch (viewMode) {
      case 'overview':
        drawClusterOverview();
        break;
      case 'utilization':
        drawUtilizationChart();
        break;
      case 'nodegroups':
        drawNodeGroupAnalysis();
        break;
    }
  }, [cluster, dimensions, viewMode]);

  const drawClusterOverview = () => {
    if (!cluster) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Cost comparison chart
    const costData = [
      { label: 'Current', value: cluster.totalCost, color: '#3b82f6' },
      { label: 'Optimized', value: cluster.optimizedCost || cluster.totalCost, color: '#10b981' }
    ];

    const xScale = d3.scaleBand()
      .domain(costData.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(costData, d => d.value) as number * 1.2])
      .range([innerHeight, 0]);

    // Bars
    container.selectAll('.cost-bar')
      .data(costData)
      .enter()
      .append('rect')
      .attr('class', 'cost-bar')
      .attr('x', d => xScale(d.label) || 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .attr('opacity', 0.8);

    // Value labels
    container.selectAll('.cost-label')
      .data(costData)
      .enter()
      .append('text')
      .attr('class', 'cost-label')
      .attr('x', d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .text(d => `$${(d.value / 1000).toFixed(0)}K`);

    // Savings indicator
    if (cluster.optimizedCost && cluster.optimizedCost < cluster.totalCost) {
      const savings = cluster.totalCost - cluster.optimizedCost;
      const savingsPercentage = ((savings / cluster.totalCost) * 100).toFixed(1);
      
      container.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#10b981')
        .text(`Potential Savings: $${(savings / 1000).toFixed(0)}K (${savingsPercentage}%)`);
    }

    // Axes
    container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    container.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => `$${(d as number / 1000).toFixed(0)}K`));
  };

  const drawUtilizationChart = () => {
    if (!cluster) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const utilizationData = [
      { resource: 'CPU', utilization: cluster.utilization.cpu },
      { resource: 'Memory', utilization: cluster.utilization.memory },
      { resource: 'Network', utilization: cluster.utilization.network }
    ];

    const xScale = d3.scaleBand()
      .domain(utilizationData.map(d => d.resource))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Background bars (100%)
    container.selectAll('.utilization-bg')
      .data(utilizationData)
      .enter()
      .append('rect')
      .attr('class', 'utilization-bg')
      .attr('x', d => xScale(d.resource) || 0)
      .attr('y', 0)
      .attr('width', xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('fill', '#f3f4f6')
      .attr('rx', 4);

    // Utilization bars
    container.selectAll('.utilization-bar')
      .data(utilizationData)
      .enter()
      .append('rect')
      .attr('class', 'utilization-bar')
      .attr('x', d => xScale(d.resource) || 0)
      .attr('y', d => yScale(d.utilization))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.utilization))
      .attr('fill', d => {
        if (d.utilization > 80) return '#ef4444';
        if (d.utilization > 60) return '#f59e0b';
        return '#10b981';
      })
      .attr('rx', 4);

    // Utilization labels
    container.selectAll('.utilization-label')
      .data(utilizationData)
      .enter()
      .append('text')
      .attr('class', 'utilization-label')
      .attr('x', d => (xScale(d.resource) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.utilization) - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .text(d => `${d.utilization.toFixed(1)}%`);

    // Optimal range indicator
    container.append('rect')
      .attr('x', 0)
      .attr('y', yScale(80))
      .attr('width', innerWidth)
      .attr('height', yScale(60) - yScale(80))
      .attr('fill', '#10b981')
      .attr('opacity', 0.1)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    container.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', yScale(70) + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#10b981')
      .text('Optimal Range (60-80%)');

    // Axes
    container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    container.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`));
  };

  const drawNodeGroupAnalysis = () => {
    if (!cluster) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(cluster.nodeGroups.map(ng => ng.name))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(cluster.nodeGroups, ng => ng.cost) as number * 1.2])
      .range([innerHeight, 0]);

    // Node group bars
    container.selectAll('.nodegroup-bar')
      .data(cluster.nodeGroups)
      .enter()
      .append('rect')
      .attr('class', 'nodegroup-bar')
      .attr('x', d => xScale(d.name) || 0)
      .attr('y', d => yScale(d.cost))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.cost))
      .attr('fill', d => d.optimizable ? '#f59e0b' : '#3b82f6')
      .attr('rx', 4)
      .attr('opacity', 0.8);

    // Optimization indicators
    cluster.nodeGroups.filter(ng => ng.optimizable).forEach(ng => {
      const x = (xScale(ng.name) || 0) + xScale.bandwidth() - 8;
      const y = yScale(ng.cost) + 8;
      
      container.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    });

    // Cost labels
    container.selectAll('.nodegroup-label')
      .data(cluster.nodeGroups)
      .enter()
      .append('text')
      .attr('class', 'nodegroup-label')
      .attr('x', d => (xScale(d.name) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.cost) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .text(d => `$${(d.cost / 1000).toFixed(1)}K`);

    // Axes
    container.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    container.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => `$${(d as number / 1000).toFixed(0)}K`));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (!cluster) {
    return <div className="eks-cost-analysis-loading">Loading EKS cluster data...</div>;
  }

  return (
    <div className={`eks-cost-analysis ${className}`}>
      <div className="analysis-header">
        <div className="cluster-selector">
          <select 
            value={selectedCluster || ''}
            onChange={(e) => onClusterSelect(e.target.value)}
          >
            {clusters.map(cluster => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.name} ({cluster.region})
              </option>
            ))}
          </select>
        </div>
        
        <div className="cluster-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getStatusColor(cluster.status) }}
          />
          <span className="status-text">{cluster.status}</span>
        </div>
      </div>

      <div className="analysis-tabs">
        <button
          className={`analysis-tab ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          Cost Overview
        </button>
        <button
          className={`analysis-tab ${viewMode === 'utilization' ? 'active' : ''}`}
          onClick={() => setViewMode('utilization')}
        >
          Utilization
        </button>
        <button
          className={`analysis-tab ${viewMode === 'nodegroups' ? 'active' : ''}`}
          onClick={() => setViewMode('nodegroups')}
        >
          Node Groups
        </button>
      </div>

      <div className="analysis-content">
        <div className="chart-container">
          <svg
            ref={svgRef}
            className="analysis-svg"
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>

        <div className="recommendations-panel">
          <h3>Optimization Recommendations</h3>
          <div className="recommendations-list">
            {cluster.recommendations.map(rec => (
              <div key={rec.id} className="recommendation-item">
                <div className="recommendation-header">
                  <div className="recommendation-title">
                    <span 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(rec.priority) }}
                    />
                    <strong>{rec.title}</strong>
                  </div>
                  <div className="recommendation-savings">
                    ${(rec.potentialSavings / 1000).toFixed(0)}K
                  </div>
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <div className="recommendation-footer">
                  <span className={`implementation-badge ${rec.implementation}`}>
                    {rec.implementation} implementation
                  </span>
                  <button
                    className="apply-recommendation"
                    onClick={() => onRecommendationApply(rec)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EKSCostAnalysis;