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
  RingProgress,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconChartLine,
  IconTrendingUp,
  IconTarget,
  IconCoin,
  IconClock,
  IconCheck,
  IconRocket,
} from '@tabler/icons-react';
import { DemoScenario, ScenarioStep, demoScenarioService } from '../../services/DemoScenarioService';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface ExecutiveValueScenarioProps {
  onValueUpdate?: (value: number) => void;
  autoStart?: boolean;
  presentationMode?: boolean;
}

interface BusinessMetrics {
  totalAnnualValue: number;
  monthlySavings: number;
  riskReduction: number;
  efficiencyGain: number;
  complianceImprovement: number;
  timeToValue: number;
  roiPercentage: number;
  paybackPeriod: number;
}

interface ValueStream {
  category: string;
  description: string;
  currentValue: number;
  targetValue: number;
  timeframe: string;
  confidence: number;
  initiatives: string[];
  kpis: string[];
}

const ExecutiveValueScenario: React.FC<ExecutiveValueScenarioProps> = ({
  onValueUpdate,
  autoStart = false,
  presentationMode = false
}) => {
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalAnnualValue: 41600000,
    monthlySavings: 3467000,
    riskReduction: 73,
    efficiencyGain: 42,
    complianceImprovement: 89,
    timeToValue: 8,
    roiPercentage: 340,
    paybackPeriod: 18
  });
  const [valueStreams, setValueStreams] = useState<ValueStream[]>([
    {
      category: 'Cost Optimization',
      description: 'Infrastructure efficiency and AWS cost reduction',
      currentValue: 12600000,
      targetValue: 24300000,
      timeframe: '12 months',
      confidence: 92,
      initiatives: ['EKS rightsizing', 'RDS optimization', 'S3 lifecycle policies'],
      kpis: ['Monthly AWS spend', 'Resource utilization', 'Waste reduction %']
    },
    {
      category: 'Risk Mitigation',
      description: 'Security and compliance risk reduction',
      currentValue: 8900000,
      targetValue: 15200000,
      timeframe: '18 months',
      confidence: 87,
      initiatives: ['Vulnerability management', 'Compliance automation', 'Incident response'],
      kpis: ['MTTR', 'Compliance score', 'Security incidents']
    },
    {
      category: 'Operational Efficiency',
      description: 'Engineering productivity and automation gains',
      currentValue: 3400000,
      targetValue: 8100000,
      timeframe: '24 months',
      confidence: 78,
      initiatives: ['Infrastructure automation', 'Observability enhancement', 'DevOps optimization'],
      kpis: ['Deployment frequency', 'Lead time', 'Change failure rate']
    },
    {
      category: 'Innovation Acceleration',
      description: 'Platform capabilities enabling new revenue streams',
      currentValue: 1200000,
      targetValue: 6400000,
      timeframe: '36 months',
      confidence: 65,
      initiatives: ['API platform', 'Data products', 'Cloud-native architecture'],
      kpis: ['Time to market', 'Feature velocity', 'Platform adoption']
    }
  ]);
  
  const { subscribeToEvent, send, connected } = useWebSocket();

  // Load scenario on mount
  useEffect(() => {
    const loadScenario = async () => {
      const valueScenario = await demoScenarioService.getScenario('executive-value');
      if (valueScenario) {
        setScenario(valueScenario);
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
      if (data.scenarioId === 'executive-value') {
        const step = data.step;
        setCurrentStep(data.stepIndex);
        
        // Update business metrics based on scenario step
        if (step.metrics) {
          setBusinessMetrics(prev => ({ ...prev, ...step.metrics }));
        }
        
        // Update value streams
        if (step.valueStreamUpdates) {
          setValueStreams(prev => prev.map(stream => ({
            ...stream,
            ...step.valueStreamUpdates[stream.category]
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
    
    const result = await demoScenarioService.startScenario('executive-value');
    if (result.success) {
      setIsRunning(true);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Send WebSocket message to backend to start scenario
      send({ type: 'start_scenario', scenarioId: 'executive-value' });
    }
  }, [scenario, send]);

  const pauseScenario = useCallback(async () => {
    const result = await demoScenarioService.pauseScenario('executive-value');
    if (result.success) {
      setIsPaused(true);
      send({ type: 'pause_scenario', scenarioId: 'executive-value' });
    }
  }, [send]);

  const resumeScenario = useCallback(async () => {
    const result = await demoScenarioService.resumeScenario('executive-value');
    if (result.success) {
      setIsPaused(false);
      send({ type: 'resume_scenario', scenarioId: 'executive-value' });
    }
  }, [send]);

  const stopScenario = useCallback(async () => {
    const result = await demoScenarioService.stopScenario('executive-value');
    if (result.success) {
      setIsRunning(false);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Reset metrics to baseline
      setBusinessMetrics({
        totalAnnualValue: 41600000,
        monthlySavings: 3467000,
        riskReduction: 73,
        efficiencyGain: 42,
        complianceImprovement: 89,
        timeToValue: 8,
        roiPercentage: 340,
        paybackPeriod: 18
      });
      
      send({ type: 'stop_scenario', scenarioId: 'executive-value' });
    }
  }, [send]);

  const jumpToStep = useCallback(async (stepIndex: number) => {
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return;
    
    const result = await demoScenarioService.jumpToStep('executive-value', stepIndex);
    if (result.success) {
      setCurrentStep(stepIndex);
      const step = scenario.steps[stepIndex];
      
      // Update metrics for this step
      if (step.metrics) {
        setBusinessMetrics(prev => ({ ...prev, ...step.metrics }));
      }
      
      send({ type: 'jump_to_step', scenarioId: 'executive-value', stepIndex });
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 85) return '#4CAF50';
    if (confidence >= 70) return '#ff9800';
    return '#f44336';
  };

  if (!scenario) {
    return (
      <Stack align="center" justify="center" h={200}>
        <Text size="lg" c="dimmed">Loading Executive Value scenario...</Text>
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
              <IconChartLine size={32} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Executive Value Demonstration
            </Title>
            <Text size="sm" c="dimmed">
              Live demonstration: Platform ROI analysis → Business value realization → $41.6M annual value
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

      {/* Business Metrics Dashboard */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconTarget size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Executive Business Metrics
          </Title>
          <Grid cols={4} gutter="md">
            <Grid.Col>
              <Paper p="md" withBorder style={{ backgroundColor: '#f0f8ff' }}>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Total Annual Value</Text>
                  <NumberFormatter
                    value={businessMetrics.totalAnnualValue}
                    prefix="$"
                    thousandSeparator=","
                    suffix="M"
                    decimalScale={1}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#001f3f' }}
                  />
                  <Badge color="green" size="sm">
                    ROI: {businessMetrics.roiPercentage}%
                  </Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Monthly Savings</Text>
                  <NumberFormatter
                    value={businessMetrics.monthlySavings}
                    prefix="$"
                    thousandSeparator=","
                    suffix="M"
                    decimalScale={1}
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}
                  />
                  <Text size="xs" c="dimmed">Payback: {businessMetrics.paybackPeriod} months</Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Risk Reduction</Text>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ value: businessMetrics.riskReduction, color: 'green' }]}
                    label={
                      <Text ta="center" fw="bold" size="lg" c="green">
                        {businessMetrics.riskReduction}%
                      </Text>
                    }
                  />
                  <Text size="xs" c="dimmed" ta="center">Compliance improved</Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Efficiency Gain</Text>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ value: businessMetrics.efficiencyGain, color: 'blue' }]}
                    label={
                      <Text ta="center" fw="bold" size="lg" c="blue">
                        {businessMetrics.efficiencyGain}%
                      </Text>
                    }
                  />
                  <Text size="xs" c="dimmed" ta="center">Operational improvement</Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
          
          <Grid cols={2} gutter="md">
            <Grid.Col>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Time to Value:</Text>
                <Badge color="blue" variant="light">
                  <IconClock size={12} style={{ marginRight: 4 }} />
                  {businessMetrics.timeToValue} months
                </Badge>
              </Group>
            </Grid.Col>
            <Grid.Col>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Compliance Score:</Text>
                <Badge color="green" variant="light">
                  <IconCheck size={12} style={{ marginRight: 4 }} />
                  {businessMetrics.complianceImprovement}%
                </Badge>
              </Group>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Value Streams */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconRocket size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Value Stream Analysis
          </Title>
          
          <Stack gap="lg">
            {valueStreams.map((stream) => (
              <Paper key={stream.category} p="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                      <Title order={5} c="cg-navy">{stream.category}</Title>
                      <Text size="sm" c="dimmed">{stream.description}</Text>
                    </Stack>
                    <Badge 
                      color={getConfidenceColor(stream.confidence) === '#4CAF50' ? 'green' : 
                             getConfidenceColor(stream.confidence) === '#ff9800' ? 'orange' : 'red'}
                      size="lg"
                    >
                      {stream.confidence}% confidence
                    </Badge>
                  </Group>
                  
                  <Grid cols={3} gutter="md">
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Current Value</Text>
                        <NumberFormatter
                          value={stream.currentValue}
                          prefix="$"
                          thousandSeparator=","
                          suffix="M"
                          decimalScale={1}
                          style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#001f3f' }}
                        />
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <IconTrendingUp size={24} color="#28a745" />
                        <Text size="xs" c="dimmed">Timeframe: {stream.timeframe}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Target Value</Text>
                        <NumberFormatter
                          value={stream.targetValue}
                          prefix="$"
                          thousandSeparator=","
                          suffix="M"
                          decimalScale={1}
                          style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28a745' }}
                        />
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  
                  <Progress 
                    value={(stream.currentValue / stream.targetValue) * 100}
                    color={
                      getConfidenceColor(stream.confidence) === '#4CAF50' ? 'green' : 
                      getConfidenceColor(stream.confidence) === '#ff9800' ? 'orange' : 'red'
                    }
                    size="md"
                    radius="md"
                  />
                  
                  <Grid cols={2} gutter="md">
                    <Grid.Col>
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>Key Initiatives:</Text>
                        <Stack gap={4}>
                          {stream.initiatives.map((initiative, idx) => (
                            <Group key={idx} gap="xs">
                              <IconCheck size={12} color="green" />
                              <Text size="sm">{initiative}</Text>
                            </Group>
                          ))}
                        </Stack>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>Success KPIs:</Text>
                        <Group gap="xs">
                          {stream.kpis.map((kpi, idx) => (
                            <Badge key={idx} variant="light" color="blue" size="sm">
                              {kpi}
                            </Badge>
                          ))}
                        </Group>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>
            ))}
          </Stack>
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
                {currentStepData.severity === 'critical' ? <IconRocket size={16} color="white" /> : 
                 currentStepData.severity === 'resolved' ? <IconCheck size={16} color="white" /> :
                 <IconTarget size={16} color="white" />}
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
                currentStepData.severity === 'critical' ? 'blue' :
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
              <Text span fw={500}>Value Focus:</Text> {currentStepData.component}
            </Text>
            
            {currentStepData.actions && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Strategic Actions:</Text>
                <Stack gap={4}>
                  {currentStepData.actions.map((action, index) => (
                    <Group key={index} gap="xs">
                      <IconRocket size={14} color="blue" />
                      <Text size="sm">{action}</Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            )}
            
            {currentStepData.impact && (
              <Paper p="md" withBorder style={{ backgroundColor: '#f0fff0' }}>
                <Stack gap="sm">
                  <Title order={5} c="cg-navy">
                    <IconCoin size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Business Value
                  </Title>
                  <Grid cols={3} gutter="md">
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Annual Value</Text>
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
                        <Text size="xs" c="dimmed">Value Streams</Text>
                        <Text size="xl" fw="bold" c="blue">{currentStepData.impact.systems}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">3-Year Value</Text>
                        <NumberFormatter
                          value={currentStepData.impact.financial * 3}
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

      {/* Timeline Visualization */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconTarget size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Value Realization Timeline
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
                  step.severity === 'critical' ? <IconRocket size={12} /> :
                  step.severity === 'resolved' ? <IconCheck size={12} /> :
                  <IconTarget size={12} />
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
                        {formatCurrency(step.impact.financial)} annual
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
              <Title order={4} c="cg-navy" ta="center">Executive Summary</Title>
              <Grid cols={2} gutter="md">
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Total Value</Text>
                    <NumberFormatter
                      value={41600000}
                      prefix="$"
                      thousandSeparator=","
                      suffix="M"
                      decimalScale={1}
                      style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}
                    />
                    <Text size="xs" c="dimmed">/year</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">ROI</Text>
                    <Text size="xl" fw="bold" c="green">340%</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Payback Period</Text>
                    <Text size="xl" fw="bold" c="blue">18 months</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Value Streams</Text>
                    <Text size="xl" fw="bold" c="cg-navy">4 active</Text>
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

      {/* Value Alert Overlay for Critical Steps */}
      {currentStepData.severity === 'critical' && isRunning && (
        <Alert
          variant="filled"
          color="blue"
          radius="md"
          icon={<IconRocket size={24} />}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            minWidth: 400,
            border: '2px solid #007bff'
          }}
        >
          <Stack gap="sm">
            <Title order={3} c="white">STRATEGIC INSIGHT: Platform Value Unlocked</Title>
            <Text c="white">
              Critical business value realization milestone achieved
            </Text>
            <Group justify="space-between">
              <Text size="sm" c="white">
                <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Analysis Time: {formatTime(elapsedTime)}
              </Text>
              <Group gap="md">
                <Text size="sm" c="white" fw={500}>
                  Annual Value: {formatCurrency(businessMetrics.totalAnnualValue)}
                </Text>
                <Text size="sm" c="white" fw={500}>
                  ROI: {businessMetrics.roiPercentage}%
                </Text>
              </Group>
            </Group>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default ExecutiveValueScenario;