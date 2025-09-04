import React, { useEffect, useState } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  LoadingOverlay,
  Box,
  Title,
  Paper,
  RingProgress,
  Progress,
  ActionIcon,
  Tooltip,
  Select,
} from '@mantine/core';
import {
  IconCurrencyDollar,
  IconTrendingDown,
  IconTrendingUp,
  IconTarget,
  IconRefresh,
  IconDownload,
  IconInfoCircle,
} from '@tabler/icons-react';
import { DonutChart, BarChart, CompositeChart } from '@mantine/charts';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';
import CostBreakdownTreemap from '../../components/Visualizations/CostBreakdownTreemap';
import CostTrendChart from '../../components/Visualizations/CostTrendChart';
import EKSCostAnalysis from '../../components/Visualizations/EKSCostAnalysis';
import OptimizationRecommendations from '../../components/Visualizations/OptimizationRecommendations';
import './FinOps.css';

interface CostAnalysis {
  current: string;
  optimized: string;
  savings: string;
  savingsPercent: string;
}

interface ResourceUtilization {
  compute: number;
  storage: number;
  network: number;
  database: number;
}

interface TerraformRecommendation {
  id: number;
  title: string;
  description: string;
  currentConfig: string;
  recommendedConfig: string;
  terraformCode: {
    remove: string[];
    add: string[];
  };
  monthlySavings: string;
}

interface FinOpsData {
  costBreakdown?: any;
  costTrends?: any;
  eksAnalysis?: any;
  optimizations?: any;
}

