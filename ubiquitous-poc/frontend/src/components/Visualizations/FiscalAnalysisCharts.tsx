import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { roiEngine, ROIMetric, FiscalPeriod } from '../../utils/roiCalculations';
import './FiscalAnalysisCharts.css';

interface QuarterlyData {
  quarter: string;
  year: number;
  roi: number;
  investment: number;
  benefit: number;
  actualROI?: number;
  projectedROI?: number;
}

interface TrendData {
  period: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  variance: number;
}

interface ScenarioData {
  scenario: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  probability: number;
}

const FiscalAnalysisCharts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'quarterly' | 'annual' | 'forecast'>('quarterly');
  
  const quarterlyChartRef = useRef<SVGSVGElement>(null);
  const trendChartRef = useRef<SVGSVGElement>(null);
  const waterchartRef = useRef<SVGSVGElement>(null);
  const scenarioChartRef = useRef<SVGSVGElement>(null);
  const heatmapRef = useRef<SVGSVGElement>(null);

  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [scenarioData, setScenarioData] = useState<ScenarioData[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<ROIMetric[]>([]);

  useEffect(() => {
    loadFiscalData();
  }, [selectedYear, viewMode]);

  useEffect(() => {
    if (!loading) {
      createQuarterlyChart();
      createTrendChart();
      createWaterfallChart();
      createScenarioChart();
      createHeatmap();
    }
  }, [loading, quarterlyData, trendData, scenarioData, viewMode]);

  const loadFiscalData = async () => {
    try {
      setLoading(true);
      
      // Simulate data loading
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate sample quarterly data
      const quarters: QuarterlyData[] = [];
      const baseROI = 23.5;
      const baseInvestment = 1200000;
      
      for (let q = 1; q <= 4; q++) {
        const variance = (Math.random() - 0.5) * 8; // +/- 4%
        const seasonalFactor = q === 4 ? 1.15 : q === 1 ? 0.95 : 1.0; // Q4 boost, Q1 dip
        const roi = (baseROI + variance) * seasonalFactor;
        const investment = baseInvestment + (Math.random() - 0.5) * 200000;
        const benefit = investment * (roi / 100) + investment;
        
        quarters.push({
          quarter: `Q${q}`,
          year: selectedYear,
          roi,
          investment,
          benefit,
          actualROI: q <= 2 ? roi : undefined, // Only Q1, Q2 are actual
          projectedROI: q > 2 ? roi : undefined // Q3, Q4 are projected
        });
        
        // Previous year data
        if (selectedYear > 2023) {
          const prevYearROI = roi - 2 + Math.random() * 4;
          quarters.push({
            quarter: `Q${q}`,
            year: selectedYear - 1,
            roi: prevYearROI,
            investment: investment * 0.85,
            benefit: investment * 0.85 * (prevYearROI / 100) + investment * 0.85,
            actualROI: prevYearROI
          });
        }
      }
      
      setQuarterlyData(quarters.sort((a, b) => a.year - b.year || parseInt(a.quarter[1]) - parseInt(b.quarter[1])));
      
      // Generate trend data
      const trends: TrendData[] = [];
      const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let previousValue = baseROI;
      
      periods.forEach((period, index) => {
        const change = (Math.random() - 0.5) * 3;
        const value = Math.max(0, previousValue + change);
        const variance = Math.abs(change);
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (change > 0.5) trend = 'up';
        else if (change < -0.5) trend = 'down';
        
        trends.push({
          period,
          value,
          trend,
          variance
        });
        
        previousValue = value;
      });
      
      setTrendData(trends);
      
      // Generate scenario data
      const scenarios: ScenarioData[] = [
        {
          scenario: 'Digital Transformation',
          optimistic: 45.2,
          realistic: 28.7,
          pessimistic: 12.3,
          probability: 0.75
        },
        {
          scenario: 'Infrastructure Modernization',
          optimistic: 38.9,
          realistic: 24.1,
          pessimistic: 8.7,
          probability: 0.85
        },
        {
          scenario: 'Process Automation',
          optimistic: 52.3,
          realistic: 31.8,
          pessimistic: 15.2,
          probability: 0.90
        },
        {
          scenario: 'Security Enhancement',
          optimistic: 28.4,
          realistic: 18.9,
          pessimistic: 5.6,
          probability: 0.95
        },
        {
          scenario: 'Data Analytics Platform',
          optimistic: 41.7,
          realistic: 26.3,
          pessimistic: 9.8,
          probability: 0.65
        }
      ];
      
      setScenarioData(scenarios);
      
      // Generate portfolio metrics for demonstration
      const metrics: ROIMetric[] = [
        roiEngine.calculateInfrastructureSavings(850000, 620000, 450000, 15),
        roiEngine.calculateEfficiencyROI('Deployment Process', 24, 85, 12, 180000),
        roiEngine.calculateRiskReductionROI('Security Incidents', 65, 2400000, 320000),
        roiEngine.calculateRevenueImpactROI(1800000, 25, 280000, 'annual'),
        roiEngine.calculateComplianceROI(120000, 450000, 200000, 85000)
      ];
      
      setPortfolioMetrics(metrics);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load fiscal data:', error);
      setLoading(false);
    }
  };

  const createQuarterlyChart = () => {
    if (!quarterlyChartRef.current || !quarterlyData.length) return;

    const svg = d3.select(quarterlyChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const currentYearData = quarterlyData.filter(d => d.year === selectedYear);
    const previousYearData = quarterlyData.filter(d => d.year === selectedYear - 1);

    const xScale = d3.scaleBand()
      .domain(['Q1', 'Q2', 'Q3', 'Q4'])
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(quarterlyData, d => d.roi) as number + 5])
      .range([height, 0]);

    // Add grid lines
    g.selectAll('.grid-line')
      .data(yScale.ticks(8))
      .enter().append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#f0f0f0')
      .attr('stroke-width', 1);

    // Previous year bars (if available)
    if (previousYearData.length > 0) {
      g.selectAll('.prev-year-bar')
        .data(previousYearData)
        .enter().append('rect')
        .attr('class', 'prev-year-bar')
        .attr('x', d => xScale(d.quarter)!)
        .attr('y', d => yScale(d.roi))
        .attr('width', xScale.bandwidth() * 0.4)
        .attr('height', d => height - yScale(d.roi))
        .attr('fill', '#cbd5e1')
        .attr('opacity', 0.7)
        .attr('rx', 4);
    }

    // Current year bars
    const currentBars = g.selectAll('.current-year-bar')
      .data(currentYearData)
      .enter().append('rect')
      .attr('class', 'current-year-bar')
      .attr('x', d => xScale(d.quarter)! + (previousYearData.length > 0 ? xScale.bandwidth() * 0.4 + 4 : 0))
      .attr('y', d => yScale(d.roi))
      .attr('width', xScale.bandwidth() * (previousYearData.length > 0 ? 0.4 : 0.8))
      .attr('height', d => height - yScale(d.roi))
      .attr('fill', d => d.actualROI ? '#3b82f6' : '#f59e0b')
      .attr('opacity', 0.8)
      .attr('rx', 4);

    // Value labels on bars
    g.selectAll('.bar-label')
      .data(currentYearData)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.quarter)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.roi) - 8)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(d => `${d.roi.toFixed(1)}%`);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '14px')
      .style('font-weight', '500');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 60}, 30)`);

    if (previousYearData.length > 0) {
      legend.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', '#cbd5e1');

      legend.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '11px')
        .text(`${selectedYear - 1}`);
    }

    legend.append('rect')
      .attr('y', previousYearData.length > 0 ? 20 : 0)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#3b82f6');

    legend.append('text')
      .attr('x', 18)
      .attr('y', (previousYearData.length > 0 ? 20 : 0) + 10)
      .style('font-size', '11px')
      .text(`${selectedYear} Actual`);

    legend.append('rect')
      .attr('y', (previousYearData.length > 0 ? 40 : 20))
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', '#f59e0b');

    legend.append('text')
      .attr('x', 18)
      .attr('y', (previousYearData.length > 0 ? 40 : 20) + 10)
      .style('font-size', '11px')
      .text(`${selectedYear} Projected`);
  };

  const createTrendChart = () => {
    if (!trendChartRef.current || !trendData.length) return;

    const svg = d3.select(trendChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(trendData.map(d => d.period))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(trendData, d => d.value) as [number, number])
      .range([height, 0]);

    // Line generator
    const line = d3.line<TrendData>()
      .x(d => xScale(d.period)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add trend line
    g.append('path')
      .datum(trendData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add confidence bands
    const area = d3.area<TrendData>()
      .x(d => xScale(d.period)! + xScale.bandwidth() / 2)
      .y0(d => yScale(d.value - d.variance))
      .y1(d => yScale(d.value + d.variance))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(trendData)
      .attr('fill', '#3b82f6')
      .attr('fill-opacity', 0.2)
      .attr('d', area);

    // Add data points
    g.selectAll('.data-point')
      .data(trendData)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.period)! + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', d => d.trend === 'up' ? '#10b981' : d.trend === 'down' ? '#ef4444' : '#6b7280')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add trend indicators
    g.selectAll('.trend-indicator')
      .data(trendData)
      .enter().append('text')
      .attr('class', 'trend-indicator')
      .attr('x', d => xScale(d.period)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text(d => d.trend === 'up' ? '↗' : d.trend === 'down' ? '↘' : '→');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');
  };

  const createWaterfallChart = () => {
    if (!waterchartRef.current || !portfolioMetrics.length) return;

    const svg = d3.select(waterchartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 100, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate cumulative values for waterfall
    const waterfallData = [];
    let cumulative = 0;

    portfolioMetrics.forEach((metric, index) => {
      const contribution = metric.value;
      waterfallData.push({
        name: metric.name,
        value: contribution,
        start: cumulative,
        end: cumulative + contribution,
        type: contribution >= 0 ? 'positive' : 'negative'
      });
      cumulative += contribution;
    });

    // Add total bar
    waterfallData.push({
      name: 'Total Portfolio ROI',
      value: cumulative,
      start: 0,
      end: cumulative,
      type: 'total'
    });

    const xScale = d3.scaleBand()
      .domain(waterfallData.map(d => d.name))
      .range([0, width])
      .padding(0.2);

    const yExtent = d3.extent(waterfallData, d => Math.max(d.start, d.end)) as [number, number];
    const yScale = d3.scaleLinear()
      .domain([Math.min(0, yExtent[0]), yExtent[1]])
      .range([height, 0]);

    // Add zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#374151')
      .attr('stroke-width', 2);

    // Add bars
    waterfallData.forEach(d => {
      const barHeight = Math.abs(yScale(d.start) - yScale(d.end));
      const barY = d.type === 'total' ? yScale(d.end) : Math.min(yScale(d.start), yScale(d.end));
      
      let fillColor = '#6b7280';
      if (d.type === 'positive') fillColor = '#10b981';
      else if (d.type === 'negative') fillColor = '#ef4444';
      else if (d.type === 'total') fillColor = '#3b82f6';

      g.append('rect')
        .attr('x', xScale(d.name)!)
        .attr('y', barY)
        .attr('width', xScale.bandwidth())
        .attr('height', barHeight)
        .attr('fill', fillColor)
        .attr('opacity', 0.8)
        .attr('rx', 4);

      // Value labels
      g.append('text')
        .attr('x', xScale(d.name)! + xScale.bandwidth() / 2)
        .attr('y', barY - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .text(`${d.value.toFixed(1)}%`);

      // Connecting lines (except for last item)
      if (d.type !== 'total') {
        g.append('line')
          .attr('x1', xScale(d.name)! + xScale.bandwidth())
          .attr('x2', xScale(waterfallData[waterfallData.indexOf(d) + 1]?.name || '')!)
          .attr('y1', yScale(d.end))
          .attr('y2', yScale(d.end))
          .attr('stroke', '#9ca3af')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
      }
    });

    // Axes
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
  };

  const createScenarioChart = () => {
    if (!scenarioChartRef.current || !scenarioData.length) return;

    const svg = d3.select(scenarioChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 150, bottom: 60, left: 100 };
    const width = 700 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
      .domain(scenarioData.map(d => d.scenario))
      .range([0, height])
      .padding(0.2);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(scenarioData, d => d.optimistic) as number])
      .range([0, width]);

    scenarioData.forEach(d => {
      const y = yScale(d.scenario)!;
      const barHeight = yScale.bandwidth();

      // Pessimistic to Optimistic range bar
      g.append('rect')
        .attr('x', xScale(d.pessimistic))
        .attr('y', y + barHeight * 0.1)
        .attr('width', xScale(d.optimistic) - xScale(d.pessimistic))
        .attr('height', barHeight * 0.8)
        .attr('fill', '#e5e7eb')
        .attr('rx', barHeight * 0.4);

      // Realistic value bar
      g.append('rect')
        .attr('x', xScale(d.pessimistic))
        .attr('y', y + barHeight * 0.25)
        .attr('width', xScale(d.realistic) - xScale(d.pessimistic))
        .attr('height', barHeight * 0.5)
        .attr('fill', '#3b82f6')
        .attr('opacity', d.probability)
        .attr('rx', barHeight * 0.25);

      // Probability indicator
      g.append('circle')
        .attr('cx', xScale(d.realistic))
        .attr('cy', y + barHeight / 2)
        .attr('r', 6)
        .attr('fill', '#10b981')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Value labels
      g.append('text')
        .attr('x', xScale(d.optimistic) + 10)
        .attr('y', y + barHeight / 2)
        .attr('dy', '.35em')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(`${d.realistic.toFixed(1)}% (${(d.probability * 100).toFixed(0)}% confidence)`);
    });

    // Axes
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}%`))
      .selectAll('text')
      .style('font-size', '12px');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 20}, 50)`);

    legend.append('rect')
      .attr('width', 20)
      .attr('height', 8)
      .attr('fill', '#e5e7eb')
      .attr('rx', 4);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 6)
      .style('font-size', '11px')
      .text('Full Range');

    legend.append('rect')
      .attr('y', 20)
      .attr('width', 20)
      .attr('height', 8)
      .attr('fill', '#3b82f6')
      .attr('rx', 4);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 26)
      .style('font-size', '11px')
      .text('Realistic');

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 44)
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 46)
      .style('font-size', '11px')
      .text('Confidence');
  };

  const createHeatmap = () => {
    if (!heatmapRef.current || !portfolioMetrics.length) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 100, bottom: 100, left: 120 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
    const metrics = portfolioMetrics.slice(0, 4).map(m => m.name.substring(0, 20));

    // Generate heatmap data
    const heatmapData: { category: string; metric: string; value: number }[] = [];
    categories.forEach(category => {
      metrics.forEach((metric, index) => {
        const baseValue = portfolioMetrics[index]?.value || 0;
        const variance = (Math.random() - 0.5) * 10;
        heatmapData.push({
          category,
          metric,
          value: Math.max(0, baseValue + variance)
        });
      });
    });

    const xScale = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(metrics)
      .range([height, 0])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, d3.max(heatmapData, d => d.value) as number]);

    // Add rectangles
    g.selectAll('.heatmap-cell')
      .data(heatmapData)
      .enter().append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.category)!)
      .attr('y', d => yScale(d.metric)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
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
          <strong>${d.metric}</strong><br/>
          ${d.category}: ${d.value.toFixed(1)}% ROI
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        d3.selectAll('.tooltip').remove();
      });

    // Add value labels
    g.selectAll('.heatmap-label')
      .data(heatmapData)
      .enter().append('text')
      .attr('class', 'heatmap-label')
      .attr('x', d => xScale(d.category)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.metric)! + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', d => d.value > 20 ? '#fff' : '#000')
      .text(d => d.value.toFixed(0));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '11px');

    // Color legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left + width + 20}, ${margin.top})`);

    const legendScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .tickSize(legendHeight)
      .tickFormat(d => `${d}%`);

    legend.selectAll('.legend-cell')
      .data(d3.range(0, legendWidth))
      .enter().append('rect')
      .attr('class', 'legend-cell')
      .attr('x', d => d)
      .attr('width', 1)
      .attr('height', legendHeight)
      .attr('fill', d => colorScale(legendScale.invert(d)));

    legend.append('g')
      .attr('transform', `translate(0,${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '10px');

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text('ROI Performance (%)');
  };

  if (loading) {
    return (
      <div className="fiscal-analysis-loading">
        <div className="spinner"></div>
        <p>Loading fiscal analysis...</p>
      </div>
    );
  }

  return (
    <div className="fiscal-analysis-charts">
      <div className="fiscal-header">
        <div className="title-section">
          <h2 className="fiscal-title">Fiscal Period Analysis</h2>
          <p className="fiscal-subtitle">
            ROI trends, forecasts, and scenario planning across fiscal periods
          </p>
        </div>
        
        <div className="fiscal-controls">
          <div className="year-selector">
            <label>Fiscal Year:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="view-selector">
            <label>View Mode:</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as any)}
              className="view-select"
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="forecast">Forecast</option>
            </select>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-row">
          <div className="chart-container large">
            <h3 className="chart-title">Quarterly ROI Performance</h3>
            <svg ref={quarterlyChartRef} width="800" height="400"></svg>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container">
            <h3 className="chart-title">Monthly Trend Analysis</h3>
            <svg ref={trendChartRef} width="700" height="300"></svg>
          </div>
          
          <div className="chart-container">
            <h3 className="chart-title">Performance Heatmap</h3>
            <svg ref={heatmapRef} width="500" height="300"></svg>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container large">
            <h3 className="chart-title">Portfolio ROI Waterfall Analysis</h3>
            <svg ref={waterchartRef} width="800" height="350"></svg>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container large">
            <h3 className="chart-title">Scenario Analysis & Forecasting</h3>
            <svg ref={scenarioChartRef} width="700" height="350"></svg>
          </div>
        </div>
      </div>

      <div className="summary-metrics">
        <div className="metric-card">
          <span className="metric-icon">📈</span>
          <div className="metric-info">
            <div className="metric-value">
              {quarterlyData.length > 0 
                ? quarterlyData[quarterlyData.length - 1]?.roi?.toFixed(1) 
                : '0'
              }%
            </div>
            <div className="metric-label">Current Quarter ROI</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🎯</span>
          <div className="metric-info">
            <div className="metric-value">
              {roiEngine.formatCurrency(
                portfolioMetrics.reduce((sum, m) => sum + m.investment, 0)
              )}
            </div>
            <div className="metric-label">Total Investment</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">💰</span>
          <div className="metric-info">
            <div className="metric-value">
              {scenarioData.length > 0 
                ? scenarioData.reduce((sum, s) => sum + s.realistic, 0).toFixed(1)
                : '0'
              }%
            </div>
            <div className="metric-label">Weighted Expected ROI</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">🔮</span>
          <div className="metric-info">
            <div className="metric-value">Q4</div>
            <div className="metric-label">Break-even Projected</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalAnalysisCharts;