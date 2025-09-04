import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import SecurityScanner from '../../components/Visualizations/SecurityScanner';
import DependencyVulnerabilityMap from '../../components/Visualizations/DependencyVulnerabilityMap';
import ObservabilityGapAnalysis from '../../components/Visualizations/ObservabilityGapAnalysis';
import AlertTuningRecommendations from '../../components/Visualizations/AlertTuningRecommendations';
import api from '../../services/api';
import './Security.css';

const Security: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'dependencies' | 'observability' | 'alerts'>('scanner');
  const { addNotification } = useNotification();
  
  // SecurityScanner state
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    severity: [],
    status: [],
    category: [],
    cluster: []
  });
  const [sortBy, setSortBy] = useState<'severity' | 'cvss' | 'date' | 'impact'>('severity');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate sample vulnerabilities
      const sampleVulnerabilities = [
        {
          id: 'vuln-001',
          service: 'trading-api',
          title: 'SQL Injection in Order Processing',
          description: 'Unvalidated input in order query endpoint',
          severity: 'critical',
          cvss: 9.8,
          cveId: 'CVE-2024-12345',
          discoveryDate: new Date('2024-01-15'),
          lastSeen: new Date('2024-01-20'),
          status: 'open',
          exploitProbability: 0.9,
          businessImpact: 'critical',
          affectedAssets: ['trading-db', 'order-service'],
          remediationSteps: ['Apply prepared statement patch', 'Update ORM library'],
          estimatedFixTime: '2 hours',
          assignedTo: 'security-team',
          tags: ['database', 'injection', 'critical'],
          category: 'injection',
          cluster: 'prod-trading-cluster'
        },
        {
          id: 'vuln-002',
          service: 'auth-service',
          title: 'Weak JWT Token Validation',
          description: 'JWT tokens not properly validated for expiration',
          severity: 'high',
          cvss: 7.5,
          cveId: 'CVE-2024-12346',
          discoveryDate: new Date('2024-01-16'),
          lastSeen: new Date('2024-01-20'),
          status: 'in-progress',
          exploitProbability: 0.7,
          businessImpact: 'high',
          affectedAssets: ['auth-service', 'api-gateway'],
          remediationSteps: ['Update JWT library', 'Implement token rotation'],
          estimatedFixTime: '4 hours',
          assignedTo: 'backend-team',
          tags: ['authentication', 'jwt', 'session'],
          category: 'authentication',
          cluster: 'prod-auth-cluster'
        },
        {
          id: 'vuln-003',
          service: 'reporting-service',
          title: 'Cross-Site Scripting in Reports',
          description: 'Unsanitized user input in report generation',
          severity: 'medium',
          cvss: 5.3,
          discoveryDate: new Date('2024-01-17'),
          lastSeen: new Date('2024-01-20'),
          status: 'open',
          exploitProbability: 0.5,
          businessImpact: 'medium',
          affectedAssets: ['reporting-ui', 'report-generator'],
          remediationSteps: ['Implement input sanitization', 'Use CSP headers'],
          estimatedFixTime: '3 hours',
          assignedTo: 'frontend-team',
          tags: ['xss', 'frontend', 'input-validation'],
          category: 'xss',
          cluster: 'prod-frontend-cluster'
        }
      ];
      
      setVulnerabilities(sampleVulnerabilities);
      
      setSecurityData({
        criticalVulnerabilities: 8,
        highVulnerabilities: 15,
        mediumVulnerabilities: 23,
        lowVulnerabilities: 12,
        complianceScore: 87,
        totalAssets: 156,
        observabilityGaps: 12,
        alertOptimizations: 18
      });
      
      setLoading(false);
    } catch (error) {
      addNotification('error', 'Failed to load security data');
      setLoading(false);
    }
  };

  // Handler functions for SecurityScanner
  const handleVulnerabilitySelect = (vulnerability: any) => {
    console.log('Selected vulnerability:', vulnerability);
    addNotification('info', `Viewing details for ${vulnerability.title}`);
  };

  const handleStatusUpdate = (id: string, status: string) => {
    setVulnerabilities(prev => 
      prev.map(vuln => vuln.id === id ? { ...vuln, status } : vuln)
    );
    addNotification('success', `Vulnerability status updated to ${status}`);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => {
      const currentFilters = prev[filterType as keyof typeof prev] || [];
      const isSelected = currentFilters.includes(value);
      
      return {
        ...prev,
        [filterType]: isSelected 
          ? currentFilters.filter((f: string) => f !== value)
          : [...currentFilters, value]
      };
    });
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as 'severity' | 'cvss' | 'date' | 'impact');
  };

  if (loading) {
    return (
      <div className="security-loading">
        <div className="loading-spinner"></div>
        <p>Loading comprehensive security analysis...</p>
      </div>
    );
  }

  return (
    <div className="security">
      <div className="security-header">
        <div>
          <h1 className="security-title">Security & Observability Center</h1>
          <p className="security-subtitle">
            Comprehensive vulnerability scanning, dependency analysis, and observability monitoring
          </p>
        </div>
        <div className="security-actions">
          <button className="refresh-button" onClick={loadSecurityData}>
            <span>🔄</span> Refresh All
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="security-overview">
        <div className="overview-card critical">
          <div className="overview-number">{securityData.criticalVulnerabilities}</div>
          <div className="overview-label">Critical Vulnerabilities</div>
          <div className="overview-trend">↑ +2 this week</div>
        </div>
        <div className="overview-card high">
          <div className="overview-number">{securityData.highVulnerabilities}</div>
          <div className="overview-label">High Vulnerabilities</div>
          <div className="overview-trend">↓ -3 this week</div>
        </div>
        <div className="overview-card medium">
          <div className="overview-number">{securityData.mediumVulnerabilities}</div>
          <div className="overview-label">Medium Vulnerabilities</div>
          <div className="overview-trend">→ stable</div>
        </div>
        <div className="overview-card info">
          <div className="overview-number">{securityData.complianceScore}%</div>
          <div className="overview-label">Compliance Score</div>
          <div className="overview-trend">↑ +2% this month</div>
        </div>
        <div className="overview-card gaps">
          <div className="overview-number">{securityData.observabilityGaps}</div>
          <div className="overview-label">Observability Gaps</div>
          <div className="overview-trend">↓ -4 resolved</div>
        </div>
        <div className="overview-card optimizations">
          <div className="overview-number">{securityData.alertOptimizations}</div>
          <div className="overview-label">Alert Optimizations</div>
          <div className="overview-trend">18 pending</div>
        </div>
      </div>

      {/* Security Tabs */}
      <div className="security-tabs">
        <button 
          className={`security-tab ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <span>🛡️</span> Vulnerability Scanner
        </button>
        <button 
          className={`security-tab ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          <span>📦</span> Dependency Analysis
        </button>
        <button 
          className={`security-tab ${activeTab === 'observability' ? 'active' : ''}`}
          onClick={() => setActiveTab('observability')}
        >
          <span>👁️</span> Observability Gaps
        </button>
        <button 
          className={`security-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <span>🔔</span> Alert Tuning
        </button>
      </div>

      {/* Security Content */}
      <div className="security-content">
        {activeTab === 'scanner' && (
          <div className="tab-content">
            <SecurityScanner 
              vulnerabilities={vulnerabilities}
              onVulnerabilitySelect={handleVulnerabilitySelect}
              onStatusUpdate={handleStatusUpdate}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
          </div>
        )}
        
        {activeTab === 'dependencies' && (
          <div className="tab-content">
            <DependencyVulnerabilityMap />
          </div>
        )}
        
        {activeTab === 'observability' && (
          <div className="tab-content">
            <ObservabilityGapAnalysis />
          </div>
        )}
        
        {activeTab === 'alerts' && (
          <div className="tab-content">
            <AlertTuningRecommendations />
          </div>
        )}
      </div>
    </div>
  );
};

export default Security;