const FinOps: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [finopsData, setFinopsData] = useState<FinOpsData | null>(null);
  const [selectedCostItem, setSelectedCostItem] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'priority' | 'savings' | 'roi' | 'effort'>('priority');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadFinOpsData();
  }, [selectedTimeRange]);

  const loadFinOpsData = async () => {
    try {
      setLoading(true);
      
      // Load interactive D3.js component data
      const costResponse = await api.get('/api/finops/cost-analysis');
      const optimizationResponse = await api.get('/api/finops/terraform-recommendations');
      
      console.log('Cost Response:', costResponse);
      console.log('Optimization Response:', optimizationResponse);
      
      // Transform API data for D3.js components - handle both response structures
      const costData = costResponse.data || costResponse;
      const optimizationData = optimizationResponse.data || optimizationResponse;
      
      const transformedCostBreakdown = costData.services?.map((service: any) => {
        // Categorize services based on their logical purpose for better visualization
        let category: 'compute' | 'storage' | 'network' | 'database' | 'other' = 'compute';
        
        // Categorize by service purpose for realistic diversity
        if (service.service.includes('analytics') || service.service.includes('notification')) {
          category = 'database'; // Analytics and notifications are data-heavy
        } else if (service.service.includes('payment') || service.service.includes('user-management')) {
          category = 'storage'; // Payment and user data require significant storage
        } else if (service.environment === 'staging' && service.service === 'auth-service') {
          category = 'network'; // Auth service in staging is network-heavy for load balancing
        } else {
          category = 'compute'; // Default for EKS/compute workloads
        }
        
        return {
          id: `${service.service}-${service.environment}`,
          name: `${service.service} (${service.environment})`,
          category,
          service: service.service,
          cost: service.costs.total,
          trend: service.efficiency_score > 80 ? 'stable' : service.efficiency_score < 70 ? 'increasing' : 'decreasing' as 'increasing' | 'decreasing' | 'stable',
          trendPercentage: service.efficiency_score,
          region: service.environment,
          optimizable: service.efficiency_score < 80,
          potentialSavings: service.efficiency_score < 80 ? service.costs.total * (80 - service.efficiency_score) / 100 : 0
        };
      }) || [];


      // Generate mock cost trend data for the chart based on selected time range
      const daysCount = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      const mockCostTrends = costData.summary ? Array.from({ length: daysCount }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (daysCount - 1 - i));
        
        // Calculate proportional costs from actual service categorization
        const totalCost = costData.summary.total_cost * (0.8 + Math.random() * 0.4);
        const computeCost = costData.breakdown.by_category.compute * (0.8 + Math.random() * 0.4);
        const storageCost = costData.breakdown.by_category.storage * (0.8 + Math.random() * 0.4);
        const networkCost = costData.breakdown.by_category.network * (0.8 + Math.random() * 0.4);
        
        // Calculate database and other based on service categorization
        const databaseServices = transformedCostBreakdown.filter(s => s.category === 'database');
        const otherServices = transformedCostBreakdown.filter(s => s.category === 'other');
        const databaseCost = databaseServices.reduce((sum, s) => sum + s.cost, 0) * (0.8 + Math.random() * 0.4);
        const otherCost = otherServices.reduce((sum, s) => sum + s.cost, 0) * (0.8 + Math.random() * 0.4);
        
        return {
          date,
          totalCost,
          compute: computeCost,
          storage: storageCost,
          network: networkCost,
          database: databaseCost,
          other: otherCost,
          optimizedCost: totalCost * 0.85 // Show optimization potential
        };
      }) : [];

      // Create diverse optimization recommendations with varied sortable fields
      const transformedOptimizations = [
        {
          id: 'opt-1',
          category: 'cost' as 'cost' | 'performance' | 'security' | 'reliability',
          service: 'EKS Trading Cluster',
          title: 'Implement Reserved Instances',
          description: 'Switch from On-Demand to Reserved Instances for stable workloads',
          impact: {
            costSavings: 15600,
            performanceImprovement: 0,
            riskReduction: 'Low'
          },
          priority: 'high' as 'critical' | 'high' | 'medium' | 'low',
          implementation: {
            effort: 'low' as 'low' | 'medium' | 'high',
            timeEstimate: '1-2 weeks',
            complexity: 'simple' as 'simple' | 'moderate' | 'complex',
            prerequisites: ['Finance approval', 'Usage analysis']
          },
          status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
          targetResource: {
            type: 'eks' as 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other',
            name: 'prod-trading',
            region: 'us-east-1'
          },
          automatable: true,
          terraformCode: 'resource "aws_launch_template" "reserved" {\n  instance_type = "m5.large"\n}',
          tags: ['cost', 'reserved-instances'],
          createdAt: new Date(),
          estimatedROI: 15.6
        },
        {
          id: 'opt-2',
          category: 'performance' as 'cost' | 'performance' | 'security' | 'reliability',
          service: 'RDS Production',
          title: 'Optimize Database Connections',
          description: 'Implement connection pooling to reduce database overhead',
          impact: {
            costSavings: 3200,
            performanceImprovement: 40,
            riskReduction: 'Medium'
          },
          priority: 'critical' as 'critical' | 'high' | 'medium' | 'low',
          implementation: {
            effort: 'high' as 'low' | 'medium' | 'high',
            timeEstimate: '4-6 weeks',
            complexity: 'complex' as 'simple' | 'moderate' | 'complex',
            prerequisites: ['Application code changes', 'Database migration']
          },
          status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
          targetResource: {
            type: 'rds' as 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other',
            name: 'trading-db-primary',
            region: 'us-east-1'
          },
          automatable: false,
          terraformCode: '',
          tags: ['performance', 'database'],
          createdAt: new Date(),
          estimatedROI: 3.2
        },
        {
          id: 'opt-3',
          category: 'cost' as 'cost' | 'performance' | 'security' | 'reliability',
          service: 'S3 Storage',
          title: 'Enable S3 Intelligent Tiering',
          description: 'Automatically move data to cheaper storage classes',
          impact: {
            costSavings: 8900,
            performanceImprovement: 0,
            riskReduction: 'Low'
          },
          priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
          implementation: {
            effort: 'medium' as 'low' | 'medium' | 'high',
            timeEstimate: '2-3 weeks',
            complexity: 'moderate' as 'simple' | 'moderate' | 'complex',
            prerequisites: ['Data access pattern analysis']
          },
          status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
          targetResource: {
            type: 's3' as 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other',
            name: 'trading-data-bucket',
            region: 'us-east-1'
          },
          automatable: true,
          terraformCode: 'resource "aws_s3_bucket_intelligent_tiering_configuration" "main" {\n  bucket = "trading-data"\n}',
          tags: ['cost', 's3-tiering'],
          createdAt: new Date(),
          estimatedROI: 8.9
        },
        {
          id: 'opt-4',
          category: 'security' as 'cost' | 'performance' | 'security' | 'reliability',
          service: 'EC2 SQL Server',
          title: 'Enable Encryption at Rest',
          description: 'Add EBS encryption for compliance requirements',
          impact: {
            costSavings: 0,
            performanceImprovement: 0,
            riskReduction: 'High'
          },
          priority: 'low' as 'critical' | 'high' | 'medium' | 'low',
          implementation: {
            effort: 'medium' as 'low' | 'medium' | 'high',
            timeEstimate: '1 week',
            complexity: 'simple' as 'simple' | 'moderate' | 'complex',
            prerequisites: ['Backup current data']
          },
          status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
          targetResource: {
            type: 'ec2' as 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other',
            name: 'sql-server-prod',
            region: 'us-east-1'
          },
          automatable: true,
          terraformCode: 'resource "aws_ebs_encryption_by_default" "main" {\n  enabled = true\n}',
          tags: ['security', 'encryption'],
          createdAt: new Date(),
          estimatedROI: 0.5
        },
        {
          id: 'opt-5',
          category: 'cost' as 'cost' | 'performance' | 'security' | 'reliability',
          service: 'Lambda Functions',
          title: 'Optimize Lambda Memory',
          description: 'Right-size memory allocation based on usage patterns',
          impact: {
            costSavings: 24000,
            performanceImprovement: 15,
            riskReduction: 'Low'
          },
          priority: 'high' as 'critical' | 'high' | 'medium' | 'low',
          implementation: {
            effort: 'low' as 'low' | 'medium' | 'high',
            timeEstimate: '3-5 days',
            complexity: 'simple' as 'simple' | 'moderate' | 'complex',
            prerequisites: []
          },
          status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'dismissed',
          targetResource: {
            type: 'lambda' as 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other',
            name: 'data-processing-functions',
            region: 'us-east-1'
          },
          automatable: true,
          terraformCode: 'resource "aws_lambda_function" "optimized" {\n  memory_size = 512\n}',
          tags: ['cost', 'lambda-optimization'],
          createdAt: new Date(),
          estimatedROI: 24.0
        }
      ];

      // Store the data for the interactive components
      setFinopsData({
        costBreakdown: transformedCostBreakdown,
        costTrends: mockCostTrends,
        eksAnalysis: { 
          clusters: [
            {
              id: 'prod-trading',
              name: 'prod-trading',
              region: 'us-east-1',
              nodeGroups: [
                {
                  id: 'trading-workers',
                  name: 'trading-workers',
                  instanceType: 'm5.xlarge',
                  desiredCapacity: 10,
                  minCapacity: 5,
                  maxCapacity: 20,
                  runningCapacity: 12,
                  cost: 8400,
                  utilization: { cpu: 75, memory: 68 },
                  optimizable: true,
                  recommendedInstanceType: 'm5.large',
                  potentialSavings: 2100
                }
              ],
              totalCost: 12000,
              optimizedCost: 9600,
              utilization: { cpu: 75, memory: 68, network: 45 },
              recommendations: [
                {
                  id: 'rec-1',
                  type: 'rightsizing',
                  priority: 'high',
                  title: 'Rightsize trading-workers node group',
                  description: 'CPU utilization is below 80%, consider smaller instances',
                  potentialSavings: 2100,
                  implementation: 'easy',
                  targetNodeGroup: 'trading-workers'
                }
              ],
              status: 'warning'
            },
            {
              id: 'prod-risk',
              name: 'prod-risk',
              region: 'us-west-2',
              nodeGroups: [
                {
                  id: 'risk-compute',
                  name: 'risk-compute',
                  instanceType: 'c5.2xlarge',
                  desiredCapacity: 6,
                  minCapacity: 3,
                  maxCapacity: 12,
                  runningCapacity: 8,
                  cost: 9600,
                  utilization: { cpu: 85, memory: 72 },
                  optimizable: false,
                  recommendedInstanceType: 'c5.2xlarge',
                  potentialSavings: 0
                }
              ],
              totalCost: 15000,
              optimizedCost: 15000,
              utilization: { cpu: 85, memory: 72, network: 62 },
              recommendations: [],
              status: 'healthy'
            },
            {
              id: 'staging-apps',
              name: 'staging-apps',
              region: 'us-east-1',
              nodeGroups: [
                {
                  id: 'app-workers',
                  name: 'app-workers',
                  instanceType: 't3.medium',
                  desiredCapacity: 4,
                  minCapacity: 2,
                  maxCapacity: 8,
                  runningCapacity: 3,
                  cost: 2400,
                  utilization: { cpu: 45, memory: 38 },
                  optimizable: true,
                  recommendedInstanceType: 't3.small',
                  potentialSavings: 1200
                }
              ],
              totalCost: 3500,
              optimizedCost: 2300,
              utilization: { cpu: 45, memory: 38, network: 25 },
              recommendations: [
                {
                  id: 'rec-2',
                  type: 'rightsizing',
                  priority: 'medium',
                  title: 'Downsize staging app workers',
                  description: 'Very low utilization, consider smaller instances',
                  potentialSavings: 1200,
                  implementation: 'easy',
                  targetNodeGroup: 'app-workers'
                }
              ],
              status: 'warning'
            }
          ]
        },
        optimizations: transformedOptimizations,
        potentialSavings: costData.summary ? `$${((costData.summary.total_cost * 0.2) / 1000).toFixed(0)}K` : '$7K',
        costAnalysis: costData.summary ? {
          current: `$${(costData.summary.total_cost / 1000).toFixed(0)}K`,
          optimized: `$${((costData.summary.total_cost * 0.8) / 1000).toFixed(0)}K`,
          savings: `$${((costData.summary.total_cost * 0.2) / 1000).toFixed(0)}K`,
          savingsPercent: '20%'
        } : {
          current: '$37K',
          optimized: '$30K',
          savings: '$7K',
          savingsPercent: '20%'
        },
        resourceUtilization: costData.breakdown?.by_category || { compute: 29835, storage: 4739, network: 2798 },
        terraformRecommendations: transformedOptimizations
      });
      
      setLoading(false);
    } catch (error) {
      console.error('FinOps API Error:', error);
      addNotification('error', 'Failed to load FinOps data');
      setLoading(false);
    }
  };

  const renderUtilizationBar = (percentage: number) => {
    const totalBars = 5;
    const filledBars = Math.round((percentage / 100) * totalBars);
    return '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars) + ` ${percentage}%`;
  };

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Text ta="center" mt="xl" size="lg" c="dimmed">
          Loading FinOps analysis...
        </Text>
      </Box>
    );
  }

  if (!finopsData) {
    return (
      <Card withBorder shadow="sm" radius="md" p="xl" ta="center">
        <Text size="lg" c="red">Failed to load FinOps data</Text>
      </Card>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header with Potential Savings */}
      <Group justify="space-between">
        <Stack gap={4}>
          <Title order={1} c="cg-navy.6">
            FinOps Analyzer with IaC Integration
          </Title>
          <Text size="lg" c="dimmed">
            Infrastructure cost optimization and Terraform automation
          </Text>
        </Stack>
        
        <Paper p="lg" radius="md" bg="green.0" withBorder style={{ borderColor: 'var(--mantine-color-green-3)' }}>
          <Group gap="sm">
            <IconTarget size={24} color="var(--mantine-color-green-6)" />
            <Stack gap={2}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Potential Savings
              </Text>
              <Text size="xl" fw={700} c="green.8">
                {finopsData.potentialSavings}
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Group>

      {/* Interactive Cost Breakdown */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h={800}>
            <Stack gap="lg">
              <Group justify="space-between">
                <Title order={3} c="cg-navy.6">Cost Breakdown Analysis</Title>
                <Group gap="sm">
                  <Select
                    data={[
                      { value: '7d', label: 'Last 7 days' },
                      { value: '30d', label: 'Last 30 days' },
                      { value: '90d', label: 'Last 90 days' }
                    ]}
                    value={selectedTimeRange}
                    onChange={(value) => setSelectedTimeRange(value as '7d' | '30d' | '90d')}
                    size="sm"
                  />
                  <ActionIcon variant="subtle" color="gray" onClick={loadFinOpsData}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              
              {finopsData.costBreakdown && (
                <CostBreakdownTreemap
                  data={finopsData.costBreakdown}
                  onItemSelect={setSelectedCostItem}
                  selectedTimeRange={selectedTimeRange}
                />
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder shadow="sm" radius="md" p="lg" h={800}>
            <Stack gap="lg">
              <Title order={3} c="cg-navy.6">Cost Trends</Title>
              
              {finopsData.costTrends && (
                <CostTrendChart
                  key={selectedTimeRange}
                  data={finopsData.costTrends}
                  selectedServices={['compute', 'database', 'storage', 'network']}
                  onServiceToggle={(service) => console.log('Service toggled:', service)}
                  showForecast={true}
                  showOptimization={true}
                />
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* EKS Cost Analysis */}
      <Card withBorder shadow="sm" radius="md" p="lg">
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={3} c="cg-navy.6">
              EKS Cost Analysis & Optimization
            </Title>
            <Group gap="sm">
              <Button variant="outline" color="cg-navy" leftSection={<IconDownload size={16} />}>
                Export Report
              </Button>
              <ActionIcon variant="subtle" color="gray">
                <IconInfoCircle size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {finopsData.eksAnalysis && (
            <EKSCostAnalysis
              clusters={finopsData.eksAnalysis.clusters || []}
              selectedCluster={selectedCluster?.id || null}
              onClusterSelect={(clusterId) => {
                const cluster = finopsData.eksAnalysis.clusters.find(c => c.id === clusterId);
                setSelectedCluster(cluster);
              }}
              onRecommendationApply={(recommendation) => {
                addNotification('success', 'Optimization Applied', `Applied: ${recommendation.title}`);
              }}
            />
          )}
        </Stack>
      </Card>

      {/* Optimization Recommendations */}
      {finopsData.optimizations && (
        <Card withBorder shadow="sm" radius="md" p="lg">
          <OptimizationRecommendations
            recommendations={finopsData.optimizations}
            onRecommendationAction={(id, action) => {
              const rec = finopsData.optimizations.find(r => r.id === id);
              if (action === 'apply') {
                addNotification('success', 'Implementation Started', `Implementing: ${rec?.title}`);
              } else if (action === 'dismiss') {
                addNotification('info', 'Recommendation Dismissed', `Dismissed: ${rec?.title}`);
              } else if (action === 'view_terraform') {
                addNotification('info', 'Terraform Code', `Viewing Terraform for: ${rec?.title}`);
              }
            }}
            selectedCategories={selectedCategories}
            onCategoryToggle={(category) => {
              setSelectedCategories(prev => 
                prev.includes(category) 
                  ? prev.filter(c => c !== category)
                  : [...prev, category]
              );
            }}
            sortBy={sortBy}
            onSortChange={(newSortBy) => setSortBy(newSortBy as 'priority' | 'savings' | 'roi' | 'effort')}
          />
        </Card>
      )}

      {/* Action Buttons */}
      <Group justify="center" gap="md">
        <Button
          size="lg"
          color="cg-navy"
          leftSection={<IconDownload size={18} />}
          onClick={() => addNotification('success', 'Terraform PR', 'Generating Terraform pull request...')}
        >
          Generate Terraform PR
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          color="cg-navy"
          leftSection={<IconInfoCircle size={18} />}
          onClick={() => addNotification('info', 'Review', 'Opening change review interface...')}
        >
          Review Changes
        </Button>
        
        <Button
          size="lg"
          variant="light"
          color="blue"
          leftSection={<IconTarget size={18} />}
          onClick={() => addNotification('info', 'Dev Deployment', 'Applying changes to dev environment first...')}
        >
          Apply to Dev First
        </Button>
      </Group>
    </Stack>
  );
};

export default FinOps;