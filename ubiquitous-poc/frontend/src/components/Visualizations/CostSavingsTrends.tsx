import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { roiEngine } from '../../utils/roiCalculations';
import './CostSavingsTrends.css';

interface CostSavingsCategory {
  category: string;
  icon: string;
  baseline: number;
  current: number;
  projectedNext: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  initiatives: string[];
}

interface MonthlyTrend {
  month: string;
  totalSavings: number;
  categories: {
    infrastructure: number;
    automation: number;
    optimization: number;
    consolidation: number;
    efficiency: number;
  };
  cumulativeSavings: number;
}

interface SavingsBreakdown {
  category: string;
  amount: number;
  percentage: number;
  annualProjection: number;
  initiatives: number;
  status: 'achieved' | 'in-progress' | 'projected';
}

interface CostOptimizationOpportunity {
  opportunity: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  department: string;
  confidence: number;
}

const CostSavingsTrends: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m' | '24m'>('12m');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const trendChartRef = useRef<SVGSVGElement>(null);
  const waterfallRef = useRef<SVGSVGElement>(null);
  const categoryRef = useRef<SVGSVGElement>(null);
  const opportunityMatrixRef = useRef<SVGSVGElement>(null);
  const cumulativeRef = useRef<SVGSVGElement>(null);

  const [savingsCategories, setSavingsCategories] = useState<CostSavingsCategory[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [savingsBreakdown, setSavingsBreakdown] = useState<SavingsBreakdown[]>([]);
  const [opportunities, setOpportunities] = useState<CostOptimizationOpportunity[]>([]);

  useEffect(() => {
    loadCostSavingsData();
  }, [timeframe, selectedCategory]);

  useEffect(() => {
    if (!loading) {
      createTrendChart();
      createWaterfallChart();
      createCategoryChart();
      createOpportunityMatrix();
      createCumulativeChart();
    }
  }, [loading, monthlyTrends, savingsBreakdown, opportunities]);

  const loadCostSavingsData = async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Generate savings categories
      const categories: CostSavingsCategory[] = [
        {
          category: 'Infrastructure',
          icon: '🏗️',
          baseline: 2400000,
          current: 1850000,
          projectedNext: 1650000,
          trend: 'decreasing',
          confidence: 92,
          initiatives: ['Cloud Migration', 'Server Consolidation', 'Auto-scaling']
        },
        {
          category: 'Automation',
          icon: '🤖',
          baseline: 1800000,
          current: 1200000,
          projectedNext: 950000,
          trend: 'decreasing',
          confidence: 88,
          initiatives: ['CI/CD Pipeline', 'Testing Automation', 'Deploy Automation']
        },
        {
          category: 'Process Optimization',
          icon: '⚡',
          baseline: 1200000,
          current: 950000,
          projectedNext: 800000,
          trend: 'decreasing',
          confidence: 75,
          initiatives: ['Workflow Redesign', 'Tool Integration', 'Training']
        },
        {
          category: 'Resource Consolidation',
          icon: '📦',
          baseline: 800000,
          current: 650000,
          projectedNext: 580000,
          trend: 'decreasing',
          confidence: 83,
          initiatives: ['License Optimization', 'Vendor Consolidation']
        },
        {
          category: 'Operational Efficiency',
          icon: '🎯',
          baseline: 1000000,
          current: 780000,
          projectedNext: 650000,
          trend: 'decreasing',
          confidence: 79,
          initiatives: ['Monitoring Automation', 'Incident Reduction']
        }
      ];
      
      setSavingsCategories(categories);
      
      // Generate monthly trend data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trends: MonthlyTrend[] = [];
      let cumulativeSavings = 0;
      
      months.forEach((month, index) => {
        const baseInfraSavings = 45000 + (index * 2000) + (Math.random() * 5000);
        const baseAutoSavings = 35000 + (index * 1500) + (Math.random() * 4000);
        const baseOptSavings = 25000 + (index * 1200) + (Math.random() * 3000);
        const baseConsolidationSavings = 18000 + (index * 800) + (Math.random() * 2000);
        const baseEfficiencySavings = 22000 + (index * 1000) + (Math.random() * 2500);
        
        const monthlySavings = {
          infrastructure: baseInfraSavings,
          automation: baseAutoSavings,
          optimization: baseOptSavings,
          consolidation: baseConsolidationSavings,
          efficiency: baseEfficiencySavings
        };
        
        const totalSavings = Object.values(monthlySavings).reduce((sum, val) => sum + val, 0);
        cumulativeSavings += totalSavings;
        
        trends.push({
          month,
          totalSavings,
          categories: monthlySavings,
          cumulativeSavings
        });
      });
      
      setMonthlyTrends(trends);
      
      // Generate savings breakdown
      const breakdown: SavingsBreakdown[] = categories.map(cat => {
        const savings = cat.baseline - cat.current;
        const totalBaseline = categories.reduce((sum, c) => sum + c.baseline, 0);
        const percentage = (savings / totalBaseline) * 100;
        const annualProjection = (cat.current - cat.projectedNext) * 12;
        
        return {
          category: cat.category,
          amount: savings,
          percentage,
          annualProjection,
          initiatives: cat.initiatives.length,
          status: cat.confidence > 85 ? 'achieved' : cat.confidence > 70 ? 'in-progress' : 'projected'
        };
      });
      
      setSavingsBreakdown(breakdown);
      
      // Generate optimization opportunities
      const optimizationOpportunities: CostOptimizationOpportunity[] = [
        {
          opportunity: 'Container Orchestration',
          potentialSavings: 480000,
          effort: 'high',
          impact: 'high',
          timeframe: '6-9 months',
          department: 'Infrastructure',
          confidence: 85
        },
        {
          opportunity: 'Database Optimization',
          potentialSavings: 320000,
          effort: 'medium',
          impact: 'high',
          timeframe: '3-4 months',
          department: 'Development',
          confidence: 78
        },
        {
          opportunity: 'API Gateway Consolidation',
          potentialSavings: 180000,
          effort: 'low',
          impact: 'medium',
          timeframe: '2-3 months',
          department: 'Architecture',
          confidence: 92
        },
        {
          opportunity: 'Monitoring Tool Integration',
          potentialSavings: 150000,
          effort: 'medium',
          impact: 'medium',
          timeframe: '4-5 months',
          department: 'Operations',
          confidence: 73
        },
        {
          opportunity: 'Automated Testing Expansion',
          potentialSavings: 380000,
          effort: 'high',
          impact: 'high',
          timeframe: '8-10 months',
          department: 'Quality',
          confidence: 67
        },
        {
          opportunity: 'License Management',
          potentialSavings: 240000,
          effort: 'low',
          impact: 'medium',
          timeframe: '1-2 months',
          department: 'Procurement',
          confidence: 95
        },
        {
          opportunity: 'Workflow Automation',
          potentialSavings: 290000,
          effort: 'medium',
          impact: 'high',
          timeframe: '5-6 months',
          department: 'Operations',
          confidence: 81
        },
        {
          opportunity: 'Storage Optimization',
          potentialSavings: 130000,
          effort: 'low',
          impact: 'low',
          timeframe: '1-3 months',
          department: 'Infrastructure',
          confidence: 88
        }
      ];
      
      setOpportunities(optimizationOpportunities);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load cost savings data:', error);
      setLoading(false);
    }
  };

  const createTrendChart = () => {
    if (!trendChartRef.current || !monthlyTrends.length) return;

    const svg = d3.select(trendChartRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 60, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(monthlyTrends.map(d => d.month))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(monthlyTrends, d => d.totalSavings) as number * 1.1])
      .range([height, 0]);

    const categories = ['infrastructure', 'automation', 'optimization', 'consolidation', 'efficiency'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const stackedData = d3.stack<MonthlyTrend>()
      .keys(categories as (keyof MonthlyTrend['categories'])[])
      .value((d, key) => d.categories[key])
      (monthlyTrends);

    // Add stacked bars
    stackedData.forEach((layer, i) => {
      g.selectAll(`.bar-${i}`)
        .data(layer)
        .enter().append('rect')
        .attr('class', `bar-${i}`)
        .attr('x', (d, index) => xScale(monthlyTrends[index].month)!)
        .attr('y', d => yScale(d[1]))
        .attr('width', xScale.bandwidth())
        .attr('height', d => yScale(d[0]) - yScale(d[1]))
        .attr('fill', colors[i])
        .attr('opacity', 0.8)
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 1);
          
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
            <strong>${categories[i].charAt(0).toUpperCase() + categories[i].slice(1)}</strong><br/>
            Savings: ${roiEngine.formatCurrency(d[1] - d[0])}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 0.8);
          d3.selectAll('.tooltip').remove();
        });
    });

    // Add trend line
    const line = d3.line<MonthlyTrend>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.totalSavings))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyTrends)
      .attr('fill', 'none')
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('d', line);

    // Add total savings labels
    g.selectAll('.total-label')
      .data(monthlyTrends)
      .enter().append('text')
      .attr('class', 'total-label')
      .attr('x', d => xScale(d.month)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.totalSavings) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#1f2937')
      .text(d => `$${(d.totalSavings / 1000).toFixed(0)}K`);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => `$${(d as number / 1000).toFixed(0)}K`))
      .selectAll('text')
      .style('font-size', '12px');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 80}, 30)`);

    categories.forEach((category, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 18})`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colors[i]);

      legendRow.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .style('font-size', '11px')
        .style('text-transform', 'capitalize')
        .text(category);
    });
  };

  const createWaterfallChart = () => {
    if (!waterfallRef.current || !savingsBreakdown.length) return;

    const svg = d3.select(waterfallRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 100, left: 80 };
    const width = 700 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate waterfall data
    const waterfallData = [];
    let cumulative = 0;

    savingsBreakdown.forEach((item, index) => {
      waterfallData.push({
        category: item.category,
        value: item.amount,
        start: cumulative,
        end: cumulative + item.amount,
        status: item.status
      });
      cumulative += item.amount;
    });

    // Add total
    waterfallData.push({
      category: 'Total Savings',
      value: cumulative,
      start: 0,
      end: cumulative,
      status: 'total'
    });

    const xScale = d3.scaleBand()
      .domain(waterfallData.map(d => d.category))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, cumulative * 1.1])
      .range([height, 0]);

    // Color mapping
    const colorMap: { [key: string]: string } = {
      'achieved': '#10b981',
      'in-progress': '#f59e0b',
      'projected': '#6b7280',
      'total': '#3b82f6'
    };

    // Add bars
    waterfallData.forEach((d, index) => {
      const barHeight = Math.abs(yScale(d.start) - yScale(d.end));
      const barY = d.status === 'total' ? yScale(d.end) : yScale(Math.max(d.start, d.end));

      g.append('rect')
        .attr('x', xScale(d.category)!)
        .attr('y', barY)
        .attr('width', xScale.bandwidth())
        .attr('height', barHeight)
        .attr('fill', colorMap[d.status] || '#6b7280')
        .attr('opacity', 0.8)
        .attr('rx', 4);

      // Value labels
      g.append('text')
        .attr('x', xScale(d.category)! + xScale.bandwidth() / 2)
        .attr('y', barY - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .text(roiEngine.formatCurrency(d.value));

      // Connecting lines (except for total)
      if (index < waterfallData.length - 1 && d.status !== 'total') {
        g.append('line')
          .attr('x1', xScale(d.category)! + xScale.bandwidth())
          .attr('x2', xScale(waterfallData[index + 1].category)!)
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
      .call(d3.axisLeft(yScale).tickFormat(d => roiEngine.formatCurrency(d as number)))
      .selectAll('text')
      .style('font-size', '12px');
  };

  const createCategoryChart = () => {
    if (!categoryRef.current || !savingsCategories.length) return;

    const svg = d3.select(categoryRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(savingsCategories.map(d => d.category))
      .range(['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']);

    const pie = d3.pie<CostSavingsCategory>()
      .value(d => d.baseline - d.current)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<CostSavingsCategory>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(savingsCategories))
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
          Savings: ${roiEngine.formatCurrency(d.data.baseline - d.data.current)}<br/>
          Confidence: ${d.data.confidence}%
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
      .text(d => d.data.icon);

    // Center label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '16px')
      .style('font-weight', '700')
      .style('fill', '#374151')
      .text('Cost');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('font-size', '16px')
      .style('font-weight', '700')
      .style('fill', '#374151')
      .text('Savings');
  };

  const createOpportunityMatrix = () => {
    if (!opportunityMatrixRef.current || !opportunities.length) return;

    const svg = d3.select(opportunityMatrixRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Map effort and impact to numeric values
    const effortMap = { 'low': 1, 'medium': 2, 'high': 3 };
    const impactMap = { 'low': 1, 'medium': 2, 'high': 3 };

    const xScale = d3.scaleLinear()
      .domain([0.5, 3.5])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0.5, 3.5])
      .range([height, 0]);

    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(opportunities, d => d.potentialSavings) as [number, number])
      .range([6, 20]);

    const colorScale = d3.scaleLinear()
      .domain([0, 100])
      .range(['#ef4444', '#10b981'] as any);

    // Add quadrant background
    const quadrants = [
      { x: 0, y: height/2, width: width/2, height: height/2, label: 'Low Impact\nLow Effort', color: '#f3f4f6' },
      { x: width/2, y: height/2, width: width/2, height: height/2, label: 'High Impact\nLow Effort', color: '#dcfce7' },
      { x: 0, y: 0, width: width/2, height: height/2, label: 'Low Impact\nHigh Effort', color: '#fef2f2' },
      { x: width/2, y: 0, width: width/2, height: height/2, label: 'High Impact\nHigh Effort', color: '#fff7ed' }
    ];

    quadrants.forEach(quad => {
      g.append('rect')
        .attr('x', quad.x)
        .attr('y', quad.y)
        .attr('width', quad.width)
        .attr('height', quad.height)
        .attr('fill', quad.color)
        .attr('opacity', 0.3);

      g.append('text')
        .attr('x', quad.x + quad.width / 2)
        .attr('y', quad.y + quad.height / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#6b7280')
        .style('text-align', 'center')
        .selectAll('tspan')
        .data(quad.label.split('\n'))
        .enter().append('tspan')
        .attr('x', quad.x + quad.width / 2)
        .attr('dy', (d, i) => i === 0 ? 0 : '1.2em')
        .text(d => d);
    });

    // Add opportunities as bubbles
    g.selectAll('.opportunity-bubble')
      .data(opportunities)
      .enter().append('circle')
      .attr('class', 'opportunity-bubble')
      .attr('cx', d => xScale(effortMap[d.effort]))
      .attr('cy', d => yScale(impactMap[d.impact]))
      .attr('r', d => sizeScale(d.potentialSavings))
      .attr('fill', d => colorScale(d.confidence))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.8)')
          .style('color', 'white')
          .style('padding', '12px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('max-width', '200px');

        tooltip.transition().duration(200).style('opacity', .9);
        tooltip.html(`
          <strong>${d.opportunity}</strong><br/>
          Potential: ${roiEngine.formatCurrency(d.potentialSavings)}<br/>
          Effort: ${d.effort} | Impact: ${d.impact}<br/>
          Timeframe: ${d.timeframe}<br/>
          Confidence: ${d.confidence}%
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickValues([1, 2, 3]).tickFormat((d, i) => ['Low', 'Medium', 'High'][d as number - 1]))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickValues([1, 2, 3]).tickFormat((d, i) => ['Low', 'Medium', 'High'][d as number - 1]))
      .selectAll('text')
      .style('font-size', '12px');

    // Add axis labels
    svg.append('text')
      .attr('transform', `translate(${margin.left + width / 2}, ${height + margin.top + 50})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Implementation Effort');

    svg.append('text')
      .attr('transform', `translate(15, ${margin.top + height / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .text('Business Impact');
  };

  const createCumulativeChart = () => {
    if (!cumulativeRef.current || !monthlyTrends.length) return;

    const svg = d3.select(cumulativeRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 80 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(monthlyTrends.map(d => d.month))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(monthlyTrends, d => d.cumulativeSavings) as number * 1.1])
      .range([height, 0]);

    // Create area chart
    const area = d3.area<MonthlyTrend>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y0(height)
      .y1(d => yScale(d.cumulativeSavings))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyTrends)
      .attr('fill', 'url(#cumulativeGradient)')
      .attr('d', area);

    // Add gradient definition
    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'cumulativeGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', yScale(0))
      .attr('x2', 0).attr('y2', yScale(d3.max(monthlyTrends, d => d.cumulativeSavings) as number));

    gradient.selectAll('stop')
      .data([
        { offset: '0%', color: '#10b981', opacity: 0.8 },
        { offset: '100%', color: '#10b981', opacity: 0.1 }
      ])
      .enter().append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color)
      .attr('stop-opacity', d => d.opacity);

    // Add line
    const line = d3.line<MonthlyTrend>()
      .x(d => xScale(d.month)! + xScale.bandwidth() / 2)
      .y(d => yScale(d.cumulativeSavings))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyTrends)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add data points
    g.selectAll('.data-point')
      .data(monthlyTrends)
      .enter().append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.month)! + xScale.bandwidth() / 2)
      .attr('cy', d => yScale(d.cumulativeSavings))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add value labels
    g.selectAll('.value-label')
      .data(monthlyTrends.filter((_, i) => i % 3 === 0)) // Show every 3rd label
      .enter().append('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.month)! + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.cumulativeSavings) - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(d => roiEngine.formatCurrency(d.cumulativeSavings));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => roiEngine.formatCurrency(d as number)))
      .selectAll('text')
      .style('font-size', '12px');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      case 'increasing': return '📈';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return '#10b981';
      case 'in-progress': return '#f59e0b';
      case 'projected': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <div className="cost-savings-loading">
        <div className="spinner"></div>
        <p>Loading cost savings analysis...</p>
      </div>
    );
  }

  const totalSavings = savingsCategories.reduce((sum, cat) => sum + (cat.baseline - cat.current), 0);
  const projectedSavings = savingsCategories.reduce((sum, cat) => sum + (cat.current - cat.projectedNext), 0);
  const totalOpportunities = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);

  return (
    <div className="cost-savings-trends">
      <div className="cost-savings-header">
        <div className="title-section">
          <h2 className="cost-savings-title">Cost Savings Trends Analysis</h2>
          <p className="cost-savings-subtitle">
            Track cost optimization progress and identify future opportunities
          </p>
        </div>
        
        <div className="controls-section">
          <div className="timeframe-selector">
            <label>Timeframe:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="timeframe-select"
            >
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="24m">Last 24 Months</option>
            </select>
          </div>
          
          <div className="category-selector">
            <label>Category:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {savingsCategories.map(cat => (
                <option key={cat.category} value={cat.category}>{cat.category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="metric-value">{roiEngine.formatCurrency(totalSavings)}</div>
            <div className="metric-label">Total Savings Achieved</div>
            <div className="metric-change positive">
              +{((totalSavings / (totalSavings + savingsCategories.reduce((sum, cat) => sum + cat.current, 0))) * 100).toFixed(1)}% vs baseline
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="metric-value">{roiEngine.formatCurrency(projectedSavings)}</div>
            <div className="metric-label">Projected Annual Savings</div>
            <div className="metric-change positive">
              Next 12 months
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🔍</div>
          <div className="card-content">
            <div className="metric-value">{roiEngine.formatCurrency(totalOpportunities)}</div>
            <div className="metric-label">Identified Opportunities</div>
            <div className="metric-change">
              {opportunities.length} initiatives
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="metric-value">
              {(savingsCategories.reduce((sum, cat) => sum + cat.confidence, 0) / savingsCategories.length).toFixed(0)}%
            </div>
            <div className="metric-label">Average Confidence</div>
            <div className="metric-change positive">
              High certainty
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-container large">
            <h3 className="chart-title">Monthly Savings Trend by Category</h3>
            <svg ref={trendChartRef} width="800" height="400"></svg>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container">
            <h3 className="chart-title">Savings Breakdown</h3>
            <svg ref={categoryRef} width="400" height="400"></svg>
          </div>
          
          <div className="chart-container">
            <h3 className="chart-title">Cumulative Savings</h3>
            <svg ref={cumulativeRef} width="600" height="300"></svg>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-container">
            <h3 className="chart-title">Savings Waterfall Analysis</h3>
            <svg ref={waterfallRef} width="700" height="350"></svg>
          </div>
          
          <div className="chart-container">
            <h3 className="chart-title">Opportunity Matrix</h3>
            <svg ref={opportunityMatrixRef} width="500" height="350"></svg>
          </div>
        </div>
      </div>

      <div className="categories-overview">
        <h3 className="section-title">Savings Categories Overview</h3>
        <div className="categories-grid">
          {savingsCategories.map((category) => (
            <div key={category.category} className="category-card">
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <div className="category-info">
                  <h4 className="category-name">{category.category}</h4>
                  <span className="trend-indicator">{getTrendIcon(category.trend)}</span>
                </div>
                <div className="confidence-badge">
                  {category.confidence}%
                </div>
              </div>
              
              <div className="savings-amount">
                <span className="current-savings">
                  {roiEngine.formatCurrency(category.baseline - category.current)}
                </span>
                <span className="projected-additional">
                  +{roiEngine.formatCurrency(category.current - category.projectedNext)} projected
                </span>
              </div>
              
              <div className="initiatives-list">
                <strong>Key Initiatives:</strong>
                <ul>
                  {category.initiatives.map((initiative, index) => (
                    <li key={index}>{initiative}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="opportunities-section">
        <h3 className="section-title">Top Optimization Opportunities</h3>
        <div className="opportunities-table">
          <div className="table-header">
            <div>Opportunity</div>
            <div>Potential Savings</div>
            <div>Effort</div>
            <div>Impact</div>
            <div>Timeframe</div>
            <div>Confidence</div>
          </div>
          
          {opportunities
            .sort((a, b) => b.potentialSavings - a.potentialSavings)
            .slice(0, 6)
            .map((opp, index) => (
              <div key={index} className="table-row">
                <div className="opportunity-name">
                  <strong>{opp.opportunity}</strong>
                  <span className="department">{opp.department}</span>
                </div>
                <div className="savings-amount-cell">
                  {roiEngine.formatCurrency(opp.potentialSavings)}
                </div>
                <div className={`effort-cell ${opp.effort}`}>
                  {opp.effort.charAt(0).toUpperCase() + opp.effort.slice(1)}
                </div>
                <div className={`impact-cell ${opp.impact}`}>
                  {opp.impact.charAt(0).toUpperCase() + opp.impact.slice(1)}
                </div>
                <div className="timeframe-cell">
                  {opp.timeframe}
                </div>
                <div className="confidence-cell">
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${opp.confidence}%` }}
                    ></div>
                  </div>
                  <span>{opp.confidence}%</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default CostSavingsTrends;