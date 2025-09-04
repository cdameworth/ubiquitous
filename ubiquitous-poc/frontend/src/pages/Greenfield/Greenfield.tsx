import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Group, Stack, Tabs, Text, Title, LoadingOverlay, Box, Grid, Badge, Progress, Button, ActionIcon, Select, Table, Alert, Radio } from '@mantine/core';
import { IconRefresh, IconShield, IconClock, IconAlertTriangle, IconCheck, IconX, IconCode, IconServer, IconDatabase, IconCloud, IconTrendingUp, IconBulb } from '@tabler/icons-react';
import api from '../../services/api';

interface GreenfieldData {
  architectureRecommendations: any;
  technologyComparison: any;
  bestPractices: any;
}

interface TechOption {
  name: string;
  type?: string;
  language?: string;
  pros: string[];
  cons: string[];
  use_cases: string[];
  cost_rating: number;
  performance_rating: number;
  learning_curve: number;
  scalability_rating: number;
  overall_score: number;
  recommended_for_use_case?: boolean;
}

const Greenfield: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [greenfieldData, setGreenfieldData] = useState<GreenfieldData | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'comparison' | 'practices'>('architecture');
  const [appType, setAppType] = useState('web');
  const [scale, setScale] = useState('medium');
  const [comparisonCategory, setComparisonCategory] = useState('database');
  const [practicesDomain, setPracticesDomain] = useState('security');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadGreenfieldData();
  }, [appType, scale, comparisonCategory, practicesDomain]);

  const loadGreenfieldData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints
      const [architectureResponse, comparisonResponse, practicesResponse] = await Promise.all([
        api.get(`/api/greenfield/architecture-recommendations?app_type=${appType}&scale=${scale}&requirements=real-time,secure`),
        api.get(`/api/greenfield/technology-comparison?category=${comparisonCategory}&use_case=${appType}`),
        api.get(`/api/greenfield/best-practices?domain=${practicesDomain}&app_type=${appType}`)
      ]);
      
      setGreenfieldData({
        architectureRecommendations: architectureResponse.data || architectureResponse,
        technologyComparison: comparisonResponse.data || comparisonResponse,
        bestPractices: practicesResponse.data || practicesResponse
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Greenfield API Error:', error);
      addNotification('error', 'Failed to load greenfield data', 'Check API connectivity');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box pos="relative" h="100vh">
        <LoadingOverlay
          visible={loading}
          overlayProps={{ backgroundOpacity: 0.7 }}
          loaderProps={{ color: 'cg-navy', size: 'xl' }}
        />
        <Stack align="center" justify="center" h="100%">
          <Text size="lg" c="dimmed">Loading greenfield planning data...</Text>
        </Stack>
      </Box>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'green';
    if (rating >= 3) return 'yellow';
    if (rating >= 2) return 'orange';
    return 'red';
  };

  return (
    <Box>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">New Application Planning Wizard</Title>
          <Text c="dimmed">
            Architecture recommendations, technology analysis, and best practices
          </Text>
        </Stack>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="cg-navy"
          onClick={loadGreenfieldData}
        >
          Refresh Analysis
        </Button>
      </Group>

      {/* Configuration Controls */}
      <Card withBorder padding="md" radius="md" mb="xl">
        <Grid>
          <Grid.Col span={4}>
            <Select
              label="Application Type"
              value={appType}
              onChange={(value) => setAppType(value || 'web')}
              data={[
                { value: 'web', label: 'Web Application' },
                { value: 'api', label: 'API Service' },
                { value: 'mobile', label: 'Mobile Application' },
                { value: 'data_processing', label: 'Data Processing' },
                { value: 'ml', label: 'Machine Learning' }
              ]}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Expected Scale"
              value={scale}
              onChange={(value) => setScale(value || 'medium')}
              data={[
                { value: 'small', label: 'Small Scale' },
                { value: 'medium', label: 'Medium Scale' },
                { value: 'large', label: 'Large Scale' },
                { value: 'enterprise', label: 'Enterprise Scale' }
              ]}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              label="Comparison Category"
              value={comparisonCategory}
              onChange={(value) => setComparisonCategory(value || 'database')}
              data={[
                { value: 'database', label: 'Database Technologies' },
                { value: 'framework', label: 'Backend Frameworks' },
                { value: 'cloud', label: 'Cloud Platforms' },
                { value: 'deployment', label: 'Deployment Options' }
              ]}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="architecture" leftSection={<IconCode size={16} />}>
            Architecture Recommendations
          </Tabs.Tab>
          <Tabs.Tab value="comparison" leftSection={<IconDatabase size={16} />}>
            Technology Comparison
          </Tabs.Tab>
          <Tabs.Tab value="practices" leftSection={<IconShield size={16} />}>
            Best Practices
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="architecture" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Architecture Recommendations</Title>
            
            {greenfieldData?.architectureRecommendations?.recommendations ? (
              <Stack gap="md">
                {/* Overview */}
                <Alert icon={<IconBulb />} color="blue">
                  <Text fw={500}>
                    {greenfieldData.architectureRecommendations.recommendations.architecture_overview.pattern}
                  </Text>
                  <Text size="sm">
                    Scale: {greenfieldData.architectureRecommendations.recommendations.architecture_overview.scale} | 
                    Complexity: {greenfieldData.architectureRecommendations.recommendations.architecture_overview.estimated_complexity}
                  </Text>
                </Alert>

                {/* Technology Stack */}
                <Card withBorder padding="md" radius="sm">
                  <Title order={4} mb="sm">Recommended Technology Stack</Title>
                  <Grid>
                    {Object.entries(greenfieldData.architectureRecommendations.recommendations.technology_stack || {}).map(([key, values]: [string, any]) => (
                      <Grid.Col key={key} span={6}>
                        <Text size="sm" c="dimmed" tt="capitalize">{key.replace('_', ' ')}</Text>
                        <Stack gap="xs" mt="xs">
                          {Array.isArray(values) ? values.map((value, index) => (
                            <Badge key={index} variant="light" color="blue" size="sm">{value}</Badge>
                          )) : (
                            <Badge variant="light" color="blue" size="sm">{values}</Badge>
                          )}
                        </Stack>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Card>

                {/* Infrastructure */}
                <Card withBorder padding="md" radius="sm">
                  <Title order={4} mb="sm">Infrastructure Configuration</Title>
                  <Grid>
                    {Object.entries(greenfieldData.architectureRecommendations.recommendations.infrastructure || {}).map(([key, value]: [string, any]) => (
                      <Grid.Col key={key} span={6}>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed" tt="capitalize">{key.replace('_', ' ')}</Text>
                          <Text size="sm" fw={500}>{value}</Text>
                        </Group>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Card>

                {/* Cost Estimates */}
                <Card withBorder padding="md" radius="sm">
                  <Title order={4} mb="sm">Cost Projections</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">Development Phase</Text>
                      <Text size="lg" fw={700} c="blue">
                        ${(greenfieldData.architectureRecommendations.recommendations.estimated_costs?.development_phase?.estimated_cost || 0).toLocaleString()}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {greenfieldData.architectureRecommendations.recommendations.estimated_costs?.development_phase?.duration_months || 0} months, 
                        {greenfieldData.architectureRecommendations.recommendations.estimated_costs?.development_phase?.team_size || 0} developers
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" c="dimmed">Monthly Operational</Text>
                      <Text size="lg" fw={700} c="green">
                        ${(greenfieldData.architectureRecommendations.recommendations.estimated_costs?.operational_monthly?.total || 0).toLocaleString()}/mo
                      </Text>
                      <Text size="xs" c="dimmed">
                        Infrastructure: ${(greenfieldData.architectureRecommendations.recommendations.estimated_costs?.operational_monthly?.infrastructure || 0).toLocaleString()}/mo
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Security Recommendations */}
                <Card withBorder padding="md" radius="sm">
                  <Title order={4} mb="sm">Security Recommendations</Title>
                  <Stack gap="xs">
                    {greenfieldData.architectureRecommendations.recommendations.security_recommendations?.map((rec: any, index: number) => (
                      <Group key={index} justify="space-between">
                        <Stack gap={0} flex={1}>
                          <Text size="sm" fw={500} tt="capitalize">{rec.category.replace('_', ' ')}</Text>
                          <Text size="xs" c="dimmed">{rec.recommendation}</Text>
                        </Stack>
                        <Badge color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'green'}>
                          {rec.priority}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : (
              <Text c="dimmed">No architecture data available</Text>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="comparison" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Technology Comparison: {comparisonCategory}</Title>
              <Select
                value={practicesDomain}
                onChange={(value) => setPracticesDomain(value || 'security')}
                data={[
                  { value: 'security', label: 'Security Practices' },
                  { value: 'performance', label: 'Performance Practices' },
                  { value: 'scalability', label: 'Scalability Practices' },
                  { value: 'monitoring', label: 'Monitoring Practices' },
                  { value: 'testing', label: 'Testing Practices' }
                ]}
                w={200}
              />
            </Group>
            
            {greenfieldData?.technologyComparison?.comparison?.options ? (
              <Stack gap="md">
                <Alert icon={<IconTrendingUp />} color="blue">
                  <Text fw={500}>Top Recommendation: {greenfieldData.technologyComparison.comparison.top_recommendation}</Text>
                  <Text size="sm">
                    Best for Cost: {greenfieldData.technologyComparison.decision_matrix?.best_for_cost} | 
                    Best Performance: {greenfieldData.technologyComparison.decision_matrix?.best_for_performance}
                  </Text>
                </Alert>

                <Grid>
                  {greenfieldData.technologyComparison.comparison.options.map((option: TechOption) => (
                    <Grid.Col key={option.name} span={4}>
                      <Card withBorder padding="md" radius="sm" h="100%">
                        <Stack gap="sm">
                          <Group justify="space-between">
                            <Text fw={600}>{option.name}</Text>
                            <Badge color={getRatingColor(option.overall_score)}>
                              {option.overall_score.toFixed(1)}/5
                            </Badge>
                          </Group>
                          
                          {option.type && (
                            <Badge variant="light" size="xs">{option.type}</Badge>
                          )}
                          {option.language && (
                            <Badge variant="light" size="xs">{option.language}</Badge>
                          )}

                          <Grid>
                            <Grid.Col span={6}>
                              <Text size="xs" c="dimmed">Cost</Text>
                              <Progress value={option.cost_rating * 20} color={getRatingColor(option.cost_rating)} size="xs" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Text size="xs" c="dimmed">Performance</Text>
                              <Progress value={option.performance_rating * 20} color={getRatingColor(option.performance_rating)} size="xs" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Text size="xs" c="dimmed">Learning</Text>
                              <Progress value={option.learning_curve * 20} color={getRatingColor(option.learning_curve)} size="xs" />
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Text size="xs" c="dimmed">Scale</Text>
                              <Progress value={option.scalability_rating * 20} color={getRatingColor(option.scalability_rating)} size="xs" />
                            </Grid.Col>
                          </Grid>

                          <Stack gap={4}>
                            <Text size="xs" fw={500} c="green">Pros:</Text>
                            {option.pros.slice(0, 2).map((pro, index) => (
                              <Text key={index} size="xs" c="dimmed">• {pro}</Text>
                            ))}
                            <Text size="xs" fw={500} c="red">Cons:</Text>
                            {option.cons.slice(0, 2).map((con, index) => (
                              <Text key={index} size="xs" c="dimmed">• {con}</Text>
                            ))}
                          </Stack>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>
            ) : (
              <Text c="dimmed">No comparison data available</Text>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="practices" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Best Practices: {practicesDomain}</Title>
            
            {greenfieldData?.bestPractices?.best_practices?.practices ? (
              <Stack gap="md">
                {greenfieldData.bestPractices.best_practices.practices.map((category: any, index: number) => (
                  <Card key={index} withBorder padding="md" radius="sm">
                    <Title order={4} mb="sm">{category.category}</Title>
                    <Stack gap="xs">
                      {category.practices.map((practice: string, practiceIndex: number) => (
                        <Group key={practiceIndex} gap="xs">
                          <IconCheck size={14} color="var(--mantine-color-green-6)" />
                          <Text size="sm">{practice}</Text>
                        </Group>
                      ))}
                      {category.implementation_examples && category.implementation_examples.length > 0 && (
                        <Box mt="xs" p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                          <Text size="xs" fw={500} c="dimmed" mb="xs">Implementation Examples:</Text>
                          {category.implementation_examples.map((example: string, exampleIndex: number) => (
                            <Text key={exampleIndex} size="xs" c="dimmed">• {example}</Text>
                          ))}
                        </Box>
                      )}
                    </Stack>
                  </Card>
                ))}

                {/* Implementation Checklist */}
                <Card withBorder padding="md" radius="sm" bg="blue.0">
                  <Title order={4} mb="sm">Implementation Checklist</Title>
                  <Stack gap="xs">
                    {greenfieldData.bestPractices.implementation_checklist?.slice(0, 8).map((item: string, index: number) => (
                      <Group key={index} gap="xs">
                        <Text size="xs" c="dimmed">{index + 1}.</Text>
                        <Text size="sm">{item}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            ) : (
              <Text c="dimmed">No best practices data available</Text>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Action Buttons */}
      <Card withBorder padding="md" radius="md" mt="xl">
        <Group justify="center" gap="md">
          <Button 
            leftSection={<IconServer size={16} />}
            color="cg-navy"
            onClick={() => addNotification('success', 'IaC Template', 'Generating Terraform templates...')}
          >
            Generate IaC Template
          </Button>
          <Button 
            leftSection={<IconCode size={16} />}
            variant="light"
            color="cg-navy"
            onClick={() => addNotification('info', 'Architecture Doc', 'Creating architecture documentation...')}
          >
            Create Architecture Doc
          </Button>
          <Button 
            leftSection={<IconCloud size={16} />}
            variant="light"
            color="cg-navy"
            onClick={() => addNotification('info', 'Export', 'Exporting project plan...')}
          >
            Export Plan
          </Button>
        </Group>
      </Card>
    </Box>
  );
};

export default Greenfield;