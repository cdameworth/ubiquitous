// ROI Calculation and Visualization Engine
// Comprehensive business metrics calculation system

export interface ROIMetric {
  id: string;
  name: string;
  category: 'cost_savings' | 'revenue_growth' | 'efficiency' | 'risk_reduction' | 'strategic';
  value: number;
  investment: number;
  timeframe: 'monthly' | 'quarterly' | 'annual';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  calculationMethod: string;
}

export interface FiscalPeriod {
  period: string;
  year: number;
  quarter?: number;
  month?: number;
  startDate: Date;
  endDate: Date;
}

export interface CostSavingsData {
  category: string;
  baseline: number;
  current: number;
  savings: number;
  percentage: number;
  annualized: number;
}

export interface RevenueImpactData {
  source: string;
  before: number;
  after: number;
  impact: number;
  percentage: number;
  attribution: number;
}

export interface EfficiencyGainData {
  process: string;
  timeBaseline: number;
  timeCurrent: number;
  resourceBaseline: number;
  resourceCurrent: number;
  efficiencyGain: number;
  monetaryValue: number;
}

export interface RiskReductionData {
  riskType: string;
  probabilityBefore: number;
  probabilityAfter: number;
  potentialLoss: number;
  riskReduction: number;
  monetaryValue: number;
}

export class ROICalculationEngine {
  private metrics: ROIMetric[] = [];
  private fiscalPeriods: FiscalPeriod[] = [];

  constructor() {
    this.initializeFiscalPeriods();
  }

  private initializeFiscalPeriods() {
    const currentYear = new Date().getFullYear();
    
    // Generate quarters for current and previous year
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const startDate = new Date(year, (quarter - 1) * 3, 1);
        const endDate = new Date(year, quarter * 3, 0);
        
        this.fiscalPeriods.push({
          period: `Q${quarter}`,
          year,
          quarter,
          startDate,
          endDate
        });
      }
      
