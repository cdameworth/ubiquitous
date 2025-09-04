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
  RingProgress,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconShield,
  IconAlertTriangle,
  IconBug,
  IconCheck,
  IconX,
  IconClock,
  IconLock,
  IconEye,
} from '@tabler/icons-react';
import { DemoScenario, ScenarioStep, demoScenarioService } from '../../services/DemoScenarioService';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface SecurityBreachScenarioProps {
  onValueUpdate?: (value: number) => void;
  autoStart?: boolean;
  presentationMode?: boolean;
}

interface Vulnerability {
  id: string;
  cve: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  description: string;
  impact: string;
  status: 'detected' | 'analyzing' | 'patching' | 'resolved';
  exploitability: number;
  businessImpact: number;
}

interface ThreatMetrics {
  totalVulnerabilities: number;
  criticalVulns: number;
  highVulns: number;
  mediumVulns: number;
  lowVulns: number;
  exposedServices: number;
  riskScore: number;
  complianceScore: number;
  meanTimeToDetection: number;
  meanTimeToResponse: number;
}

const SecurityBreachScenario: React.FC<SecurityBreachScenarioProps> = ({
  onValueUpdate,
  autoStart = false,
  presentationMode = false
}) => {
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [threatMetrics, setThreatMetrics] = useState<ThreatMetrics>({
    totalVulnerabilities: 47,
    criticalVulns: 3,
    highVulns: 8,
    mediumVulns: 19,
    lowVulns: 17,
    exposedServices: 12,
    riskScore: 85,
    complianceScore: 62,
    meanTimeToDetection: 72,
    meanTimeToResponse: 18
  });
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([
    {
      id: 'vuln-001',
      cve: 'CVE-2024-8932',
      severity: 'critical',
      service: 'Trading API Gateway',
      description: 'Remote code execution in API authentication module',
      impact: 'Complete system compromise, data exfiltration risk',
      status: 'detected',
      exploitability: 95,
      businessImpact: 2100000
    },
    {
      id: 'vuln-002',
      cve: 'CVE-2024-7845',
      severity: 'high',
      service: 'PostgreSQL RDS',
      description: 'SQL injection vulnerability in user query processing',
      impact: 'Database access, customer data exposure',
      status: 'analyzing',
      exploitability: 78,
      businessImpact: 890000
    },
    {
      id: 'vuln-003',
      cve: 'CVE-2024-6721',
      severity: 'high',
      service: 'Redis Cluster',
      description: 'Authentication bypass in session management',
      impact: 'Unauthorized access to trading sessions',
      status: 'patching',
      exploitability: 82,
      businessImpact: 650000
    },
    {
      id: 'vuln-004',
      cve: 'CVE-2024-5934',
      severity: 'critical',
      service: 'EKS Control Plane',
      description: 'Container escape vulnerability in Kubernetes runtime',
      impact: 'Cluster-wide compromise, lateral movement',
      status: 'analyzing',
      exploitability: 88,
      businessImpact: 1200000
    },
    {
      id: 'vuln-005',
      cve: 'CVE-2024-4123',
      severity: 'medium',
      service: 'S3 Bucket Policy',
      description: 'Misconfigured bucket permissions expose trading data',
      impact: 'Data exposure, compliance violation',
      status: 'resolved',
      exploitability: 45,
      businessImpact: 340000
    },
    {
      id: 'vuln-006',
      cve: 'CVE-2024-3456',
      severity: 'high',
      service: 'Lambda Functions',
      description: 'Dependency confusion attack in serverless runtime',
      impact: 'Code injection, service disruption',
      status: 'patching',
      exploitability: 71,
      businessImpact: 480000
    }
  ]);
  
  const { subscribeToEvent, send, connected } = useWebSocket();

  // Load scenario on mount
  useEffect(() => {
    const loadScenario = async () => {
      const securityScenario = await demoScenarioService.getScenario('security-breach');
      if (securityScenario) {
        setScenario(securityScenario);
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
      if (data.scenarioId === 'security-breach') {
        const step = data.step;
        setCurrentStep(data.stepIndex);
        
        // Update threat metrics based on scenario step
        if (step.metrics) {
          setThreatMetrics(prev => ({ ...prev, ...step.metrics }));
        }
        
        // Update vulnerability statuses
        if (step.vulnerabilityUpdates) {
          setVulnerabilities(prev => prev.map(vuln => ({
            ...vuln,
            ...step.vulnerabilityUpdates[vuln.id]
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
    
    const result = await demoScenarioService.startScenario('security-breach');
    if (result.success) {
      setIsRunning(true);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Send WebSocket message to backend to start scenario
      send({ type: 'start_scenario', scenarioId: 'security-breach' });
    }
  }, [scenario, send]);

  const pauseScenario = useCallback(async () => {
    const result = await demoScenarioService.pauseScenario('security-breach');
    if (result.success) {
      setIsPaused(true);
      send({ type: 'pause_scenario', scenarioId: 'security-breach' });
    }
  }, [send]);

  const resumeScenario = useCallback(async () => {
    const result = await demoScenarioService.resumeScenario('security-breach');
    if (result.success) {
      setIsPaused(false);
      send({ type: 'resume_scenario', scenarioId: 'security-breach' });
    }
  }, [send]);

  const stopScenario = useCallback(async () => {
    const result = await demoScenarioService.stopScenario('security-breach');
    if (result.success) {
      setIsRunning(false);
      setIsPaused(false);
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Reset metrics to baseline
      setThreatMetrics({
        totalVulnerabilities: 47,
        criticalVulns: 3,
        highVulns: 8,
        mediumVulns: 19,
        lowVulns: 17,
        exposedServices: 12,
        riskScore: 85,
        complianceScore: 62,
        meanTimeToDetection: 72,
        meanTimeToResponse: 18
      });
      
      send({ type: 'stop_scenario', scenarioId: 'security-breach' });
    }
  }, [send]);

  const jumpToStep = useCallback(async (stepIndex: number) => {
    if (!scenario || stepIndex < 0 || stepIndex >= scenario.steps.length) return;
    
    const result = await demoScenarioService.jumpToStep('security-breach', stepIndex);
    if (result.success) {
      setCurrentStep(stepIndex);
      const step = scenario.steps[stepIndex];
      
      // Update metrics for this step
      if (step.metrics) {
        setThreatMetrics(prev => ({ ...prev, ...step.metrics }));
      }
      
      send({ type: 'jump_to_step', scenarioId: 'security-breach', stepIndex });
    }
  }, [scenario, send]);

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

  const getSeverityColor = (severity: string): string => {
    const colors = {
      'low': '#4CAF50',
      'medium': '#ff9800',
      'high': '#f44336',
      'critical': '#e74c3c'
    };
    return colors[severity as keyof typeof colors] || '#95a5a6';
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      'detected': '#e74c3c',
      'analyzing': '#ff9800',
      'patching': '#2196F3',
      'resolved': '#4CAF50'
    };
    return colors[status as keyof typeof colors] || '#95a5a6';
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (!scenario) {
    return (
      <Stack align="center" justify="center" h={200}>
        <Text size="lg" c="dimmed">Loading Security Breach scenario...</Text>
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
              <IconShield size={32} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Security Breach Response
            </Title>
            <Text size="sm" c="dimmed">
              Live demonstration: Critical vulnerability detection → Threat containment → $6.08M breach cost avoided
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

      {/* Threat Metrics Dashboard */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconEye size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Threat Intelligence Dashboard
          </Title>
          
          <Grid cols={4} gutter="md">
            <Grid.Col>
              <Paper p="md" withBorder style={{ backgroundColor: '#fff5f5' }}>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Risk Score</Text>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ value: threatMetrics.riskScore, color: 'red' }]}
                    label={
                      <Text ta="center" fw="bold" size="lg" c="red">
                        {threatMetrics.riskScore}
                      </Text>
                    }
                  />
                  <Badge color="red" size="sm">Critical Risk</Badge>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Active Vulnerabilities</Text>
                  <Text size="xl" fw="bold" c="red" ta="center">
                    {threatMetrics.totalVulnerabilities}
                  </Text>
                  <Text size="xs" c="dimmed" ta="center">
                    {threatMetrics.criticalVulns} critical, {threatMetrics.highVulns} high
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Exposed Services</Text>
                  <Text size="xl" fw="bold" c="orange" ta="center">
                    {threatMetrics.exposedServices}
                  </Text>
                  <Text size="xs" c="dimmed" ta="center">Require immediate patching</Text>
                </Stack>
              </Paper>
            </Grid.Col>
            
            <Grid.Col>
              <Paper p="md" withBorder>
                <Stack gap="xs" align="center">
                  <Text size="xs" c="dimmed" ta="center">Compliance Score</Text>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ value: threatMetrics.complianceScore, color: 'orange' }]}
                    label={
                      <Text ta="center" fw="bold" size="lg" c="orange">
                        {threatMetrics.complianceScore}%
                      </Text>
                    }
                  />
                  <Text size="xs" c="dimmed" ta="center">SOC 2, ISO 27001 gap</Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
          
          <Grid cols={2} gutter="md">
            <Grid.Col>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Mean Time to Detection:</Text>
                <Badge color="orange" variant="light">
                  <IconClock size={12} style={{ marginRight: 4 }} />
                  {threatMetrics.meanTimeToDetection}h
                </Badge>
              </Group>
            </Grid.Col>
            <Grid.Col>
              <Group justify="space-between">
                <Text size="sm" fw={500}>Mean Time to Response:</Text>
                <Badge color="blue" variant="light">
                  <IconClock size={12} style={{ marginRight: 4 }} />
                  {threatMetrics.meanTimeToResponse}h
                </Badge>
              </Group>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Vulnerability List */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3} c="cg-navy">
            <IconBug size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Active Vulnerabilities
          </Title>
          
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>CVE</Table.Th>
                <Table.Th>Severity</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Exploitability</Table.Th>
                <Table.Th>Business Impact</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vulnerabilities.slice(0, 6).map((vuln) => (
                <Table.Tr key={vuln.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{vuln.cve}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={
                        vuln.severity === 'critical' ? 'red' :
                        vuln.severity === 'high' ? 'orange' :
                        vuln.severity === 'medium' ? 'yellow' : 'green'
                      }
                      variant="filled"
                    >
                      {vuln.severity.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{vuln.service}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={
                        vuln.status === 'detected' ? 'red' :
                        vuln.status === 'analyzing' ? 'orange' :
                        vuln.status === 'patching' ? 'blue' : 'green'
                      }
                      variant="light"
                    >
                      {vuln.status.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Progress 
                      value={vuln.exploitability} 
                      color={
                        vuln.exploitability > 80 ? 'red' :
                        vuln.exploitability > 60 ? 'orange' : 'green'
                      }
                      size="sm"
                      label={`${vuln.exploitability}%`}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberFormatter
                      value={vuln.businessImpact}
                      prefix="$"
                      thousandSeparator=","
                      decimalScale={0}
                      style={{ fontWeight: 'bold', color: '#e74c3c' }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          
          <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Vulnerability Details</Text>
              <Text size="xs">
                {vulnerabilities[0]?.description} - {vulnerabilities[0]?.impact}
              </Text>
            </Stack>
          </Alert>
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
              <Text span fw={500}>Security Focus:</Text> {currentStepData.component}
            </Text>
            
            {currentStepData.actions && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Response Actions:</Text>
                <Stack gap={4}>
                  {currentStepData.actions.map((action, index) => (
                    <Group key={index} gap="xs">
                      <IconLock size={14} color="blue" />
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
                    <IconShield size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Security Value
                  </Title>
                  <Grid cols={3} gutter="md">
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Breach Cost Avoided</Text>
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
                        <Text size="xs" c="dimmed">Systems Protected</Text>
                        <Text size="xl" fw="bold" c="blue">{currentStepData.impact.systems}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col>
                      <Stack gap="xs" align="center">
                        <Text size="xs" c="dimmed">Compliance Restored</Text>
                        <Text size="sm" fw="bold" c="green">SOC 2, ISO 27001</Text>
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
            <IconLock size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Security Response Timeline
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
                        <IconShield size={12} style={{ marginRight: 4 }} />
                        {formatCurrency(step.impact.financial)} protected
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
              <Title order={4} c="cg-navy" ta="center">Security Metrics Summary</Title>
              <Grid cols={2} gutter="md">
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Breach Cost Avoided</Text>
                    <NumberFormatter
                      value={6080000}
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
                    <Text size="xs" c="dimmed">Response Time</Text>
                    <Text size="xl" fw="bold" c="blue">18 hours</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Vulnerabilities Fixed</Text>
                    <Text size="xl" fw="bold" c="green">47</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col>
                  <Stack gap="xs" align="center">
                    <Text size="xs" c="dimmed">Compliance Restored</Text>
                    <Text size="xl" fw="bold" c="green">98%</Text>
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

      {/* Security Alert Overlay for Critical Steps */}
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
            <Title order={3} c="white">SECURITY BREACH: Immediate Response Required</Title>
            <Text c="white">
              Critical vulnerabilities detected - potential data breach in progress
            </Text>
            <Group justify="space-between">
              <Text size="sm" c="white">
                <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Response Time: {formatTime(elapsedTime)}
              </Text>
              <Group gap="md">
                <Text size="sm" c="white" fw={500}>
                  Risk Score: {threatMetrics.riskScore}/100
                </Text>
                <Text size="sm" c="white" fw={500}>
                  Critical Vulns: {threatMetrics.criticalVulns}
                </Text>
              </Group>
            </Group>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default SecurityBreachScenario;