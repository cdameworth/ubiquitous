import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Card, Group, Stack, Tabs, Text, Title, LoadingOverlay, Box, Grid, Badge, Progress, Button, Select, Table, Alert, Timeline } from '@mantine/core';
import { IconRefresh, IconShield, IconCheck, IconX, IconExclamationMark, IconClock, IconTrendingUp, IconTrendingDown, IconAlertTriangle, IconChartBar, IconFileCheck, IconBuilding } from '@tabler/icons-react';
import api from '../../services/api';

interface ARBData {
  proposals: any;
  decisionMatrix: any;
  complianceCheck: any;
}

const ArbSupport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [arbData, setArbData] = useState<ARBData | null>(null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'matrix' | 'compliance'>('proposals');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const { addNotification } = useNotification();

  useEffect(() => {
    loadARBData();
  }, [selectedStatus, selectedPriority]);

  const loadARBData = async () => {
    try {
      setLoading(true);
      
      // Load data from real API endpoints
      const [proposalsResponse, complianceResponse] = await Promise.all([
        api.get(`/api/arb/architecture-review${selectedStatus ? `?status=${selectedStatus}` : ''}${selectedPriority ? `${selectedStatus ? '&' : '?'}priority=${selectedPriority}` : ''}`),
        selectedProposalId ? api.get(`/api/arb/compliance-check?proposal_id=${selectedProposalId}`) : Promise.resolve(null)
      ]);
      
      setArbData({
        proposals: proposalsResponse.data || proposalsResponse,
        decisionMatrix: null, // Load when needed
        complianceCheck: complianceResponse?.data || complianceResponse
      });
      
      // Set first proposal ID for compliance check if none selected
      if (!selectedProposalId && (proposalsResponse.data?.proposals || proposalsResponse.proposals)?.length > 0) {
        const firstProposal = (proposalsResponse.data?.proposals || proposalsResponse.proposals)[0];
        setSelectedProposalId(firstProposal.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('ARB API Error:', error);
      addNotification('error', 'Failed to load ARB data', 'Check API connectivity');
      setLoading(false);
    }
  };

  const loadDecisionMatrix = async (proposalIds: string[]) => {
    try {
      const response = await api.get(`/api/arb/decision-matrix?proposal_ids=${proposalIds.join(',')}`);
      setArbData(prev => prev ? {
        ...prev,
        decisionMatrix: response.data || response
      } : null);
    } catch (error) {
      console.error('Decision Matrix API Error:', error);
      addNotification('error', 'Failed to load decision matrix');
    }
  };

  const loadComplianceCheck = async (proposalId: string) => {
    try {
      const response = await api.get(`/api/arb/compliance-check?proposal_id=${proposalId}`);
      setArbData(prev => prev ? {
        ...prev,
        complianceCheck: response.data || response
      } : null);
    } catch (error) {
      console.error('Compliance Check API Error:', error);
      addNotification('error', 'Failed to load compliance check');
    }
  };

  const getScoreColor = (score: number, invertScale: boolean = false) => {
    const adjustedScore = invertScale ? 100 - score : score;
    if (adjustedScore >= 80) return 'green';
    if (adjustedScore >= 60) return 'yellow';
    if (adjustedScore >= 40) return 'orange';
    return 'red';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'very_high': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'green';
      case 'in_review': return 'blue';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
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
          <Text size="lg" c="dimmed">Loading ARB decision support...</Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1} c="cg-navy">Architecture Review Board - Decision Support</Title>
          <Text c="dimmed">
            Comprehensive analysis and decision frameworks for architecture proposals
          </Text>
        </Stack>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          color="cg-navy"
          onClick={loadARBData}
        >
          Refresh Analysis
        </Button>
      </Group>

      {/* Overview Cards */}
      {arbData?.proposals && (
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Total Proposals</Text>
                <Text size="xl" fw={700} c="blue">
                  {arbData.proposals.total_proposals || 0}
                </Text>
                <Text size="xs" c="dimmed">Under review</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Avg Score</Text>
                <Text size="xl" fw={700} c="green">
                  {arbData.proposals.summary?.avg_overall_score || 0}
                </Text>
                <Text size="xs" c="dimmed">Out of 10</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>Total Investment</Text>
                <Text size="xl" fw={700} c="orange">
                  ${(arbData.proposals.summary?.total_estimated_investment / 1000000 || 0).toFixed(1)}M
                </Text>
                <Text size="xs" c="dimmed">Estimated cost</Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed" fw={500}>High Priority</Text>
                <Text size="xl" fw={700} c="red">
                  {arbData.proposals.summary?.by_priority?.high || 0}
                </Text>
                <Text size="xs" c="dimmed">Proposals</Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)}>
        <Tabs.List>
          <Tabs.Tab value="proposals" leftSection={<IconBuilding size={16} />}>
            Architecture Proposals
          </Tabs.Tab>
          <Tabs.Tab value="matrix" leftSection={<IconChartBar size={16} />}>
            Decision Matrix
          </Tabs.Tab>
          <Tabs.Tab value="compliance" leftSection={<IconFileCheck size={16} />}>
            Compliance Check
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="proposals" pt="md">
          <Stack gap="md">
            {/* Filters */}
            <Card withBorder padding="md" radius="md">
              <Group>
                <Select
                  label="Status Filter"
                  placeholder="All statuses"
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value || '')}
                  data={[
                    { value: '', label: 'All Statuses' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'in_review', label: 'In Review' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' }
                  ]}
                />
                <Select
                  label="Priority Filter"
                  placeholder="All priorities"
                  value={selectedPriority}
                  onChange={(value) => setSelectedPriority(value || '')}
                  data={[
                    { value: '', label: 'All Priorities' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                  ]}
                />
              </Group>
            </Card>

            {/* Proposals List */}
            <Card withBorder padding="lg" radius="md">
              <Title order={3} mb="md">Architecture Proposals</Title>
              
              {arbData?.proposals?.proposals ? (
                <Stack gap="md">
                  {arbData.proposals.proposals.map((proposal: any) => (
                    <Card key={proposal.id} withBorder padding="md" radius="sm" bg="gray.0">
                      <Group justify="space-between" mb="sm">
                        <Stack gap="xs">
                          <Group gap="sm">
                            <Text fw={600} size="lg">{proposal.title}</Text>
                            <Badge color={getStatusColor(proposal.status)} size="sm">
                              {proposal.status.replace('_', ' ')}
                            </Badge>
                            <Badge color={getPriorityColor(proposal.priority)} size="sm">
                              {proposal.priority} priority
                            </Badge>
                          </Group>
                          <Text size="sm" c="dimmed">{proposal.description}</Text>
                          <Group gap="md">
                            <Text size="xs" c="dimmed">ID: {proposal.id}</Text>
                            <Text size="xs" c="dimmed">Category: {proposal.category.replace('_', ' ')}</Text>
                            <Text size="xs" c="dimmed">Submitted: {new Date(proposal.submitted_date).toLocaleDateString()}</Text>
                          </Group>
                        </Stack>
                        <Stack align="end" gap="xs">
                          <Badge color={getComplexityColor(proposal.complexity)} size="lg">
                            {proposal.complexity.replace('_', ' ')} complexity
                          </Badge>
                          <Text size="xl" fw={700} c="blue">
                            {proposal.review_scores?.overall_score || 0}/10
                          </Text>
                        </Stack>
                      </Group>

                      <Grid>
                        <Grid.Col span={3}>
                          <Stack gap="xs">
                            <Text size="sm" c="dimmed">Technical Score</Text>
                            <Group justify="space-between">
                              <Text fw={600} c={getScoreColor(proposal.review_scores?.technical_viability * 10)}>
                                {proposal.review_scores?.technical_viability || 0}/10
                              </Text>
                              <Progress 
                                value={(proposal.review_scores?.technical_viability || 0) * 10} 
                                color={getScoreColor(proposal.review_scores?.technical_viability * 10)}
                                size="sm"
                                w="60%"
                              />
                            </Group>
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={3}>
                          <Stack gap="xs">
                            <Text size="sm" c="dimmed">Business Value</Text>
                            <Group justify="space-between">
                              <Text fw={600} c={getScoreColor(proposal.review_scores?.business_value * 10)}>
                                {proposal.review_scores?.business_value || 0}/10
                              </Text>
                              <Progress 
                                value={(proposal.review_scores?.business_value || 0) * 10} 
                                color={getScoreColor(proposal.review_scores?.business_value * 10)}
                                size="sm"
                                w="60%"
                              />
                            </Group>
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={3}>
                          <Stack gap="xs">
                            <Text size="sm" c="dimmed">Implementation Risk</Text>
                            <Group justify="space-between">
                              <Text fw={600} c={getScoreColor(proposal.review_scores?.implementation_risk * 10, true)}>
                                {proposal.review_scores?.implementation_risk || 0}/10
                              </Text>
                              <Progress 
                                value={(proposal.review_scores?.implementation_risk || 0) * 10} 
                                color={getScoreColor(proposal.review_scores?.implementation_risk * 10, true)}
                                size="sm"
                                w="60%"
                              />
                            </Group>
                          </Stack>
                        </Grid.Col>

                        <Grid.Col span={3}>
                          <Stack gap="xs">
                            <Text size="sm" c="dimmed">Investment</Text>
                            <Text fw={600} c="orange">
                              ${(proposal.estimated_cost / 1000000).toFixed(1)}M
                            </Text>
                            <Text size="xs" c="dimmed">{proposal.estimated_timeline_months} months</Text>
                          </Stack>
                        </Grid.Col>
                      </Grid>

                      <Group justify="space-between" mt="md">
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">Submitted by:</Text>
                          <Badge variant="light" color="blue" size="sm">{proposal.submitted_by}</Badge>
                        </Group>
                        <Group gap="xs">
                          <Button 
                            size="xs" 
                            variant="light" 
                            color="blue"
                            onClick={() => {
                              setSelectedProposalId(proposal.id);
                              setActiveTab('compliance');
                              loadComplianceCheck(proposal.id);
                            }}
                          >
                            View Compliance
                          </Button>
                          <Button 
                            size="xs" 
                            variant="light" 
                            color="green"
                            onClick={() => {
                              const proposalIds = arbData?.proposals?.proposals?.slice(0, 3).map((p: any) => p.id) || [];
                              setActiveTab('matrix');
                              loadDecisionMatrix(proposalIds);
                            }}
                          >
                            Compare
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed">No proposals available</Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="matrix" pt="md">
          <Card withBorder padding="lg" radius="md">
            <Title order={3} mb="md">Multi-Criteria Decision Matrix</Title>
            
            {arbData?.decisionMatrix ? (
              <Stack gap="md">
                <Alert icon={<IconChartBar />} color="blue">
                  <Text fw={500}>Decision Analysis Complete</Text>
                  <Text size="sm">
                    Compared {arbData.decisionMatrix.proposals_compared} proposals using weighted criteria
                  </Text>
                </Alert>

                <Grid>
                  <Grid.Col span={6}>
                    <Card padding="md" radius="sm" bg="green.0">
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">Recommended Proposal</Text>
                        <Text fw={600} c="green">
                          {arbData.decisionMatrix.summary?.recommended_proposal?.substring(0, 8) || 'N/A'}
                        </Text>
                        <Text size="xs" c="dimmed">Highest weighted score</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={6}>
                    <Card padding="md" radius="sm" bg="blue.0">
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">Score Range</Text>
                        <Text fw={600} c="blue">
                          {arbData.decisionMatrix.summary?.score_range || 'N/A'}
                        </Text>
                        <Text size="xs" c="dimmed">Min - Max scores</Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {/* Decision Criteria Table */}
                <Card padding="md" radius="sm" bg="gray.0">
                  <Title order={4} mb="sm">Decision Criteria Weights</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Criterion</Table.Th>
                        <Table.Th>Weight</Table.Th>
                        <Table.Th>Description</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Object.entries(arbData.decisionMatrix.decision_criteria || {}).map(([key, criterion]: [string, any]) => (
                        <Table.Tr key={key}>
                          <Table.Td>
                            <Text fw={500}>{key.replace('_', ' ')}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="blue" size="sm">{(criterion.weight * 100).toFixed(0)}%</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">{criterion.description}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>

                {/* Comparison Results */}
                <Card padding="md" radius="sm" bg="gray.0">
                  <Title order={4} mb="sm">Proposal Rankings</Title>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Rank</Table.Th>
                        <Table.Th>Proposal</Table.Th>
                        <Table.Th>Weighted Score</Table.Th>
                        <Table.Th>Cost</Table.Th>
                        <Table.Th>Timeline</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {arbData.decisionMatrix.comparison_results?.map((result: any) => (
                        <Table.Tr key={result.id}>
                          <Table.Td>
                            <Badge color={result.rank === 1 ? 'green' : result.rank === 2 ? 'yellow' : 'orange'} size="lg">
                              #{result.rank}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500}>{result.title}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} c={getScoreColor(result.weighted_score * 10)}>
                              {result.weighted_score}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>${(result.details?.estimated_cost / 1000000).toFixed(1)}M</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{result.details?.timeline_months}mo</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Card>
              </Stack>
            ) : (
              <Stack align="center" gap="md">
                <Text c="dimmed">Select proposals to compare using decision matrix</Text>
                <Button 
                  color="blue"
                  onClick={() => {
                    const proposalIds = arbData?.proposals?.proposals?.slice(0, 3).map((p: any) => p.id) || [];
                    loadDecisionMatrix(proposalIds);
                  }}
                >
                  Load Decision Matrix
                </Button>
              </Stack>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="compliance" pt="md">
          <Stack gap="md">
            {/* Proposal Selection */}
            <Card withBorder padding="md" radius="md">
              <Group>
                <Select
                  label="Select Proposal"
                  value={selectedProposalId}
                  onChange={(value) => {
                    setSelectedProposalId(value || '');
                    if (value) loadComplianceCheck(value);
                  }}
                  data={arbData?.proposals?.proposals?.map((p: any) => ({
                    value: p.id,
                    label: `${p.title} (${p.id.substring(0, 8)})`
                  })) || []}
                />
              </Group>
            </Card>

            {/* Compliance Results */}
            <Card withBorder padding="lg" radius="md">
              <Title order={3} mb="md">Enterprise Compliance Check</Title>
              
              {arbData?.complianceCheck ? (
                <Stack gap="md">
                  {/* Overall Compliance */}
                  <Alert 
                    icon={arbData.complianceCheck.overall_compliance?.percentage >= 90 ? <IconCheck /> : <IconAlertTriangle />}
                    color={arbData.complianceCheck.overall_compliance?.percentage >= 90 ? 'green' : arbData.complianceCheck.overall_compliance?.percentage >= 70 ? 'yellow' : 'red'}
                  >
                    <Text fw={500}>
                      Overall Compliance: {arbData.complianceCheck.overall_compliance?.percentage || 0}%
                    </Text>
                    <Text size="sm">
                      Status: {arbData.complianceCheck.overall_compliance?.status?.replace('_', ' ') || 'Unknown'}
                    </Text>
                  </Alert>

                  <Grid>
                    <Grid.Col span={4}>
                      <Card padding="md" radius="sm" bg="green.0">
                        <Stack gap="xs" align="center">
                          <Text size="sm" c="dimmed">Passed Checks</Text>
                          <Text size="xl" fw={700} c="green">
                            {arbData.complianceCheck.overall_compliance?.passed_checks || 0}
                          </Text>
                        </Stack>
                      </Card>
                    </Grid.Col>

                    <Grid.Col span={4}>
                      <Card padding="md" radius="sm" bg="red.0">
                        <Stack gap="xs" align="center">
                          <Text size="sm" c="dimmed">Failed Checks</Text>
                          <Text size="xl" fw={700} c="red">
                            {arbData.complianceCheck.overall_compliance?.failed_checks || 0}
                          </Text>
                        </Stack>
                      </Card>
                    </Grid.Col>

                    <Grid.Col span={4}>
                      <Card padding="md" radius="sm" bg="blue.0">
                        <Stack gap="xs" align="center">
                          <Text size="sm" c="dimmed">Total Checks</Text>
                          <Text size="xl" fw={700} c="blue">
                            {arbData.complianceCheck.overall_compliance?.total_checks || 0}
                          </Text>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  </Grid>

                  {/* Category Breakdown */}
                  <Grid>
                    {Object.entries(arbData.complianceCheck.category_results || {}).map(([category, result]: [string, any]) => (
                      <Grid.Col key={category} span={6}>
                        <Card withBorder padding="md" radius="sm">
                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text fw={500}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                              <Badge color={getScoreColor(result.compliance_percentage)} size="sm">
                                {result.compliance_percentage}%
                              </Badge>
                            </Group>
                            <Group justify="space-between">
                              <Group gap="xs">
                                <Badge color="green" size="xs">{result.checks_passed} ✓</Badge>
                                <Badge color="red" size="xs">{result.total_applicable_checks - result.checks_passed} ✗</Badge>
                              </Group>
                              <Progress 
                                value={result.compliance_percentage} 
                                color={getScoreColor(result.compliance_percentage)}
                                size="sm"
                                w="50%"
                              />
                            </Group>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>

                  {/* Non-Compliance Issues */}
                  {arbData.complianceCheck.non_compliance_issues?.length > 0 && (
                    <Card padding="md" radius="sm" bg="red.0">
                      <Title order={4} mb="sm">Non-Compliance Issues</Title>
                      <Stack gap="xs">
                        {arbData.complianceCheck.non_compliance_issues.slice(0, 5).map((issue: any, index: number) => (
                          <Group key={index} justify="space-between">
                            <Group gap="sm">
                              <Badge color={getPriorityColor(issue.priority)} size="xs">
                                {issue.priority}
                              </Badge>
                              <Text size="sm">{issue.requirement}</Text>
                            </Group>
                            <Badge color="orange" size="xs">{issue.remediation_effort} effort</Badge>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  )}

                  {/* Approval Readiness */}
                  <Card padding="md" radius="sm" bg={arbData.complianceCheck.approval_readiness?.ready_for_arb ? "green.0" : "orange.0"}>
                    <Group justify="space-between">
                      <Stack gap="xs">
                        <Text fw={500}>ARB Approval Readiness</Text>
                        <Text size="sm" c="dimmed">
                          {arbData.complianceCheck.approval_readiness?.ready_for_arb ? 
                            'Ready for ARB review' : 
                            `${arbData.complianceCheck.approval_readiness?.blocking_issues || 0} blocking issues`
                          }
                        </Text>
                      </Stack>
                      <Badge 
                        color={arbData.complianceCheck.approval_readiness?.ready_for_arb ? 'green' : 'orange'}
                        size="lg"
                        leftSection={arbData.complianceCheck.approval_readiness?.ready_for_arb ? <IconCheck size={12} /> : <IconX size={12} />}
                      >
                        {arbData.complianceCheck.approval_readiness?.ready_for_arb ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </Group>
                  </Card>
                </Stack>
              ) : (
                <Text c="dimmed">Select a proposal to view compliance assessment</Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Action Buttons */}
      <Group justify="center" gap="md" mt="xl">
        <Button 
          leftSection={<IconFileCheck size={16} />}
          color="blue"
          onClick={() => addNotification('info', 'Report', 'Generating comprehensive ARB report...')}
        >
          Generate ARB Report
        </Button>
        <Button 
          leftSection={<IconClock size={16} />}
          variant="light"
          color="orange"
          onClick={() => addNotification('info', 'Review', 'Scheduling ARB review meeting...')}
        >
          Schedule Review
        </Button>
        <Button 
          leftSection={<IconExclamationMark size={16} />}
          variant="light"
          color="red"
          onClick={() => addNotification('info', 'Clarification', 'Requesting additional clarification...')}
        >
          Request Clarification
        </Button>
      </Group>
    </Box>
  );
};

export default ArbSupport;