      // Annual period
      this.fiscalPeriods.push({
        period: 'FY',
        year,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31)
      });
    }
  }

  // Core ROI Calculation Methods
  calculateSimpleROI(benefit: number, investment: number): number {
    if (investment === 0) return 0;
    return ((benefit - investment) / investment) * 100;
  }

  calculateNetPresentValue(
    cashFlows: number[], 
    discountRate: number, 
    initialInvestment: number
  ): number {
    let npv = -initialInvestment;
    
    cashFlows.forEach((cashFlow, period) => {
      npv += cashFlow / Math.pow(1 + discountRate, period + 1);
    });
    
    return npv;
  }

  calculatePaybackPeriod(initialInvestment: number, annualCashFlow: number): number {
    if (annualCashFlow <= 0) return Infinity;
    return initialInvestment / annualCashFlow;
  }

  calculateInternalRateOfReturn(cashFlows: number[], initialInvestment: number): number {
    // Simplified IRR calculation using Newton-Raphson method
    let rate = 0.1; // Starting guess
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = -initialInvestment;
      let derivative = 0;
      
      cashFlows.forEach((cashFlow, period) => {
        const periodRate = Math.pow(1 + rate, period + 1);
        npv += cashFlow / periodRate;
        derivative -= (period + 1) * cashFlow / Math.pow(1 + rate, period + 2);
      });
      
      if (Math.abs(npv) < tolerance) break;
      
      rate = rate - npv / derivative;
    }
    
    return rate * 100;
  }

  // Cost Savings Analysis
  calculateCostSavings(baseline: number, current: number, timeframe: string = 'annual'): CostSavingsData {
    const savings = baseline - current;
    const percentage = baseline > 0 ? (savings / baseline) * 100 : 0;
    
    let annualized = savings;
    if (timeframe === 'monthly') {
      annualized = savings * 12;
    } else if (timeframe === 'quarterly') {
      annualized = savings * 4;
    }
    
    return {
      category: 'Cost Reduction',
      baseline,
      current,
      savings,
      percentage,
      annualized
    };
  }

  // Infrastructure Cost Savings
  calculateInfrastructureSavings(
    oldInfrastructureCost: number,
    newInfrastructureCost: number,
    migrationCost: number,
    utilizationImprovement: number = 0
  ): ROIMetric {
    const monthlySavings = oldInfrastructureCost - newInfrastructureCost;
    const annualSavings = monthlySavings * 12;
    const utilizationSavings = (oldInfrastructureCost * utilizationImprovement / 100) * 12;
    const totalAnnualBenefit = annualSavings + utilizationSavings;
    const roi = this.calculateSimpleROI(totalAnnualBenefit, migrationCost);
    
    return {
      id: 'infrastructure-savings',
      name: 'Infrastructure Cost Optimization',
      category: 'cost_savings',
      value: roi,
      investment: migrationCost,
      timeframe: 'annual',
      confidence: 85,
      impact: 'high',
      trend: 'improving',
      calculationMethod: `Annual savings: $${totalAnnualBenefit.toLocaleString()}, Investment: $${migrationCost.toLocaleString()}`
    };
  }

  // Operational Efficiency ROI
  calculateEfficiencyROI(
    processName: string,
    timeReductionHours: number,
    hourlyRate: number,
    affectedEmployees: number,
    implementationCost: number
  ): ROIMetric {
    const annualHoursSaved = timeReductionHours * affectedEmployees * 12; // Assuming monthly processes
    const annualSavings = annualHoursSaved * hourlyRate;
    const roi = this.calculateSimpleROI(annualSavings, implementationCost);
    
    return {
      id: `efficiency-${processName.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${processName} Efficiency Improvement`,
      category: 'efficiency',
      value: roi,
      investment: implementationCost,
      timeframe: 'annual',
      confidence: 78,
      impact: 'medium',
      trend: 'improving',
      calculationMethod: `${annualHoursSaved} hours saved annually at $${hourlyRate}/hour`
    };
  }

  // Risk Reduction ROI
  calculateRiskReductionROI(
    riskType: string,
    probabilityReduction: number,
    potentialLoss: number,
    implementationCost: number
  ): ROIMetric {
    const riskValue = (probabilityReduction / 100) * potentialLoss;
    const roi = this.calculateSimpleROI(riskValue, implementationCost);
    
    return {
      id: `risk-${riskType.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${riskType} Risk Mitigation`,
      category: 'risk_reduction',
      value: roi,
      investment: implementationCost,
      timeframe: 'annual',
      confidence: 65,
      impact: 'critical',
      trend: 'stable',
      calculationMethod: `${probabilityReduction}% risk reduction on $${potentialLoss.toLocaleString()} potential loss`
    };
  }

  // Revenue Impact Analysis
  calculateRevenueImpactROI(
    revenueLift: number,
    attributionPercentage: number,
    investmentCost: number,
    timeframe: 'monthly' | 'quarterly' | 'annual' = 'annual'
  ): ROIMetric {
    const attributedRevenue = revenueLift * (attributionPercentage / 100);
    let annualizedRevenue = attributedRevenue;
    
    if (timeframe === 'monthly') {
      annualizedRevenue = attributedRevenue * 12;
    } else if (timeframe === 'quarterly') {
      annualizedRevenue = attributedRevenue * 4;
    }
    
    const roi = this.calculateSimpleROI(annualizedRevenue, investmentCost);
    
    return {
      id: 'revenue-impact',
      name: 'Revenue Growth Initiative',
      category: 'revenue_growth',
      value: roi,
      investment: investmentCost,
      timeframe: 'annual',
      confidence: 72,
      impact: 'high',
      trend: 'improving',
      calculationMethod: `$${annualizedRevenue.toLocaleString()} attributed revenue, ${attributionPercentage}% attribution`
    };
  }

  // Compliance and Quality ROI
  calculateComplianceROI(
    auditCostReduction: number,
    penaltyAvoidance: number,
    implementationCost: number,
    productivityGain: number = 0
  ): ROIMetric {
    const totalBenefit = auditCostReduction + penaltyAvoidance + productivityGain;
    const roi = this.calculateSimpleROI(totalBenefit, implementationCost);
    
    return {
      id: 'compliance-improvement',
      name: 'Compliance and Quality Enhancement',
      category: 'risk_reduction',
      value: roi,
      investment: implementationCost,
      timeframe: 'annual',
      confidence: 88,
      impact: 'high',
      trend: 'stable',
      calculationMethod: `Audit savings: $${auditCostReduction.toLocaleString()}, Penalty avoidance: $${penaltyAvoidance.toLocaleString()}`
    };
  }

  // Portfolio ROI Analysis
  calculatePortfolioROI(metrics: ROIMetric[]): {
    weightedROI: number;
    totalInvestment: number;
    totalBenefit: number;
    confidenceScore: number;
    riskAdjustedROI: number;
  } {
    const totalInvestment = metrics.reduce((sum, metric) => sum + metric.investment, 0);
    const totalBenefit = metrics.reduce((sum, metric) => {
      const benefit = metric.investment * (metric.value / 100) + metric.investment;
      return sum + benefit;
    }, 0);
    
    const weightedROI = totalInvestment > 0 ? ((totalBenefit - totalInvestment) / totalInvestment) * 100 : 0;
    
    const confidenceScore = metrics.reduce((sum, metric, index, array) => {
      const weight = metric.investment / totalInvestment;
      return sum + (metric.confidence * weight);
    }, 0);
    
    const riskAdjustedROI = weightedROI * (confidenceScore / 100);
    
    return {
      weightedROI,
      totalInvestment,
      totalBenefit,
      confidenceScore,
      riskAdjustedROI
    };
  }

  // Fiscal Period Analysis
  generateFiscalAnalysis(
    metrics: ROIMetric[],
    targetPeriod: FiscalPeriod
  ): {
    periodROI: number;
    projectedBenefit: number;
    investmentRequired: number;
    breakEvenPoint: Date;
  } {
    const totalInvestment = metrics.reduce((sum, metric) => sum + metric.investment, 0);
    const annualBenefit = metrics.reduce((sum, metric) => {
      return sum + (metric.investment * metric.value / 100);
    }, 0);
    
    let periodMultiplier = 1;
    if (targetPeriod.quarter) {
      periodMultiplier = 0.25; // Quarterly
    } else if (targetPeriod.month) {
      periodMultiplier = 1/12; // Monthly
    }
    
    const projectedBenefit = annualBenefit * periodMultiplier;
    const periodROI = totalInvestment > 0 ? (projectedBenefit / totalInvestment) * 100 : 0;
    
    // Calculate break-even point
    const monthsToBreakEven = annualBenefit > 0 ? totalInvestment / (annualBenefit / 12) : 0;
    const breakEvenPoint = new Date();
    breakEvenPoint.setMonth(breakEvenPoint.getMonth() + monthsToBreakEven);
    
    return {
      periodROI,
      projectedBenefit,
      investmentRequired: totalInvestment,
      breakEvenPoint
    };
  }

  // Trend Analysis
  calculateTrendAnalysis(
    historicalData: { period: string; value: number; investment: number }[]
  ): {
    growthRate: number;
    volatility: number;
    trend: 'improving' | 'stable' | 'declining';
    forecast: { period: string; projectedROI: number }[];
  } {
    if (historicalData.length < 2) {
      return {
        growthRate: 0,
        volatility: 0,
        trend: 'stable',
        forecast: []
      };
    }
    
    // Calculate growth rate
    const firstValue = historicalData[0].value;
    const lastValue = historicalData[historicalData.length - 1].value;
    const periods = historicalData.length - 1;
    const growthRate = Math.pow(lastValue / firstValue, 1 / periods) - 1;
    
    // Calculate volatility (standard deviation of returns)
    const returns = historicalData.slice(1).map((data, index) => {
      return (data.value - historicalData[index].value) / historicalData[index].value;
    });
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (growthRate > 0.05) trend = 'improving';
    else if (growthRate < -0.05) trend = 'declining';
    
    // Generate forecast for next 4 periods
    const forecast = [];
    const lastDataPoint = historicalData[historicalData.length - 1];
    
    for (let i = 1; i <= 4; i++) {
      const projectedROI = lastDataPoint.value * Math.pow(1 + growthRate, i);
      forecast.push({
        period: `Period +${i}`,
        projectedROI
      });
    }
    
    return {
      growthRate: growthRate * 100,
      volatility: volatility * 100,
      trend,
      forecast
    };
  }

  // Scenario Analysis
  generateScenarioAnalysis(
    baseMetric: ROIMetric,
    scenarios: { name: string; investmentMultiplier: number; benefitMultiplier: number }[]
  ): { scenario: string; roi: number; investment: number; benefit: number; risk: string }[] {
    return scenarios.map(scenario => {
      const adjustedInvestment = baseMetric.investment * scenario.investmentMultiplier;
      const adjustedBenefit = (baseMetric.investment * baseMetric.value / 100) * scenario.benefitMultiplier;
      const roi = this.calculateSimpleROI(adjustedBenefit, adjustedInvestment);
      
      let risk = 'Medium';
      if (scenario.investmentMultiplier > 1.5 || scenario.benefitMultiplier < 0.8) risk = 'High';
      else if (scenario.investmentMultiplier < 0.8 && scenario.benefitMultiplier > 1.2) risk = 'Low';
      
      return {
        scenario: scenario.name,
        roi,
        investment: adjustedInvestment,
        benefit: adjustedBenefit,
        risk
      };
    });
  }

  // Utility Methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  getRiskLevel(confidence: number): 'Low' | 'Medium' | 'High' | 'Very High' {
    if (confidence >= 85) return 'Low';
    if (confidence >= 70) return 'Medium';
    if (confidence >= 50) return 'High';
    return 'Very High';
  }

  getImpactScore(impact: string): number {
    switch (impact) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }
}

// Export a singleton instance for use across the application
export const roiEngine = new ROICalculationEngine();