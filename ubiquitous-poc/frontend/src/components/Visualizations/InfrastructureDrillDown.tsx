import React, { useState, useEffect, useCallback } from 'react';
import { GraphNode, GraphEdge, infrastructureGraphService } from '../../services/InfrastructureGraphService';
import './InfrastructureDrillDown.css';

interface NodeDetails {
  node: GraphNode;
  children: GraphNode[];
  dependencies: GraphEdge[];
  metrics: Record<string, any>;
}

interface DrillDownPath {
  level: number;
  nodeId: string;
  nodeName: string;
  nodeType: string;
}

interface InfrastructureDrillDownProps {
  selectedNodeId?: string;
  onNodeSelect?: (nodeId: string) => void;
  onPathChange?: (path: DrillDownPath[]) => void;
  className?: string;
}

const InfrastructureDrillDown: React.FC<InfrastructureDrillDownProps> = ({
  selectedNodeId,
  onNodeSelect,
  onPathChange,
  className = ''
}) => {
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillPath, setDrillPath] = useState<DrillDownPath[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'children']));

  // Load node details when selected node changes
  useEffect(() => {
    if (!selectedNodeId) {
      setNodeDetails(null);
      setDrillPath([]);
      return;
    }

    loadNodeDetails(selectedNodeId);
  }, [selectedNodeId]);

  const loadNodeDetails = useCallback(async (nodeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const details = await infrastructureGraphService.getNodeDetails(nodeId);
      setNodeDetails(details);
      
      // Update drill-down path
      const newPath: DrillDownPath[] = [
        ...drillPath,
        {
          level: drillPath.length,
          nodeId: details.node.id,
          nodeName: details.node.label,
          nodeType: details.node.type
        }
      ];
      
      setDrillPath(newPath);
      
      if (onPathChange) {
        onPathChange(newPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node details');
    } finally {
      setLoading(false);
    }
  }, [drillPath, onPathChange]);

  const navigateToLevel = useCallback((targetLevel: number) => {
    if (targetLevel < 0 || targetLevel >= drillPath.length) return;
    
    const newPath = drillPath.slice(0, targetLevel + 1);
    setDrillPath(newPath);
    
    if (newPath.length > 0) {
      const targetNode = newPath[newPath.length - 1];
      if (onNodeSelect) {
        onNodeSelect(targetNode.nodeId);
      }
    }
    
    if (onPathChange) {
      onPathChange(newPath);
    }
  }, [drillPath, onNodeSelect, onPathChange]);

  const drillIntoChild = useCallback((childNode: GraphNode) => {
    if (onNodeSelect) {
      onNodeSelect(childNode.id);
    }
  }, [onNodeSelect]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'healthy': '#27ae60',
      'warning': '#f39c12',
      'critical': '#e74c3c',
      'unknown': '#95a5a6',
      'degraded': '#e67e22'
    };
    return statusColors[status] || '#95a5a6';
  };

  const getTypeIcon = (type: string): string => {
    const typeIcons: Record<string, string> = {
      'aws-region': '🌍',
      'vpc': '🏗️',
      'eks-cluster': '☸️',
      'pod': '📦',
      'rds-instance': '🗄️',
      'ec2-instance': '💻',
      'aws-service': '⚙️'
    };
    return typeIcons[type] || '📊';
  };

  const formatCost = (cost?: number): string => {
    if (!cost) return 'N/A';
    if (cost >= 1000000) return `$${(cost / 1000000).toFixed(1)}M`;
    if (cost >= 1000) return `$${(cost / 1000).toFixed(0)}K`;
    return `$${cost.toFixed(0)}`;
  };

  const formatMetricValue = (value: any): string => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      if (value < 1) return value.toFixed(2);
      return value.toFixed(0);
    }
    return String(value);
  };

  if (!selectedNodeId) {
    return (
      <div className={`infrastructure-drill-down empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Select a node to explore</h3>
          <p>Click on any infrastructure component in the graph to view detailed information and navigate the topology.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`infrastructure-drill-down loading ${className}`}>
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading node details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`infrastructure-drill-down error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load details</h3>
          <p>{error}</p>
          <button onClick={() => selectedNodeId && loadNodeDetails(selectedNodeId)} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!nodeDetails) {
    return null;
  }

  return (
    <div className={`infrastructure-drill-down ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <div className="breadcrumb-items">
          {drillPath.map((item, index) => (
            <React.Fragment key={item.nodeId}>
              <button
                className={`breadcrumb-item ${index === drillPath.length - 1 ? 'active' : ''}`}
                onClick={() => navigateToLevel(index)}
              >
                <span className="breadcrumb-icon">{getTypeIcon(item.nodeType)}</span>
                <span className="breadcrumb-text">{item.nodeName}</span>
              </button>
              {index < drillPath.length - 1 && (
                <span className="breadcrumb-separator">›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Node Overview */}
      <div className="drill-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('overview')}
        >
          <h3>
            <span className="node-icon">{getTypeIcon(nodeDetails.node.type)}</span>
            {nodeDetails.node.label}
          </h3>
          <div className="node-status">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getStatusColor(nodeDetails.node.status) }}
            />
            <span className="status-text">{nodeDetails.node.status}</span>
          </div>
          <button className={`expand-btn ${expandedSections.has('overview') ? 'expanded' : ''}`}>
            ↓
          </button>
        </div>
        
        {expandedSections.has('overview') && (
          <div className="section-content">
            <div className="node-properties">
              <div className="property-grid">
                <div className="property-item">
                  <span className="property-label">Type:</span>
                  <span className="property-value">{nodeDetails.node.type}</span>
                </div>
                <div className="property-item">
                  <span className="property-label">Category:</span>
                  <span className="property-value">{nodeDetails.node.category}</span>
                </div>
                {nodeDetails.node.cost && (
                  <div className="property-item">
                    <span className="property-label">Monthly Cost:</span>
                    <span className="property-value cost">{formatCost(nodeDetails.node.cost)}</span>
                  </div>
                )}
                
                {/* Additional properties */}
                {Object.entries(nodeDetails.node.properties).map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-label">{key.replace(/_/g, ' ')}:</span>
                    <span className="property-value">{formatMetricValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      {nodeDetails.metrics && Object.keys(nodeDetails.metrics).length > 0 && (
        <div className="drill-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('metrics')}
          >
            <h3>📊 Performance Metrics</h3>
            <button className={`expand-btn ${expandedSections.has('metrics') ? 'expanded' : ''}`}>
              ↓
            </button>
          </div>
          
          {expandedSections.has('metrics') && (
            <div className="section-content">
              <div className="metrics-grid">
                {Object.entries(nodeDetails.metrics).map(([metric, value]) => (
                  <div key={metric} className="metric-item">
                    <div className="metric-label">{metric.replace(/_/g, ' ')}</div>
                    <div className="metric-value">{formatMetricValue(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Child Components */}
      {nodeDetails.children && nodeDetails.children.length > 0 && (
        <div className="drill-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('children')}
          >
            <h3>🔗 Child Components ({nodeDetails.children.length})</h3>
            <button className={`expand-btn ${expandedSections.has('children') ? 'expanded' : ''}`}>
              ↓
            </button>
          </div>
          
          {expandedSections.has('children') && (
            <div className="section-content">
              <div className="children-list">
                {nodeDetails.children.map(child => (
                  <div 
                    key={child.id}
                    className="child-item"
                    onClick={() => drillIntoChild(child)}
                  >
                    <div className="child-info">
                      <span className="child-icon">{getTypeIcon(child.type)}</span>
                      <div className="child-details">
                        <div className="child-name">{child.label}</div>
                        <div className="child-type">{child.type}</div>
                      </div>
                    </div>
                    <div className="child-status">
                      <div 
                        className="status-indicator small"
                        style={{ backgroundColor: getStatusColor(child.status) }}
                      />
                      <span className="status-text">{child.status}</span>
                    </div>
                    {child.cost && (
                      <div className="child-cost">{formatCost(child.cost)}</div>
                    )}
                    <button className="drill-btn">→</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dependencies */}
      {nodeDetails.dependencies && nodeDetails.dependencies.length > 0 && (
        <div className="drill-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('dependencies')}
          >
            <h3>🔄 Dependencies ({nodeDetails.dependencies.length})</h3>
            <button className={`expand-btn ${expandedSections.has('dependencies') ? 'expanded' : ''}`}>
              ↓
            </button>
          </div>
          
          {expandedSections.has('dependencies') && (
            <div className="section-content">
              <div className="dependencies-list">
                {nodeDetails.dependencies.map(dep => (
                  <div key={dep.id} className="dependency-item">
                    <div className="dependency-info">
                      <div className="dependency-type">{dep.type}</div>
                      <div className="dependency-target">
                        {dep.source === nodeDetails.node.id ? 'Depends on' : 'Depended by'}: 
                        <strong>{dep.source === nodeDetails.node.id ? dep.target : dep.source}</strong>
                      </div>
                    </div>
                    {dep.weight && (
                      <div className="dependency-weight">
                        Weight: {dep.weight}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="drill-actions">
        <button 
          className="action-btn primary"
          onClick={() => {
            // Navigate to node in main graph
            if (onNodeSelect && selectedNodeId) {
              onNodeSelect(selectedNodeId);
            }
          }}
        >
          📍 Focus in Graph
        </button>
        
        <button 
          className="action-btn secondary"
          onClick={() => {
            // Show dependency path visualization
            console.log('Show dependency paths for:', nodeDetails.node.id);
          }}
        >
          🔄 View Dependencies
        </button>
        
        {nodeDetails.node.cost && nodeDetails.node.cost > 10000 && (
          <button 
            className="action-btn warning"
            onClick={() => {
              // Show cost optimization recommendations
              console.log('Analyze cost optimization for:', nodeDetails.node.id);
            }}
          >
            💰 Cost Analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default InfrastructureDrillDown;