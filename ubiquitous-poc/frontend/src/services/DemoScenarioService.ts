export interface ScenarioStep {
  id: string;
  duration: number;
  description: string;
  data: any;
  visualization: string;
  insights: string[];
  metrics: {
    [key: string]: number | string;
  };
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  totalDuration: number;
  businessValue: number;
  steps: ScenarioStep[];
  category: 'performance' | 'cost' | 'security' | 'compliance';
}

export class DemoScenarioService {
  private scenarios: Map<string, DemoScenario> = new Map();
  private currentStep: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private stepTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(scenario: string, step: number) => void> = new Set();

  constructor() {
    this.initializeScenarios();
  }

  private initializeScenarios() {
    // EKS Pod Scaling Crisis Scenario
    this.scenarios.set('trading-crisis', {
      id: 'trading-crisis',
      name: 'EKS Pod Scaling Crisis',
      description: 'Trading pods failing to scale during market hours',
      totalDuration: 300, // 5 minutes
      businessValue: 2000000,
      category: 'performance',
      steps: [
        {
          id: 'alert-trigger',
          duration: 45,
          description: 'Critical alert: Trading API response time > 5s',
          visualization: 'performance',
          data: {
            latency: 5200,
            errorRate: 15.3,
            throughput: 450,
            alerts: [
              { severity: 'critical', message: 'Trading API latency exceeded SLA', timestamp: Date.now() }
            ]
          },
          insights: [
            'Trading API response time increased 300% in last 15 minutes',
            'Pod autoscaler hitting resource limits',
            'Market volatility causing 3x normal traffic'
          ],
          metrics: {
            'Current Latency': '5.2s',
            'SLA Threshold': '2.0s',
            'Error Rate': '15.3%',
            'Revenue at Risk': '$50K/min'
          }
        },
        {
          id: 'eks-analysis',
          duration: 60,
          description: 'Navigate to EKS cluster analysis',
          visualization: 'infrastructure-graph',
          data: {
            cluster: 'prod-trading',
            pods: {
              desired: 50,
              running: 32,
              pending: 18,
              failed: 3
            },
            nodes: {
              total: 12,
              cpu_usage: 89,
              memory_usage: 94
            }
          },
          insights: [
            'EKS cluster at 94% memory utilization',
            '18 pods stuck in pending state',
            'Auto Scaling Group hitting maximum instance limit'
          ],
          metrics: {
            'Pod Scaling Efficiency': '64%',
            'Node Utilization': '89%',
            'Pending Pods': '18',
            'Time to Scale': '8.5 min'
          }
        },
        {
          id: 'bottleneck-identification',
          duration: 75,
          description: 'Identify Auto Scaling Group bottleneck',
          visualization: 'network-analysis',
          data: {
            asg_limits: {
              current: 12,
              max: 12,
              desired: 18
            },
            instance_types: ['c5.2xlarge', 'c5.4xlarge'],
            availability_zones: ['us-east-1a', 'us-east-1b', 'us-east-1c']
          },
          insights: [
            'ASG max capacity preventing scale-out',
            'c5.4xlarge instances would provide 2x capacity',
            'Zone balancing creating inefficient placement'
          ],
          metrics: {
            'ASG Utilization': '100%',
            'Instance Efficiency': '76%',
            'Cost per Request': '$0.045',
            'Optimal Cost': '$0.019'
          }
        },
        {
          id: 'terraform-fix',
          duration: 90,
          description: 'Generate Terraform fix for ASG limits',
          visualization: 'finops',
          data: {
            terraform_changes: {
              max_size: 24,
              instance_types: ['c5.2xlarge', 'c5.4xlarge', 'c5.9xlarge'],
              mixed_instances_policy: true
            },
            cost_impact: {
              current_hourly: 48,
              optimized_hourly: 32,
              monthly_savings: 11520
            }
          },
          insights: [
            'Increase ASG max size from 12 to 24 instances',
            'Enable mixed instance types for cost optimization',
            'Implement spot instances for 60% cost reduction'
          ],
          metrics: {
            'Monthly Savings': '$11,520',
            'Performance Improvement': '340%',
            'Implementation Time': '15 min',
            'Risk Level': 'Low'
          }
        },
        {
          id: 'resolution-validation',
          duration: 30,
          description: 'Validate fix and measure business impact',
          visualization: 'executive',
          data: {
            resolution_time: 900, // 15 minutes
            performance_improvement: 340,
            business_impact: {
              revenue_protected: 2000000,
              sla_restored: true,
              customer_satisfaction: 99.2
            }
          },
          insights: [
            'Trading API latency reduced from 5.2s to 1.1s',
            'Zero revenue loss during market close',
            '$2M in potential trading losses prevented'
          ],
          metrics: {
            'Final Latency': '1.1s',
            'Revenue Protected': '$2M',
            'Resolution Time': '15 min',
            'Customer Impact': 'Zero'
          }
        }
      ]
    });

    // RDS Oracle Performance Crisis Scenario
    this.scenarios.set('cost-spiral', {
      id: 'cost-spiral',
      name: 'RDS Oracle Performance Crisis',
      description: 'Oracle RDS hitting CPU/connection limits affecting trading',
      totalDuration: 240, // 4 minutes
      businessValue: 9360000,
      category: 'cost',
      steps: [
        {
          id: 'database-alerts',
          duration: 40,
          description: 'Critical database performance alerts',
          visualization: 'observability',
          data: {
            rds_instance: 'trading-oracle-prod',
            cpu_utilization: 98,
            connection_count: 485,
            max_connections: 500,
            query_latency: 2300
          },
          insights: [
            'Oracle RDS at 98% CPU utilization',
            'Connection pool nearly exhausted (485/500)',
            'Query latency increased 400% in last hour'
          ],
          metrics: {
            'CPU Usage': '98%',
            'Connections': '485/500',
            'Query Latency': '2.3s',
            'License Cost': '$18K/month'
          }
        },
        {
          id: 'cost-analysis',
          duration: 60,
          description: 'Analyze Oracle licensing costs and usage patterns',
          visualization: 'finops',
          data: {
            oracle_licenses: {
              enterprise: 4,
              cost_per_license: 4500,
              actual_usage: 65,
              required_features: ['partitioning', 'advanced_security']
            },
            workload_analysis: {
              oltp_percentage: 75,
              analytics_percentage: 25,
              peak_connections: 485,
              avg_connections: 280
            }
          },
          insights: [
            'Only using 65% of Oracle Enterprise features',
            'OLTP workload could run on PostgreSQL',
            'Analytics workload suitable for data warehouse'
          ],
          metrics: {
            'Current Cost': '$18K/month',
            'Feature Utilization': '65%',
            'Migration Feasibility': '89%',
            'Risk Assessment': 'Medium'
          }
        },
        {
          id: 'migration-recommendation',
          duration: 80,
          description: 'Generate PostgreSQL migration analysis',
          visualization: 'infrastructure-graph',
          data: {
            migration_plan: {
              source: 'Oracle Enterprise',
              target: 'PostgreSQL 15 + TimescaleDB',
              compatibility: 89,
              effort_weeks: 8
            },
            cost_comparison: {
              oracle_annual: 216000,
              postgresql_annual: 36000,
              migration_cost: 120000,
              annual_savings: 180000
            }
          },
          insights: [
            'PostgreSQL compatibility score: 89%',
            'TimescaleDB ideal for time-series analytics',
            '8-week migration timeline with minimal downtime'
          ],
          metrics: {
            'Annual Savings': '$180K',
            'Migration Cost': '$120K',
            'ROI Timeline': '8 months',
            'Performance Impact': '+15%'
          }
        },
        {
          id: 'business-case',
          duration: 60,
          description: 'Present business case for Oracle migration',
          visualization: 'executive',
          data: {
            three_year_savings: 540000,
            performance_improvement: 15,
            maintenance_reduction: 40,
            vendor_diversification: true
          },
          insights: [
            '3-year TCO reduction: $540K',
            'Reduced vendor lock-in and licensing complexity',
            'Improved performance with modern PostgreSQL'
          ],
          metrics: {
            '3-Year Savings': '$540K',
            'Performance Gain': '+15%',
            'Maintenance Reduction': '40%',
            'Business Risk': 'Low'
          }
        }
      ]
    });

    // Multi-Service AWS Cost Spiral Scenario
    this.scenarios.set('security-breach', {
      id: 'security-breach',
      name: 'Multi-Service AWS Cost Spiral',
      description: '40% AWS bill increase from inefficient service configurations',
      totalDuration: 270, // 4.5 minutes
      businessValue: 6080000,
      category: 'cost',
      steps: [
        {
          id: 'cost-anomaly',
          duration: 45,
          description: 'AWS cost anomaly detection triggers investigation',
          visualization: 'finops',
          data: {
            cost_increase: 42,
            affected_services: ['S3', 'Lambda', 'API Gateway', 'CloudWatch', 'VPC'],
            monthly_delta: 156000,
            trend_direction: 'exponential'
          },
          insights: [
            '42% AWS cost increase over 3 months',
            'S3 storage costs doubled without usage increase',
            'Lambda invocation costs up 380%'
          ],
          metrics: {
            'Cost Increase': '42%',
            'Monthly Delta': '$156K',
            'Affected Services': '12',
            'Trend': 'Exponential'
          }
        },
        {
          id: 's3-lambda-analysis',
          duration: 75,
          description: 'Deep-dive into S3 and Lambda cost drivers',
          visualization: 'network-analysis',
          data: {
            s3_analysis: {
              storage_class: 'Standard',
              access_patterns: 'Infrequent',
              lifecycle_policies: false,
              cross_region_replication: true
            },
            lambda_analysis: {
              memory_allocation: 3008,
              avg_utilization: 45,
              cold_starts: 15000,
              vpc_configuration: true
            }
          },
          insights: [
            'S3 Standard storage for infrequently accessed data',
            'Lambda over-provisioned with 3GB memory (45% utilized)',
            'VPC Lambda functions causing 2x cost increase'
          ],
          metrics: {
            'S3 Waste': '$45K/month',
            'Lambda Efficiency': '45%',
            'VPC Overhead': '200%',
            'Optimization Potential': '$89K/month'
          }
        },
        {
          id: 'vpc-endpoint-discovery',
          duration: 90,
          description: 'Discover VPC endpoint optimization opportunities',
          visualization: 'infrastructure-graph',
          data: {
            vpc_endpoints: {
              current: 2,
              recommended: 8,
              services: ['S3', 'DynamoDB', 'Lambda', 'API Gateway']
            },
            data_transfer_costs: {
              current: 23400,
              optimized: 4200,
              monthly_savings: 19200
            }
          },
          insights: [
            'Missing VPC endpoints causing expensive NAT Gateway usage',
            '8 VPC endpoints would eliminate 82% of data transfer costs',
            'Lambda functions unnecessarily routing through internet'
          ],
          metrics: {
            'Current Data Transfer': '$23.4K/month',
            'With VPC Endpoints': '$4.2K/month',
            'Monthly Savings': '$19.2K',
            'Implementation Cost': '$2.4K'
          }
        },
        {
          id: 'comprehensive-optimization',
          duration: 60,
          description: 'Generate comprehensive AWS optimization plan',
          visualization: 'finops',
          data: {
            optimization_plan: {
              s3_lifecycle: { savings: 45000, effort: 'low' },
              lambda_rightsizing: { savings: 28000, effort: 'medium' },
              vpc_endpoints: { savings: 19200, effort: 'low' },
              reserved_instances: { savings: 67800, effort: 'low' }
            },
            total_monthly_savings: 160000,
            annual_impact: 1920000
          },
          insights: [
            'Total monthly AWS savings: $160K',
            'Reserved Instance strategy alone saves $67.8K/month',
            'All optimizations implementable within 4 weeks'
          ],
          metrics: {
            'Monthly Savings': '$160K',
            'Annual Impact': '$1.92M',
            'Implementation Time': '4 weeks',
            'ROI': '2,400%'
          }
        }
      ]
    });

    // EC2 SQL Server Licensing Scenario
    this.scenarios.set('executive-value', {
      id: 'executive-value',
      name: 'EC2 SQL Server Licensing Optimization',
      description: 'Over-provisioned Enterprise SQL Server licenses costing $240K annually',
      totalDuration: 180, // 3 minutes
      businessValue: 41600000,
      category: 'compliance',
      steps: [
        {
          id: 'license-audit',
          duration: 50,
          description: 'SQL Server license audit reveals over-provisioning',
          visualization: 'security',
          data: {
            sql_instances: 4,
            enterprise_licenses: 4,
            actual_feature_usage: {
              always_on: false,
              tde: false,
              partitioning: false,
              advanced_analytics: false
            },
            license_cost_annual: 240000
          },
          insights: [
            '4 SQL Server Enterprise licenses ($60K each annually)',
            'Zero usage of Enterprise-only features',
            'Standard Edition would meet all requirements'
          ],
          metrics: {
            'Enterprise Licenses': '4',
            'Feature Utilization': '0%',
            'Annual Cost': '$240K',
            'Compliance Risk': 'None'
          }
        },
        {
          id: 'workload-assessment',
          duration: 70,
          description: 'Analyze SQL Server workload requirements',
          visualization: 'performance',
          data: {
            workload_analysis: {
              max_database_size: '450GB',
              concurrent_connections: 45,
              cpu_cores_used: 8,
              ram_requirement: '32GB'
            },
            standard_edition_limits: {
              max_database_size: '524GB',
              max_connections: 32767,
              max_cpu_cores: 24,
              max_ram: '128GB'
            }
          },
          insights: [
            'Current workload well within Standard Edition limits',
            'No Enterprise features in actual use',
            'Standard Edition provides 40% cost savings'
          ],
          metrics: {
            'DB Size vs Limit': '450GB / 524GB',
            'CPU Usage': '8 / 24 cores',
            'Memory Usage': '32GB / 128GB',
            'Compliance': '100%'
          }
        },
        {
          id: 'savings-calculation',
          duration: 60,
          description: 'Calculate licensing optimization savings',
          visualization: 'executive',
          data: {
            current_cost: {
              enterprise_annual: 240000,
              support_annual: 48000,
              total_annual: 288000
            },
            optimized_cost: {
              standard_annual: 48000,
              support_annual: 9600,
              total_annual: 57600
            },
            annual_savings: 230400,
            three_year_savings: 691200
          },
          insights: [
            'Annual licensing savings: $230.4K (80% reduction)',
            '3-year savings: $691.2K with no functionality loss',
            'Migration risk: Near zero (same SQL Server, different edition)'
          ],
          metrics: {
            'Annual Savings': '$230.4K',
            '3-Year Savings': '$691.2K',
            'Cost Reduction': '80%',
            'Migration Risk': 'Minimal'
          }
        }
      ]
    });
  }

