import React, { useState, useEffect } from 'react';
import './OptimizationRecommendations.css';

interface Recommendation {
  id: string;
  category: 'cost' | 'performance' | 'security' | 'reliability';
  service: string;
  title: string;
  description: string;
  impact: {
    costSavings?: number;
    performanceImprovement?: number;
    riskReduction?: string;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeEstimate: string;
    complexity: 'simple' | 'moderate' | 'complex';
    prerequisites?: string[];
  };
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  targetResource: {
    type: 'eks' | 'rds' | 'ec2' | 's3' | 'lambda' | 'other';
    name: string;
    region: string;
  };
  automatable: boolean;
  terraformCode?: string;
  tags: string[];
  createdAt: Date;
  estimatedROI: number;
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
  onRecommendationAction: (id: string, action: 'apply' | 'dismiss' | 'view_terraform') => void;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  sortBy: 'priority' | 'savings' | 'roi' | 'effort';
  onSortChange: (sortBy: string) => void;
  className?: string;
}

const OptimizationRecommendations: React.FC<OptimizationRecommendationsProps> = ({
  recommendations,
  onRecommendationAction,
  selectedCategories,
  onCategoryToggle,
  sortBy,
  onSortChange,
  className = ''
}) => {
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'cost', label: 'Cost Optimization', color: '#10b981', icon: '💰' },
    { key: 'performance', label: 'Performance', color: '#3b82f6', icon: '⚡' },
    { key: 'security', label: 'Security', color: '#ef4444', icon: '🔒' },
    { key: 'reliability', label: 'Reliability', color: '#f59e0b', icon: '🛡️' }
  ];

  const priorities = {
    critical: { color: '#dc2626', label: 'Critical' },
    high: { color: '#ea580c', label: 'High' },
    medium: { color: '#ca8a04', label: 'Medium' },
    low: { color: '#65a30d', label: 'Low' }
  };

  const services = {
    eks: { icon: '⚙️', color: '#0066cc' },
    rds: { icon: '🗄️', color: '#ff9900' },
    ec2: { icon: '🖥️', color: '#ff9900' },
    s3: { icon: '📦', color: '#569A31' },
    lambda: { icon: '⚡', color: '#ff9900' },
    other: { icon: '☁️', color: '#6b7280' }
  };

  useEffect(() => {
    if (!recommendations || !Array.isArray(recommendations)) {
      setFilteredRecommendations([]);
      return;
    }
    
    let filtered = recommendations.filter(rec => 
      selectedCategories.length === 0 || selectedCategories.includes(rec.category)
    );

    if (searchQuery) {
      filtered = filtered.filter(rec => 
        rec.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.targetResource?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort recommendations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'savings':
          return (b.impact.costSavings || 0) - (a.impact.costSavings || 0);
        case 'roi':
          return b.estimatedROI - a.estimatedROI;
        case 'effort':
          const effortOrder = { low: 1, medium: 2, high: 3 };
          return effortOrder[a.implementation.effort] - effortOrder[b.implementation.effort];
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
  }, [recommendations, selectedCategories, searchQuery, sortBy]);

  const toggleRecommendationExpansion = (id: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecommendations(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'dismissed': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  const getTotalSavings = () => {
    return filteredRecommendations
      .filter(rec => rec.status === 'pending')
      .reduce((total, rec) => total + (rec.impact.costSavings || 0), 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'dismissed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={`optimization-recommendations ${className}`}>
      <div className="recommendations-header">
        <div className="header-info">
          <h2>Optimization Recommendations</h2>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-value">{filteredRecommendations.length}</span>
              <span className="stat-label">Recommendations</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatCurrency(getTotalSavings())}</span>
              <span className="stat-label">Potential Savings</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {filteredRecommendations.filter(r => r.automatable).length}
              </span>
              <span className="stat-label">Automatable</span>
            </div>
          </div>
        </div>
      </div>

      <div className="recommendations-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.key}
              className={`category-filter ${selectedCategories.includes(category.key) ? 'active' : ''}`}
              onClick={() => onCategoryToggle(category.key)}
              style={{
                borderColor: selectedCategories.includes(category.key) ? category.color : '#d1d5db',
                color: selectedCategories.includes(category.key) ? category.color : '#6b7280'
              }}
            >
              <span className="category-icon">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
            <option value="priority">Priority</option>
            <option value="savings">Cost Savings</option>
            <option value="roi">ROI</option>
            <option value="effort">Implementation Effort</option>
          </select>
        </div>
      </div>

      <div className="recommendations-list">
        {filteredRecommendations.map(recommendation => (
          <div 
            key={recommendation.id} 
            className={`recommendation-card ${recommendation.status}`}
          >
            <div className="recommendation-header">
              <div className="recommendation-title">
                <div className="service-badge">
                  <span className="service-icon">
                    {services[recommendation.targetResource.type]?.icon || '☁️'}
                  </span>
                  <span className="service-name">{recommendation.service}</span>
                </div>
                <h3>{recommendation.title}</h3>
              </div>

              <div className="recommendation-meta">
                <div 
                  className="priority-badge"
                  style={{ backgroundColor: priorities[recommendation.priority].color }}
                >
                  {priorities[recommendation.priority].label}
                </div>
                <div 
                  className="status-badge"
                  style={{ color: getStatusColor(recommendation.status) }}
                >
                  {getStatusIcon(recommendation.status)} {recommendation.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="recommendation-summary">
              <p>{recommendation.description}</p>
              
              <div className="impact-metrics">
                {recommendation.impact.costSavings && (
                  <div className="impact-metric">
                    <span className="metric-label">Cost Savings:</span>
                    <span className="metric-value savings">
                      {formatCurrency(recommendation.impact.costSavings)}
                    </span>
                  </div>
                )}
                
                {recommendation.impact.performanceImprovement && (
                  <div className="impact-metric">
                    <span className="metric-label">Performance:</span>
                    <span className="metric-value performance">
                      +{recommendation.impact.performanceImprovement}%
                    </span>
                  </div>
                )}

                <div className="impact-metric">
                  <span className="metric-label">ROI:</span>
                  <span className="metric-value roi">
                    {(recommendation.estimatedROI || 0).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>

            {expandedRecommendations.has(recommendation.id) && (
              <div className="recommendation-details">
                <div className="details-section">
                  <h4>Implementation Details</h4>
                  <div className="implementation-info">
                    <div className="info-item">
                      <span className="info-label">Effort:</span>
                      <span className={`effort-badge ${recommendation.implementation.effort}`}>
                        {recommendation.implementation.effort}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Time Estimate:</span>
                      <span>{recommendation.implementation.timeEstimate}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Complexity:</span>
                      <span className={`complexity-badge ${recommendation.implementation.complexity}`}>
                        {recommendation.implementation.complexity}
                      </span>
                    </div>
                  </div>

                  {recommendation.implementation.prerequisites && (
                    <div className="prerequisites">
                      <h5>Prerequisites:</h5>
                      <ul>
                        {recommendation.implementation.prerequisites.map((prereq, index) => (
                          <li key={index}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="details-section">
                  <h4>Target Resource</h4>
                  <div className="resource-info">
                    <span className="resource-name">{recommendation.targetResource.name}</span>
                    <span className="resource-region">{recommendation.targetResource.region}</span>
                  </div>
                </div>

                {recommendation.tags && recommendation.tags.length > 0 && (
                  <div className="details-section">
                    <h4>Tags</h4>
                    <div className="tags-list">
                      {(recommendation.tags || []).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="recommendation-actions">
              <button
                className="expand-button"
                onClick={() => toggleRecommendationExpansion(recommendation.id)}
              >
                {expandedRecommendations.has(recommendation.id) ? 'Show Less' : 'Show More'}
              </button>

              {recommendation.status === 'pending' && (
                <>
                  {recommendation.terraformCode && (
                    <button
                      className="action-button terraform"
                      onClick={() => onRecommendationAction(recommendation.id, 'view_terraform')}
                    >
                      View Terraform
                    </button>
                  )}
                  <button
                    className="action-button apply"
                    onClick={() => onRecommendationAction(recommendation.id, 'apply')}
                  >
                    {recommendation.automatable ? 'Auto Apply' : 'Apply'}
                  </button>
                  <button
                    className="action-button dismiss"
                    onClick={() => onRecommendationAction(recommendation.id, 'dismiss')}
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="no-recommendations">
          <div className="no-recommendations-icon">🎯</div>
          <h3>No recommendations found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
};

export default OptimizationRecommendations;