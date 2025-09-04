export interface RealTimeMetric {
  timestamp: number;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface RealTimeVisualizationData {
  type: string;
  scenarioId?: string;
  stepIndex?: number;
  metrics: {
    [key: string]: RealTimeMetric;
  };
  alerts?: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  businessImpact?: {
    financial: number;
    systems: string;
  };
}

export class RealTimeDataService {
  private listeners: Map<string, Set<(data: RealTimeVisualizationData) => void>> = new Map();
  private dataStreams: Map<string, RealTimeVisualizationData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private scenarioTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startDataGeneration();
  }

  public subscribeToVisualization(
    visualizationType: string,
    callback: (data: RealTimeVisualizationData) => void
  ): () => void {
    if (!this.listeners.has(visualizationType)) {
      this.listeners.set(visualizationType, new Set());
    }
    
    this.listeners.get(visualizationType)!.add(callback);
    
    // Send initial data if available
    const currentData = this.dataStreams.get(visualizationType);
    if (currentData) {
      callback(currentData);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(visualizationType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(visualizationType);
        }
      }
    };
  }

  public updateScenarioData(scenarioId: string, stepIndex: number, stepData: any): void {
    const visualizationData: RealTimeVisualizationData = {
      type: 'scenario_update',
      scenarioId,
      stepIndex,
      metrics: this.transformStepDataToMetrics(stepData),
      alerts: this.generateAlertsFromStepData(stepData),
      businessImpact: stepData.impact
    };

    // Update all relevant visualization types based on scenario
    const visualizationTypes = this.getVisualizationTypesForScenario(scenarioId);
    
    visualizationTypes.forEach(vizType => {
      this.dataStreams.set(vizType, {
        ...visualizationData,
        type: vizType
      });
      
      const listeners = this.listeners.get(vizType);
      if (listeners) {
        listeners.forEach(callback => callback({
          ...visualizationData,
          type: vizType
        }));
      }
    });
  }

  private startDataGeneration(): void {
    // Generate periodic system updates every 2 seconds
    this.updateInterval = setInterval(() => {
      this.generateSystemUpdates();
    }, 2000);
  }

  private generateSystemUpdates(): void {
    const now = Date.now();
    
    // Performance metrics
    const performanceData: RealTimeVisualizationData = {
      type: 'performance',
      metrics: {
        cpu_utilization: {
          timestamp: now,
          value: 65 + Math.random() * 20,
          unit: '%',
          trend: Math.random() > 0.5 ? 'up' : 'down'
        },
        memory_usage: {
          timestamp: now,
          value: 70 + Math.random() * 15,
          unit: '%',
          trend: 'stable'
        },
        network_throughput: {
          timestamp: now,
          value: 850 + Math.random() * 200,
          unit: 'Mbps',
          trend: 'up'
        },
        response_time: {
          timestamp: now,
          value: 120 + Math.random() * 80,
          unit: 'ms',
          trend: Math.random() > 0.7 ? 'up' : 'down'
        }
      }
    };

    // FinOps metrics
    const finopsData: RealTimeVisualizationData = {
      type: 'finops',
      metrics: {
        hourly_cost: {
          timestamp: now,
          value: 145 + Math.random() * 30,
          unit: '$',
          trend: Math.random() > 0.6 ? 'down' : 'up'
        },
        cost_optimization: {
          timestamp: now,
          value: 25 + Math.random() * 15,
          unit: '%',
          trend: 'up'
        },
        resource_efficiency: {
          timestamp: now,
          value: 78 + Math.random() * 12,
          unit: '%',
          trend: 'stable'
        }
      }
    };

    // Network Analysis metrics
    const networkData: RealTimeVisualizationData = {
      type: 'network-analysis',
      metrics: {
        active_connections: {
          timestamp: now,
          value: 15420 + Math.random() * 1000,
          unit: 'connections',
          trend: 'stable'
        },
        packet_loss: {
          timestamp: now,
          value: 0.1 + Math.random() * 0.3,
          unit: '%',
          trend: Math.random() > 0.8 ? 'up' : 'down'
        },
        latency: {
          timestamp: now,
          value: 35 + Math.random() * 25,
          unit: 'ms',
          trend: Math.random() > 0.5 ? 'down' : 'up'
        }
      }
    };

    // Security metrics
    const securityData: RealTimeVisualizationData = {
      type: 'security',
      metrics: {
        threat_score: {
          timestamp: now,
          value: 15 + Math.random() * 10,
          unit: 'score',
          trend: Math.random() > 0.7 ? 'up' : 'down'
        },
        blocked_attempts: {
          timestamp: now,
          value: Math.floor(Math.random() * 50),
          unit: 'attempts/min',
          trend: 'stable'
        },
        compliance_score: {
          timestamp: now,
          value: 94 + Math.random() * 4,
          unit: '%',
          trend: 'stable'
        }
      },
      alerts: Math.random() > 0.9 ? [{
        severity: Math.random() > 0.5 ? 'warning' : 'info' as const,
        message: Math.random() > 0.5 ? 
          'Unusual access pattern detected from IP 192.168.1.45' : 
          'Security scan completed successfully',
        timestamp: now
      }] : undefined
    };

    // Update data streams and notify listeners
    [performanceData, finopsData, networkData, securityData].forEach(data => {
      this.dataStreams.set(data.type, data);
      
      const listeners = this.listeners.get(data.type);
      if (listeners) {
        listeners.forEach(callback => callback(data));
      }
    });
  }

  private transformStepDataToMetrics(stepData: any): { [key: string]: RealTimeMetric } {
    const now = Date.now();
    const metrics: { [key: string]: RealTimeMetric } = {};

    if (stepData.metrics) {
      Object.entries(stepData.metrics).forEach(([key, value]) => {
        metrics[key] = {
          timestamp: now,
          value: typeof value === 'number' ? value : parseFloat(String(value)) || 0,
          unit: this.getUnitForMetric(key),
          trend: this.calculateTrend(key, typeof value === 'number' ? value : parseFloat(String(value)) || 0)
        };
      });
    }

    return metrics;
  }

  private generateAlertsFromStepData(stepData: any): Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }> | undefined {
    const alerts = [];
    const now = Date.now();

    if (stepData.metrics) {
      // Generate alerts based on thresholds
      if (stepData.metrics.cpu_utilization > 90) {
        alerts.push({
          severity: 'critical' as const,
          message: `CPU utilization critical: ${stepData.metrics.cpu_utilization}%`,
          timestamp: now
        });
      } else if (stepData.metrics.cpu_utilization > 80) {
        alerts.push({
          severity: 'warning' as const,
          message: `CPU utilization high: ${stepData.metrics.cpu_utilization}%`,
          timestamp: now
        });
      }

      if (stepData.metrics.error_rate > 10) {
        alerts.push({
          severity: 'critical' as const,
          message: `Error rate critical: ${stepData.metrics.error_rate}%`,
          timestamp: now
        });
      }

      if (stepData.metrics.riskScore > 80) {
        alerts.push({
          severity: 'critical' as const,
          message: `Security risk score critical: ${stepData.metrics.riskScore}`,
          timestamp: now
        });
      }
    }

    return alerts.length > 0 ? alerts : undefined;
  }

  private getVisualizationTypesForScenario(scenarioId: string): string[] {
    const scenarioToVisualizationMap = {
      'trading-crisis': ['performance', 'infrastructure-graph', 'network-analysis'],
      'cost-spiral': ['finops', 'infrastructure-graph', 'observability'],
      'security-breach': ['security', 'network-analysis', 'observability'],
      'executive-value': ['executive', 'finops', 'performance']
    };

    return scenarioToVisualizationMap[scenarioId as keyof typeof scenarioToVisualizationMap] || ['performance'];
  }

  private getUnitForMetric(metricKey: string): string {
    const unitMap: { [key: string]: string } = {
      cpu_utilization: '%',
      memory_usage: '%',
      error_rate: '%',
      requests_per_second: 'req/s',
      response_time: 'ms',
      latency: 'ms',
      throughput: 'Mbps',
      cost: '$',
      financial: '$',
      riskScore: 'score',
      optimization: '%',
      efficiency: '%',
      connections: 'conn',
      criticalVulns: 'vulns',
      exposedServices: 'services'
    };

    // Check for partial matches
    for (const [key, unit] of Object.entries(unitMap)) {
      if (metricKey.toLowerCase().includes(key.toLowerCase())) {
        return unit;
      }
    }

    return 'value';
  }

  private calculateTrend(metricKey: string, currentValue: number): 'up' | 'down' | 'stable' {
    // Simple trend calculation based on random variation for demo
    // In a real system, this would compare with historical data
    const variation = Math.random();
    
    if (metricKey.includes('cost') || metricKey.includes('error') || metricKey.includes('risk')) {
      // For negative metrics, down is good
      return variation > 0.6 ? 'down' : variation < 0.3 ? 'up' : 'stable';
    } else {
      // For positive metrics, up is generally good
      return variation > 0.6 ? 'up' : variation < 0.3 ? 'down' : 'stable';
    }
  }

  public simulateScenarioProgression(scenarioId: string, stepDuration: number): void {
    // Clear existing timer for this scenario
    const existingTimer = this.scenarioTimers.get(scenarioId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    let currentStep = 0;
    const maxSteps = this.getMaxStepsForScenario(scenarioId);

    const progressScenario = () => {
      if (currentStep >= maxSteps) {
        this.scenarioTimers.delete(scenarioId);
        return;
      }

      const stepData = this.generateStepData(scenarioId, currentStep);
      this.updateScenarioData(scenarioId, currentStep, stepData);

      currentStep++;
      const timer = setTimeout(progressScenario, stepDuration * 1000);
      this.scenarioTimers.set(scenarioId, timer);
    };

    // Start progression
    progressScenario();
  }

  private getMaxStepsForScenario(scenarioId: string): number {
    const stepCounts = {
      'trading-crisis': 8,
      'cost-spiral': 6,
      'security-breach': 7,
      'executive-value': 5
    };
    return stepCounts[scenarioId as keyof typeof stepCounts] || 5;
  }

  private generateStepData(scenarioId: string, stepIndex: number): any {
    // Generate realistic step data based on scenario and step
    const baseData = {
      'trading-crisis': {
        metrics: {
          requests_per_second: 2500 + (stepIndex * 300) + (Math.random() * 200),
          cpu_utilization: 35 + (stepIndex * 8) + (Math.random() * 10),
          error_rate: Math.max(0.1, 15.3 - (stepIndex * 2.2) + (Math.random() * 2))
        },
        impact: {
          financial: 350000 + (stepIndex * 250000),
          systems: `EKS Cluster - Step ${stepIndex + 1}`
        }
      },
      'cost-spiral': {
        metrics: {
          totalMonthlyCost: 1450000 - (stepIndex * 90000),
          costIncrease: Math.max(15, 52.1 - (stepIndex * 6)),
          optimizationPotential: Math.max(200000, 890000 - (stepIndex * 110000))
        },
        impact: {
          financial: 120000 + (stepIndex * 110000),
          systems: `AWS Services - Optimization ${stepIndex + 1}`
        }
      },
      'security-breach': {
        metrics: {
          riskScore: Math.max(15, 92 - (stepIndex * 11)),
          criticalVulns: Math.max(0, 5 - stepIndex),
          exposedServices: Math.max(0, 15 - (stepIndex * 2))
        },
        impact: {
          financial: 850000 + (stepIndex * 750000),
          systems: `Security Layer ${stepIndex + 1}`
        }
      },
      'executive-value': {
        metrics: {
          totalAnnualValue: 12400000 + (stepIndex * 7300000),
          roiPercentage: 85 + (stepIndex * 51)
        },
        impact: {
          financial: 12400000 + (stepIndex * 7300000),
          systems: `Business Value Layer ${stepIndex + 1}`
        }
      }
    };

    return baseData[scenarioId as keyof typeof baseData] || baseData['trading-crisis'];
  }

  public stopScenarioProgression(scenarioId: string): void {
    const timer = this.scenarioTimers.get(scenarioId);
    if (timer) {
      clearTimeout(timer);
      this.scenarioTimers.delete(scenarioId);
    }
  }

  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.scenarioTimers.forEach(timer => clearTimeout(timer));
    this.scenarioTimers.clear();

    this.listeners.clear();
    this.dataStreams.clear();
  }
}

export const realTimeDataService = new RealTimeDataService();