  public getScenario(id: string): DemoScenario | undefined {
    return this.scenarios.get(id);
  }

  public getAllScenarios(): DemoScenario[] {
    return Array.from(this.scenarios.values());
  }

  public startScenario(scenarioId: string): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return false;

    this.currentStep = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.notifyListeners(scenarioId, 0);
    this.scheduleNextStep(scenarioId);
    return true;
  }

  public pauseScenario(): void {
    this.isPaused = true;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  public resumeScenario(scenarioId: string): void {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.scheduleNextStep(scenarioId);
  }

  public stopScenario(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.currentStep = 0;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  public jumpToStep(scenarioId: string, stepIndex: number): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return false;

    this.currentStep = stepIndex;
    this.notifyListeners(scenarioId, stepIndex);
    
    if (this.isRunning && !this.isPaused) {
      this.scheduleNextStep(scenarioId);
    }
    
    return true;
  }

  public getCurrentStep(scenarioId: string): ScenarioStep | null {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || this.currentStep >= scenario.steps.length) return null;
    return scenario.steps[this.currentStep];
  }

  public getScenarioProgress(scenarioId: string): number {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return 0;
    return Math.round(((this.currentStep + 1) / scenario.steps.length) * 100);
  }

  public isScenarioRunning(): boolean {
    return this.isRunning;
  }

  public isScenarioPaused(): boolean {
    return this.isPaused;
  }

  public getCurrentStepIndex(): number {
    return this.currentStep;
  }

  public addStepListener(callback: (scenario: string, step: number) => void): void {
    this.listeners.add(callback);
  }

  public removeStepListener(callback: (scenario: string, step: number) => void): void {
    this.listeners.delete(callback);
  }

  private scheduleNextStep(scenarioId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || this.currentStep >= scenario.steps.length - 1) {
      this.stopScenario();
      return;
    }

    const currentStepData = scenario.steps[this.currentStep];
    this.stepTimer = setTimeout(() => {
      this.currentStep++;
      this.notifyListeners(scenarioId, this.currentStep);
      this.scheduleNextStep(scenarioId);
    }, currentStepData.duration * 1000);
  }

  private notifyListeners(scenarioId: string, stepIndex: number): void {
    this.listeners.forEach(callback => callback(scenarioId, stepIndex));
  }

  public getScenarioSummary(): any {
    return {
      totalScenarios: this.scenarios.size,
      totalBusinessValue: Array.from(this.scenarios.values()).reduce((sum, s) => sum + s.businessValue, 0),
      totalDuration: Array.from(this.scenarios.values()).reduce((sum, s) => sum + s.totalDuration, 0),
      categories: Array.from(new Set(Array.from(this.scenarios.values()).map(s => s.category)))
    };
  }
}

export const demoScenarioService = new DemoScenarioService();