import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Network Protocol Analysis endpoints
  async getNetworkTopology() {
    return this.get('/api/network/topology');
  }

  async getProtocolStats() {
    return this.get('/api/network/protocol-analysis');
  }

  async getLatencyMap() {
    return this.get('/api/network/latency-analysis');
  }

  // FinOps endpoints
  async getCostAnalysis() {
    return this.get('/api/finops/cost-analysis');
  }

  async getOptimizationRecommendations() {
    return this.get('/api/finops/terraform-recommendations');
  }

  async getCostTrends() {
    return this.get('/api/finops/cost-analysis');
  }

  // Security endpoints
  async getSecurityScan() {
    return this.get('/api/security/scan');
  }

  async getVulnerabilities() {
    return this.get('/api/security/vulnerabilities');
  }

  async getComplianceStatus() {
    return this.get('/api/security/compliance');
  }

  // Observability endpoints
  async getObservabilityGaps() {
    return this.get('/api/observability/gaps');
  }

  async getMetricsHealth() {
    return this.get('/api/observability/metrics-health');
  }

  async getAlertsTuning() {
    return this.get('/api/observability/alerts-tuning');
  }

  // Executive Reporting endpoints
  async getExecutiveDashboard(level: string = 'ceo') {
    return this.get(`/api/executive/dashboard/${level}`);
  }

  async getROIMetrics() {
    return this.get('/api/executive/roi-metrics');
  }

  async getCostSavings() {
    return this.get('/api/executive/cost-savings');
  }

  // Outage Context endpoints
  async getOutageAnalysis(timeRange?: string) {
    return this.get('/api/outage/analysis', { params: { time_range: timeRange } });
  }

  async getIncidentTimeline(incidentId: string) {
    return this.get(`/api/outage/incident/${incidentId}/timeline`);
  }

  async getDependencyImpact(serviceId: string) {
    return this.get(`/api/outage/dependency-impact/${serviceId}`);
  }

  // DR Guidance endpoints
  async getDRStatus() {
    return this.get('/api/dr/status');
  }

  async getRecoveryPlans() {
    return this.get('/api/dr/recovery-plans');
  }

  async getRPOAnalysis() {
    return this.get('/api/dr/rpo-analysis');
  }

  // Greenfield endpoints
  async getArchitectureRecommendations(requirements: any) {
    return this.post('/api/greenfield/architecture-recommendations', requirements);
  }

  async getDesignPatterns() {
    return this.get('/api/greenfield/design-patterns');
  }

  async getTechnologyStack() {
    return this.get('/api/greenfield/technology-stack');
  }

  // ARB Support endpoints
  async getReviewChecklist(projectId: string) {
    return this.get(`/api/arb/review-checklist/${projectId}`);
  }

  async getArchitectureDocumentation(projectId: string) {
    return this.get(`/api/arb/architecture-documentation/${projectId}`);
  }

  async getRiskAssessment(projectId: string) {
    return this.get(`/api/arb/risk-assessment/${projectId}`);
  }

  // Dashboard endpoints
  async getRecentActivities() {
    return this.get('/api/system/activities/recent');
  }

  async getInfrastructureNodes() {
    return this.get('/api/infrastructure/nodes');
  }

  async getApplications() {
    return this.get('/api/infrastructure/applications');
  }

  async getApplication(appId: string) {
    return this.get(`/api/infrastructure/application/${appId}`);
  }

  // System health endpoint
  async getSystemHealth() {
    return this.get('/api/system/health');
  }

  // Health check
  async healthCheck() {
    return this.get('/api/health');
  }
}

export default new ApiClient();