import React, { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Progress,
  Title,
  Alert,
  Timeline,
  Paper,
  ActionIcon,
  NumberFormatter,
  Table,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconCoin,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconCloud,
} from '@tabler/icons-react';
import { DemoScenario, ScenarioStep, demoScenarioService } from '../../services/DemoScenarioService';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface CostSpiralScenarioProps {
  onValueUpdate?: (value: number) => void;
  autoStart?: boolean;
  presentationMode?: boolean;
}

interface AWSServiceCost {
  service: string;
  category: string;
  currentCost: number;
  previousCost: number;
  percentChange: number;
  instances: number;
  region: string;
  optimization: string;
}

interface CostMetrics {
  totalMonthlyCost: number;
  costIncrease: number;
  inefficiencyScore: number;
  optimizationPotential: number;
  servicesAnalyzed: number;
  criticalServices: number;
}

const CostSpiralScenario: React.FC<CostSpiralScenarioProps> = ({
  onValueUpdate,
  autoStart = false,
  presentationMode = false
}) => {
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [costMetrics, setCostMetrics] = useState<CostMetrics>({
    totalMonthlyCost: 1247000,
    costIncrease: 42.3,
    inefficiencyScore: 73,
    optimizationPotential: 780000,
    servicesAnalyzed: 47,
    criticalServices: 12
  });
  const [awsServices, setAwsServices] = useState<AWSServiceCost[]>([
    {
      service: 'EC2',
      category: 'Compute',
      currentCost: 423000,
      previousCost: 298000,
      percentChange: 41.9,
      instances: 847,
      region: 'us-east-1',
      optimization: 'Right-size instances, reserved capacity'
    },
    {
      service: 'RDS',
      category: 'Database',
      currentCost: 287000,
      previousCost: 203000,
      percentChange: 41.4,
      instances: 23,
      region: 'us-east-1',
      optimization: 'Multi-AZ optimization, instance downsizing'
    },
    {
      service: 'S3',
      category: 'Storage',
      currentCost: 156000,
      previousCost: 89000,
      percentChange: 75.3,
      instances: 1,
      region: 'Global',
      optimization: 'Lifecycle policies, storage class optimization'
    },
    {
      service: 'Lambda',
      category: 'Compute',
      currentCost: 134000,
      previousCost: 67000,
      percentChange: 100.0,
      instances: 342,
      region: 'us-east-1',
      optimization: 'Memory optimization, cold start reduction'
    },
    {
      service: 'API Gateway',
      category: 'Networking',
      currentCost: 89000,
      previousCost: 52000,
      percentChange: 71.2,
      instances: 15,
      region: 'us-east-1',
      optimization: 'Caching, request optimization'
    },
    {
      service: 'VPC Endpoints',
      category: 'Networking',
      currentCost: 67000,
      previousCost: 31000,
      percentChange: 116.1,
      instances: 28,
      region: 'us-east-1',
      optimization: 'Endpoint consolidation, policy optimization'
    },
    {
      service: 'CloudWatch',
      category: 'Monitoring',
      currentCost: 45000,
      previousCost: 28000,
      percentChange: 60.7,
      instances: 1,
      region: 'Global',
      optimization: 'Log retention, metric filtering'
    },
    {
      service: 'ElastiCache',
      category: 'Database',
      currentCost: 46000,
      previousCost: 34000,
      percentChange: 35.3,
      instances: 8,
      region: 'us-east-1',
      optimization: 'Instance type optimization'
    }
  ]);
  
  const { subscribeToEvent, send, connected } = useWebSocket();

  // Load scenario on mount
  useEffect(() => {
    const loadScenario = async () => {
      const costScenario = await demoScenarioService.getScenario('cost-spiral');
      if (costScenario) {
        setScenario(costScenario);
        if (autoStart) {
          startScenario();
        }
      }
    };

    loadScenario();
  }, [autoStart]);

  // Subscribe to WebSocket scenario updates
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribeToEvent('scenario_update', (data) => {
      if (data.scenarioId === 'cost-spiral') {
        const step = data.step;
        setCurrentStep(data.stepIndex);
        
        // Update cost metrics based on scenario step
        if (step.metrics) {
          setCostMetrics(prev => ({ ...prev, ...step.metrics }));
        }
        
        // Update AWS service costs
        if (step.serviceCosts) {
          setAwsServices(prev => prev.map(service => ({
            ...service,
            ...step.serviceCosts[service.service]
          })));
        }
        
        // Notify parent of value updates
        if (step.impact?.financial && onValueUpdate) {
          onValueUpdate(step.impact.financial);
        }
      }
    });

    return unsubscribe;
  }, [connected, subscribeToEvent, onValueUpdate]);

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  const startScenario = useCallback(async () => {
    if (!scenario) return;
    
    const result = await demoScenarioService.startScenario('cost-spiral');
    if (result.success) {
      setIsRunning(true);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Send WebSocket message to backend to start scenario
      send({ type: 'start_scenario', scenarioId: 'cost-spiral' });
    }
  }, [scenario, send]);

  const pauseScenario = useCallback(async () => {
    const result = await demoScenarioService.pauseScenario('cost-spiral');
    if (result.success) {
      setIsPaused(true);
      send({ type: 'pause_scenario', scenarioId: 'cost-spiral' });
    }
  }, [send]);

  const resumeScenario = useCallback(async () => {
    const result = await demoScenarioService.resumeScenario('cost-spiral');
    if (result.success) {
      setIsPaused(false);
      send({ type: 'resume_scenario', scenarioId: 'cost-spiral' });
    }
  }, [send]);

  const stopScenario = useCallback(async () => {
    const result = await demoScenarioService.stopScenario('cost-spiral');
    if (result.success) {
      setIsRunning(false);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Reset metrics to baseline
      setCostMetrics({
        totalMonthlyCost: 1247000,
        costIncrease: 42.3,
        inefficiencyScore: 73,
        optimizationPotential: 780000,
        servicesAnalyzed: 47,
        criticalServices: 12
      });
      
      send({ type: 'stop_scenario', scenarioId: 'cost-spiral' });
    }
  }, [send]);

  const jumpToStep = useCallback(async (stepIndex: number) => {
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return;
    
    const result = await demoScenarioService.jumpToStep('cost-spiral', stepIndex);
    if (result.success) {
      setCurrentStep(stepIndex);
      const step = scenario.steps[stepIndex];
      
      // Update metrics for this step
      if (step.metrics) {
        setCostMetrics(prev => ({ ...prev, ...step.metrics }));
      }
      
      send({ type: 'jump_to_step', scenarioId: 'cost-spiral', stepIndex });
    }
  }, [scenario, send]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStepSeverityColor = (severity: string): string => {
    const colors = {
      'info': '#4a90e2',
      'warning': '#f39c12',
      'critical': '#e74c3c',
      'resolved': '#27ae60'
    };
    return colors[severity as keyof typeof colors] || '#95a5a6';
  };

  const getCostChangeColor = (change: number): string => {
    if (change > 50) return '#e74c3c';
    if (change > 25) return '#f39c12';
    if (change > 0) return '#ff9800';
    return '#27ae60';
  };

  if (!scenario) {
    return (
      <Stack align="center" justify="center" h={200}>
        <Text size="lg" c="dimmed">Loading Cost Spiral scenario...</Text>
      </Stack>
    );
  }

  const currentStepData = scenario.steps[currentStep];
  const progressPercentage = ((currentStep + 1) / scenario.steps.length) * 100;

  return (
    <Stack gap="lg" p="md">
      {/* Scenario Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={2} c="cg-navy">
              <IconCloud size={32} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              AWS Cost Spiral Crisis
            </Title>
            <Text size="sm" c="dimmed">
              Live demonstration: 42% cost increase investigation → Optimization strategy → $780K monthly savings
            </Text>
          </Stack>
          
          <Group gap="xs">
            {!isRunning ? (
              <Button 
                onClick={startScenario} 
                leftSection={<IconPlayerPlay size={14} />}
                variant="filled"
                color="cg-navy"
              >
                Start Demo
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button 
                    onClick={resumeScenario} 
                    leftSection={<IconPlayerPlay size={14} />}
                    variant="outline"
                    color="green"
                  >
                    Resume
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseScenario} 
                    leftSection={<IconPlayerPause size={14} />}
                    variant="outline"
                    color="orange"
                  >
                    Pause
                  </Button>
                )}
                <Button 
                  onClick={stopScenario} 
                  leftSection={<IconPlayerStop size={14} />}
                  variant="outline"
                  color="red"
                >
                  Reset
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Card>

      {/* Progress Bar */}
      <Card padding="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Step {currentStep + 1} of {scenario.steps.length}</Text>
            <Group gap="md">
              <Text size="sm" c="dimmed">
                <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Elapsed: {formatTime(elapsedTime)}
              </Text>
              <Text size="sm" c="dimmed">Target: {formatTime(scenario.duration)}</Text>
            </Group>
          </Group>
          <Progress 
            value={progressPercentage} 
            color="cg-navy" 
            size="md" 
            radius="md"
            animated={isRunning && !isPaused}
          />
        </Stack>
      </Card>

      {/* Cost Metrics Dashboard */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconCoin size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            AWS Cost Analysis
          </Title>
          
          <Grid cols={4} gutter="md">
            <Grid.Col>
              <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Monthly Spend</Text>
                  <NumberFormatter 
                    value={costMetrics.totalMonthlyCost} 
                    prefix="$" 
                    thousandSeparator="," 
                    suffix="K"
                    decimalScale={0}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#001f3f' }}
                  />
                  <Badge color="red" size="sm">
                    <IconTrendingUp size={12} style={{ marginRight: 4 }} />
                    +{costMetrics.costIncrease}% vs last month
                  </Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Optimization Potential</Text>
                  <NumberFormatter 
                    value={costMetrics.optimizationPotential} 
                    prefix="$" 
                    thousandSeparator="," 
                    suffix="K"
                    decimalScale={0}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}
                  />
                  <Text size="xs" c="dimmed">/month</Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Inefficiency Score</Text>
                  <Text size="xl" fw="bold" c="orange" ta="center">
                    {costMetrics.inefficiencyScore}/100
                  </Text>
                  <Text size="xs" c="dimmed">Services analyzed: {costMetrics.servicesAnalyzed}</Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Critical Services</Text>
                  <Text size="xl" fw="bold" c="red" ta="center">
                    {costMetrics.criticalServices}
                  </Text>
                  <Text size="xs" c="dimmed">Require immediate action</Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* AWS Services Breakdown */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconCloud size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            AWS Service Cost Breakdown
          </Title>
          
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Service</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Current Cost</Table.Th>
                <Table.Th>Change</Table.Th>
                <Table.Th>Instances</Table.Th>
                <Table.Th>Region</Table.Th>
                <Table.Th>Optimization</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {awsServices.map((service) => (
                <Table.Tr key={service.service}>
                  <Table.Td>
                    <Text fw={500}>{service.service}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue" size="sm">
                      {service.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter
                      value={service.currentCost}
                      prefix="$"
                      thousandSeparator=","
                      decimalScale={0}
                      style={{ fontWeight: 'bold' }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={service.percentChange > 50 ? 'red' : service.percentChange > 25 ? 'orange' : 'blue'}
                      leftSection={
                        service.percentChange > 0 ? 
                          <IconTrendingUp size={12} /> : 
                          <IconTrendingDown size={12} />
                      }
                    >
                      +{service.percentChange}%
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{service.instances}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{service.region}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" maw={200} style={{ lineHeight: 1.3 }}>
                      {service.optimization}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      {/* Current Step Display */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Group gap="md">
              <ActionIcon 
                size="lg" 
                radius="xl" 
                style={{ backgroundColor: getStepSeverityColor(currentStepData.severity) }}
              >
                {currentStepData.severity === 'critical' ? <IconX size={16} color="white" /> : 
                 currentStepData.severity === 'resolved' ? <IconCheck size={16} color="white" /> :
                 <IconAlertTriangle size={16} color="white" />}
              </ActionIcon>
              <Stack gap="xs">
                <Title order={4}>{currentStepData.title}</Title>
                <Text size="sm" c="dimmed">
                  <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {currentStepData.timestamp}
                </Text>
              </Stack>
            </Group>
            <Badge 
              color={
                currentStepData.severity === 'critical' ? 'red' :
                currentStepData.severity === 'warning' ? 'orange' :
                currentStepData.severity === 'resolved' ? 'green' : 'blue'
              }
              size="lg"
            >
              {currentStepData.severity.toUpperCase()}
            </Badge>
          </Group>
          
          <Stack gap="sm">
            <Text>{currentStepData.description}</Text>
            <Text size="sm">
              <Text span fw={500}>Analysis Focus:</Text> {currentStepData.component}
            </Text>
            
            {currentStepData.actions && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Optimization Actions:</Text>
                <Stack gap={4}>
                  {currentStepData.actions.map((action, index) => (
                    <Group key={index} gap="xs">
                      <IconCheck size={14} color="green" />
                      <Text size="sm">{action}</Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            )}
            
            {currentStepData.impact && (
              <Paper p="md" withBorder style={{ backgroundColor: '#f0f8ff' }}>
                <Stack gap="sm">
                  <Title order={5} c="cg-navy">
                    💡 Cost Optimization Impact
                  </Title>
                  <Grid cols={3} gutter="md">
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Monthly Savings</Text>
                        <NumberFormatter
                          value={currentStepData.impact.financial}
                          prefix="$"
                          thousandSeparator=","
                          decimalScale={0}
                          style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}
                        />
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Services Optimized</Text>
                        <Text size="xl" fw="bold" c="blue">{currentStepData.impact.systems}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Annual Value</Text>
                        <NumberFormatter
                          value={currentStepData.impact.financial * 12}
                          prefix="$"
                          thousandSeparator=","
                          decimalScale={0}
                          style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}
                        />
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Stack>
      </Card>
      </div>

      {/* Timeline Visualization */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconTrendingUp size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Cost Optimization Timeline
          </Title>
          
          <Timeline
            active={currentStep}
            bulletSize={24}
            lineWidth={2}
            color="cg-navy"
          >
            {scenario.steps.map((step, index) => (
              <Timeline.Item
                key={step.id}
                bullet={
                  step.severity === 'critical' ? <IconX size={12} /> :
                  step.severity === 'resolved' ? <IconCheck size={12} /> :
                  <IconAlertTriangle size={12} />
                }
                title={
                  <Group justify="space-between" style={{ cursor: isRunning ? 'pointer' : 'default' }}>
                    <Stack gap={2} onClick={() => isRunning && jumpToStep(index)}>
                      <Text fw={500}>{step.title}</Text>
                      <Text size="xs" c="dimmed">{step.timestamp}</Text>
                    </Stack>
                    {step.impact?.financial && index <= currentStep && (
                      <Badge color="green" variant="light">
                        <IconCoin size={12} style={{ marginRight: 4 }} />
                        {formatCurrency(step.impact.financial)}/month
                      </Badge>
                    )}
                  </Group>
                }
                style={{ opacity: index <= currentStep ? 1 : 0.6 }}
              >
                {index <= currentStep && (
                  <Text size="sm" c="dimmed" mt="xs">
                    {step.description}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Stack>
      </Card>

      {/* Footer with Key Metrics */}
      <Grid cols={2} gutter="md">
        <Grid.Col>
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
            <Stack gap="md">
              <Title order={4} c="cg-navy" ta="center">Key Metrics Summary</Title>
              <Grid cols={2} gutter="md">
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Total Savings</Text>
                    <NumberFormatter
                      value={780000}
                      prefix="$"
                      thousandSeparator=","
                      suffix="K"
                      decimalScale={0}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}
                    />
                    <Text size="xs" c="dimmed">/month</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Annual Value</Text>
                    <NumberFormatter
                      value={780000 * 12}
                      prefix="$"
                      thousandSeparator=","
                      suffix="M"
                      decimalScale={1}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}
                    />
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Services Optimized</Text>
                    <Text size="xl" fw="bold" c="blue">47</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">ROI Timeline</Text>
                    <Text size="xl" fw="bold" c="green">3 months</Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Grid.Col>
        
        {!presentationMode && (
          <Grid.Col>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4} c="cg-navy" ta="center">Demo Controls</Title>
                <Group justify="center" gap="xs">
                  {scenario.steps.map((step, index) => (
                    <ActionIcon
                      key={step.id}
                      size="lg"
                      variant={index === currentStep ? 'filled' : index < currentStep ? 'light' : 'outline'}
                      color={index === currentStep ? 'cg-navy' : index < currentStep ? 'green' : 'gray'}
                      onClick={() => jumpToStep(index)}
                      disabled={!isRunning}
                      title={step.title}
                    >
                      {index + 1}
                    </ActionIcon>
                  ))}
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        )}
      </Grid>

      {/* Cost Alert Overlay for Critical Steps */}
      {currentStepData.severity === 'critical' && isRunning && (
        <Alert
          variant="filled"
          color="red"
          radius="md"
          icon={<IconAlertTriangle size={24} />}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            minWidth: 400,
            border: '2px solid #dc3545'
          }}
        >
          <Stack gap="sm">
            <Title order={3} c="white">CRITICAL: Cost Spiral Detected</Title>
            <Text c="white">
              Monthly AWS costs increased by {costMetrics.costIncrease}% - immediate optimization required
            </Text>
            <Group justify="space-between">
              <Text size="sm" c="white">
                <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Investigation Time: {formatTime(elapsedTime)}
              </Text>
              <Text size="sm" c="white" fw={500}>
                Potential Savings: {formatCurrency(costMetrics.optimizationPotential)}/month
              </Text>
            </Group>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default CostSpiralScenario;