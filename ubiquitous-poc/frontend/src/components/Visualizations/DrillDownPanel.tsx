import React, { useState, useEffect } from 'react';
import './DrillDownPanel.css';

interface DrillDownItem {
  id: string;
  name: string;
  type: 'cluster' | 'service' | 'database' | 'gateway' | 'pod' | 'container' | 'process';
  status: 'healthy' | 'warning' | 'critical';
  parent?: string;
  children?: string[];
  metrics?: {
    cpu: number;
    memory: number;
    latency: number;
    requests?: number;
    errors?: number;
    bandwidth?: number;
  };
  metadata?: {
    namespace?: string;
    version?: string;
    replicas?: number;
    uptime?: string;
    region?: string;
  };
}

interface DrillDownPanelProps {
  selectedItem: DrillDownItem | null;
  onItemSelect: (item: DrillDownItem) => void;
  onClose: () => void;
  className?: string;
}

const DrillDownPanel: React.FC<DrillDownPanelProps> = ({
  selectedItem,
  onItemSelect,
  onClose,
  className = ''
}) => {
  const [breadcrumb, setBreadcrumb] = useState<DrillDownItem[]>([]);
  const [childItems, setChildItems] = useState<DrillDownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailView, setDetailView] = useState<'overview' | 'metrics' | 'logs' | 'config'>('overview');

  useEffect(() => {
    if (selectedItem) {
      loadChildItems(selectedItem);
      updateBreadcrumb(selectedItem);
    }
  }, [selectedItem]);

  const loadChildItems = async (item: DrillDownItem) => {
    setLoading(true);
    try {
      // Simulate API call to get child items
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockChildren = generateMockChildren(item);
      setChildItems(mockChildren);
    } catch (error) {
      console.error('Failed to load child items:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockChildren = (item: DrillDownItem): DrillDownItem[] => {
    switch (item.type) {
      case 'cluster':
        return [
          {
            id: `${item.id}-ns-1`,
            name: 'default',
            type: 'service',
            status: 'healthy',
            parent: item.id,
            metrics: { cpu: 45, memory: 62, latency: 8, requests: 12500, errors: 2 },
            metadata: { namespace: 'default', replicas: 3, uptime: '7d 14h' }
          },
          {
            id: `${item.id}-ns-2`,
            name: 'kube-system',
            type: 'service',
            status: 'healthy',
            parent: item.id,
            metrics: { cpu: 25, memory: 35, latency: 5, requests: 5200, errors: 0 },
            metadata: { namespace: 'kube-system', replicas: 2, uptime: '15d 6h' }
          },
          {
            id: `${item.id}-ns-3`,
            name: 'monitoring',
            type: 'service',
            status: 'warning',
            parent: item.id,
            metrics: { cpu: 78, memory: 85, latency: 15, requests: 8900, errors: 12 },
            metadata: { namespace: 'monitoring', replicas: 4, uptime: '2d 8h' }
          }
        ];
      case 'service':
        return [
          {
            id: `${item.id}-pod-1`,
            name: `${item.name}-pod-1`,
            type: 'pod',
            status: 'healthy',
            parent: item.id,
            metrics: { cpu: 42, memory: 58, latency: 7, requests: 4200, errors: 1 },
            metadata: { version: '1.2.3', uptime: '6h 23m' }
          },
          {
            id: `${item.id}-pod-2`,
            name: `${item.name}-pod-2`,
            type: 'pod',
            status: 'healthy',
            parent: item.id,
            metrics: { cpu: 38, memory: 54, latency: 8, requests: 3800, errors: 0 },
            metadata: { version: '1.2.3', uptime: '4h 15m' }
          },
          {
            id: `${item.id}-pod-3`,
            name: `${item.name}-pod-3`,
            type: 'pod',
            status: 'critical',
            parent: item.id,
            metrics: { cpu: 95, memory: 92, latency: 25, requests: 1200, errors: 45 },
            metadata: { version: '1.2.2', uptime: '12m' }
          }
        ];
      case 'pod':
        return [
          {
            id: `${item.id}-container-1`,
            name: 'app-container',
            type: 'container',
            status: item.status,
            parent: item.id,
            metrics: { cpu: 65, memory: 72, latency: 6, requests: 2800, errors: 3 },
            metadata: { version: '1.2.3' }
          },
          {
            id: `${item.id}-container-2`,
            name: 'sidecar-proxy',
            type: 'container',
            status: 'healthy',
            parent: item.id,
            metrics: { cpu: 15, memory: 25, latency: 2, requests: 2800, errors: 0 },
            metadata: { version: '0.8.1' }
          }
        ];
      default:
        return [];
    }
  };

  const updateBreadcrumb = (item: DrillDownItem) => {
    // Simulate building breadcrumb trail
    const crumbs: DrillDownItem[] = [item];
    setBreadcrumb(crumbs);
  };

  const handleBreadcrumbClick = (item: DrillDownItem, index: number) => {
    onItemSelect(item);
    setBreadcrumb(breadcrumb.slice(0, index + 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatMetricValue = (value: number, type: string) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    
    switch (type) {
      case 'cpu':
      case 'memory':
        return `${value}%`;
      case 'latency':
        return `${value}ms`;
      case 'requests':
        return value > 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
      case 'errors':
        return value.toString();
      case 'bandwidth':
        return `${value} Mbps`;
      default:
        return value.toString();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cluster': return '🏢';
      case 'service': return '⚙️';
      case 'database': return '🗄️';
      case 'gateway': return '🚪';
      case 'pod': return '📦';
      case 'container': return '🐳';
      case 'process': return '⚡';
      default: return '📋';
    }
  };

  const generateLogEntries = (item: DrillDownItem) => {
    const now = new Date();
    const baseMessages = {
      cluster: [
        { level: 'INFO', message: `Cluster ${item.name} initialized successfully` },
        { level: 'INFO', message: `Node autoscaling enabled for ${item.name}` },
        { level: 'WARN', message: `High resource utilization detected in cluster ${item.name}` }
      ],
      service: [
        { level: 'INFO', message: `Service ${item.name} deployed successfully` },
        { level: 'INFO', message: `Health check passed for ${item.name}` },
        { level: 'WARN', message: `Response time increased for ${item.name} endpoints` }
      ],
      pod: [
        { level: 'INFO', message: `Pod ${item.name} started` },
        { level: 'INFO', message: `Container readiness probe succeeded` },
        { level: 'ERROR', message: `Memory limit exceeded in ${item.name}` }
      ],
      namespace: [
        { level: 'INFO', message: `Namespace ${item.name} created` },
        { level: 'INFO', message: `Resource quotas applied to ${item.name}` },
        { level: 'WARN', message: `Network policy conflicts in ${item.name}` }
      ],
      ingress: [
        { level: 'INFO', message: `Ingress ${item.name} configured` },
        { level: 'INFO', message: `SSL certificate renewed for ${item.name}` },
        { level: 'WARN', message: `High traffic detected on ${item.name}` }
      ],
      volume: [
        { level: 'INFO', message: `Volume ${item.name} mounted successfully` },
        { level: 'INFO', message: `Backup completed for ${item.name}` },
        { level: 'WARN', message: `Disk usage above 80% for ${item.name}` }
      ]
    };

    const messages = baseMessages[item.type] || baseMessages.service;
    
    return messages.map((msg, index) => ({
      timestamp: new Date(now.getTime() - (index * 30000 + Math.random() * 30000)).toISOString().slice(0, 19).replace('T', ' '),
      level: msg.level,
      message: msg.message
    })).reverse();
  };

  const generateConfigSections = (item: DrillDownItem) => {
    const baseConfig = {
      cluster: [
        {
          title: 'Cluster Configuration',
          items: [
            { key: 'CLUSTER_NAME', value: item.name },
            { key: 'K8S_VERSION', value: item.metadata?.version || '1.28.2' },
            { key: 'REGION', value: item.metadata?.region || 'us-east-1' },
            { key: 'NODE_COUNT', value: '12' },
            { key: 'AUTO_SCALING', value: 'enabled' }
          ]
        },
        {
          title: 'Network Configuration',
          items: [
            { key: 'VPC_ID', value: 'vpc-12345678' },
            { key: 'SUBNET_COUNT', value: '6' },
            { key: 'SECURITY_GROUPS', value: '4' }
          ]
        }
      ],
      service: [
        {
          title: 'Service Configuration',
          items: [
            { key: 'SERVICE_NAME', value: item.name },
            { key: 'NAMESPACE', value: item.metadata?.namespace || 'default' },
            { key: 'PORT', value: '8080' },
            { key: 'REPLICAS', value: item.metadata?.replicas?.toString() || '3' },
            { key: 'SELECTOR', value: `app=${item.name}` }
          ]
        },
        {
          title: 'Environment Variables',
          items: [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'LOG_LEVEL', value: 'info' },
            { key: 'MAX_CONNECTIONS', value: '1000' }
          ]
        }
      ],
      pod: [
        {
          title: 'Pod Configuration',
          items: [
            { key: 'POD_NAME', value: item.name },
            { key: 'NAMESPACE', value: item.metadata?.namespace || 'default' },
            { key: 'NODE_NAME', value: `node-${item.id.slice(-3)}` },
            { key: 'RESTART_POLICY', value: 'Always' },
            { key: 'IMAGE_PULL_POLICY', value: 'IfNotPresent' }
          ]
        },
        {
          title: 'Resource Limits',
          items: [
            { key: 'CPU_REQUEST', value: item.resources ? `${item.resources.cpu.requested}m` : '100m' },
            { key: 'CPU_LIMIT', value: item.resources ? `${item.resources.cpu.limit}m` : '500m' },
            { key: 'MEMORY_REQUEST', value: item.resources ? `${item.resources.memory.requested}Mi` : '256Mi' },
            { key: 'MEMORY_LIMIT', value: item.resources ? `${item.resources.memory.limit}Mi` : '1024Mi' }
          ]
        }
      ],
      namespace: [
        {
          title: 'Namespace Configuration',
          items: [
            { key: 'NAMESPACE', value: item.name },
            { key: 'STATUS', value: 'Active' },
            { key: 'CREATED', value: '2024-01-01T00:00:00Z' },
            { key: 'RESOURCE_VERSION', value: '12345' }
          ]
        },
        {
          title: 'Resource Quotas',
          items: [
            { key: 'CPU_LIMIT', value: '10 cores' },
            { key: 'MEMORY_LIMIT', value: '20Gi' },
            { key: 'POD_COUNT_LIMIT', value: '50' }
          ]
        }
      ],
      ingress: [
        {
          title: 'Ingress Configuration',
          items: [
            { key: 'INGRESS_NAME', value: item.name },
            { key: 'NAMESPACE', value: item.metadata?.namespace || 'default' },
            { key: 'INGRESS_CLASS', value: 'nginx' },
            { key: 'HOST', value: `${item.name}.example.com` },
            { key: 'TLS_ENABLED', value: 'true' }
          ]
        },
        {
          title: 'SSL Configuration',
          items: [
            { key: 'CERTIFICATE', value: 'letsencrypt-prod' },
            { key: 'TLS_VERSION', value: '1.3' },
            { key: 'CIPHER_SUITE', value: 'ECDHE-RSA-AES256-GCM-SHA384' }
          ]
        }
      ],
      volume: [
        {
          title: 'Volume Configuration',
          items: [
            { key: 'VOLUME_NAME', value: item.name },
            { key: 'NAMESPACE', value: item.metadata?.namespace || 'default' },
            { key: 'STORAGE_CLASS', value: 'gp3' },
            { key: 'CAPACITY', value: '100Gi' },
            { key: 'ACCESS_MODE', value: 'ReadWriteOnce' }
          ]
        },
        {
          title: 'Storage Details',
          items: [
            { key: 'USED_SPACE', value: '67Gi' },
            { key: 'AVAILABLE_SPACE', value: '33Gi' },
            { key: 'IOPS', value: '3000' }
          ]
        }
      ]
    };

    return baseConfig[item.type] || baseConfig.service;
  };

  if (!selectedItem) {
    return null;
  }

  return (
    <div className={`drill-down-panel ${className}`}>
      <div className="panel-header">
        <div className="breadcrumb">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={item.id}>
              <button
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(item, index)}
              >
                <span className="breadcrumb-icon">{getTypeIcon(item.type)}</span>
                <span className="breadcrumb-text">{item.name}</span>
              </button>
              {index < breadcrumb.length - 1 && <span className="breadcrumb-separator">→</span>}
            </React.Fragment>
          ))}
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${detailView === 'overview' ? 'active' : ''}`}
          onClick={() => setDetailView('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${detailView === 'metrics' ? 'active' : ''}`}
          onClick={() => setDetailView('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tab-button ${detailView === 'logs' ? 'active' : ''}`}
          onClick={() => setDetailView('logs')}
        >
          Logs
        </button>
        <button
          className={`tab-button ${detailView === 'config' ? 'active' : ''}`}
          onClick={() => setDetailView('config')}
        >
          Config
        </button>
      </div>

      <div className="panel-content">
        {detailView === 'overview' && (
          <div className="overview-content">
            <div className="item-header">
              <div className="item-info">
                <div className="item-icon">{getTypeIcon(selectedItem.type)}</div>
                <div className="item-details">
                  <h3 className="item-name">{selectedItem.name}</h3>
                  <div className="item-meta">
                    <span className="item-type">{selectedItem.type}</span>
                    <span 
                      className="item-status"
                      style={{ color: getStatusColor(selectedItem.status) }}
                    >
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedItem.metrics && (
              <div className="quick-metrics">
                {Object.entries(selectedItem.metrics).map(([key, value]) => (
                  <div key={key} className="quick-metric">
                    <span className="metric-label">{key.toUpperCase()}</span>
                    <span className="metric-value">{formatMetricValue(value, key)}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedItem.metadata && (
              <div className="metadata-section">
                <h4>Metadata</h4>
                <div className="metadata-grid">
                  {Object.entries(selectedItem.metadata).map(([key, value]) => (
                    <div key={key} className="metadata-item">
                      <span className="metadata-label">{key}</span>
                      <span className="metadata-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="children-section">
              <h4>Child Components</h4>
              {loading ? (
                <div className="loading-children">Loading...</div>
              ) : childItems.length > 0 ? (
                <div className="children-list">
                  {childItems.map(child => (
                    <div
                      key={child.id}
                      className="child-item"
                      onClick={() => onItemSelect(child)}
                    >
                      <div className="child-icon">{getTypeIcon(child.type)}</div>
                      <div className="child-info">
                        <span className="child-name">{child.name}</span>
                        <span className="child-type">{child.type}</span>
                      </div>
                      <div 
                        className="child-status"
                        style={{ backgroundColor: getStatusColor(child.status) }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-children">No child components</div>
              )}
            </div>
          </div>
        )}

        {detailView === 'metrics' && (
          <div className="metrics-content">
            {selectedItem.metrics ? (
              <div className="detailed-metrics">
                {Object.entries(selectedItem.metrics).map(([key, value]) => (
                  <div key={key} className="detailed-metric">
                    <div className="metric-header">
                      <span className="metric-name">{key.toUpperCase()}</span>
                      <span className="metric-current">{formatMetricValue(value, key)}</span>
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{
                          width: `${Math.min(value, 100)}%`,
                          backgroundColor: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-metrics">No metrics available</div>
            )}
          </div>
        )}

        {detailView === 'logs' && (
          <div className="logs-content">
            <div className="log-entries">
              {generateLogEntries(selectedItem).map((log, index) => (
                <div key={index} className={`log-entry ${log.level.toLowerCase()}`}>
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-level">{log.level}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailView === 'config' && (
          <div className="config-content">
            {generateConfigSections(selectedItem).map((section, index) => (
              <div key={index} className="config-section">
                <h5>{section.title}</h5>
                <div className="config-items">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="config-item">
                      <span className="config-key">{item.key}</span>
                      <span className="config-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrillDownPanel;