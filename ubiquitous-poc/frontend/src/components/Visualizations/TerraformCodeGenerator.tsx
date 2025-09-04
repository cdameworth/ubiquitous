import React, { useState, useEffect } from 'react';
import './TerraformCodeGenerator.css';

interface TerraformTemplate {
  id: string;
  name: string;
  category: 'eks' | 'rds' | 'ec2' | 's3' | 'networking' | 'security';
  description: string;
  provider: string;
  resources: string[];
  estimatedCost: number;
  complexity: 'simple' | 'moderate' | 'complex';
  code: string;
  variables: TerraformVariable[];
  outputs: TerraformOutput[];
  dependencies?: string[];
}

interface TerraformVariable {
  name: string;
  type: string;
  description: string;
  default?: any;
  required: boolean;
  validation?: {
    condition: string;
    error_message: string;
  };
}

interface TerraformOutput {
  name: string;
  description: string;
  value: string;
  sensitive?: boolean;
}

interface TerraformCodeGeneratorProps {
  selectedRecommendation?: {
    id: string;
    title: string;
    targetResource: {
      type: string;
      name: string;
      region: string;
    };
  };
  onCodeGenerate: (templateId: string, variables: Record<string, any>) => void;
  onCodeDownload: (code: string, filename: string) => void;
  className?: string;
}

const TerraformCodeGenerator: React.FC<TerraformCodeGeneratorProps> = ({
  selectedRecommendation,
  onCodeGenerate,
  onCodeDownload,
  className = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TerraformTemplate | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'templates' | 'variables' | 'code' | 'preview'>('templates');
  const [isGenerating, setIsGenerating] = useState(false);

  const templates: TerraformTemplate[] = [
    {
      id: 'eks-cluster-optimization',
      name: 'EKS Cluster Right-sizing',
      category: 'eks',
      description: 'Optimize EKS node group instance types and scaling configuration',
      provider: 'aws',
      resources: ['aws_eks_node_group', 'aws_autoscaling_group'],
      estimatedCost: 2400,
      complexity: 'moderate',
      code: `resource "aws_eks_node_group" "optimized" {
  cluster_name    = var.cluster_name
  node_group_name = var.node_group_name
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.subnet_ids

  instance_types = var.instance_types
  capacity_type  = var.capacity_type

  scaling_config {
    desired_size = var.desired_capacity
    max_size     = var.max_capacity
    min_size     = var.min_capacity
  }

  update_config {
    max_unavailable_percentage = 25
  }

  launch_template {
    name    = aws_launch_template.optimized.name
    version = aws_launch_template.optimized.latest_version
  }

  tags = var.tags
}

resource "aws_launch_template" "optimized" {
  name = "\${var.cluster_name}-\${var.node_group_name}-optimized"

  instance_type = var.instance_types[0]
  
  vpc_security_group_ids = var.security_group_ids

  user_data = base64encode(templatefile("\${path.module}/userdata.sh", {
    cluster_name = var.cluster_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = var.tags
  }
}`,
      variables: [
        { name: 'cluster_name', type: 'string', description: 'EKS cluster name', required: true },
        { name: 'node_group_name', type: 'string', description: 'Node group name', required: true },
        { name: 'node_role_arn', type: 'string', description: 'IAM role ARN for nodes', required: true },
        { name: 'subnet_ids', type: 'list(string)', description: 'Subnet IDs for node group', required: true },
        { name: 'instance_types', type: 'list(string)', description: 'EC2 instance types', default: ['t3.medium'], required: false },
        { name: 'capacity_type', type: 'string', description: 'Capacity type (ON_DEMAND or SPOT)', default: 'ON_DEMAND', required: false },
        { name: 'desired_capacity', type: 'number', description: 'Desired number of nodes', default: 2, required: false },
        { name: 'min_capacity', type: 'number', description: 'Minimum number of nodes', default: 1, required: false },
        { name: 'max_capacity', type: 'number', description: 'Maximum number of nodes', default: 4, required: false },
        { name: 'security_group_ids', type: 'list(string)', description: 'Security group IDs', required: true },
        { name: 'tags', type: 'map(string)', description: 'Resource tags', default: {}, required: false }
      ],
      outputs: [
        { name: 'node_group_arn', description: 'ARN of the EKS node group', value: 'aws_eks_node_group.optimized.arn' },
        { name: 'node_group_status', description: 'Status of the EKS node group', value: 'aws_eks_node_group.optimized.status' }
      ]
    },
    {
      id: 'rds-instance-optimization',
      name: 'RDS Instance Right-sizing',
      category: 'rds',
      description: 'Optimize RDS instance class and storage configuration',
      provider: 'aws',
      resources: ['aws_db_instance', 'aws_db_parameter_group'],
      estimatedCost: 1800,
      complexity: 'simple',
      code: `resource "aws_db_instance" "optimized" {
  identifier = var.db_identifier

  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = var.storage_encrypted

  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  vpc_security_group_ids = var.security_group_ids
  db_subnet_group_name   = var.db_subnet_group_name

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_role_arn

  performance_insights_enabled = var.performance_insights_enabled

  parameter_group_name = aws_db_parameter_group.optimized.name

  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "\${var.db_identifier}-final-snapshot"

  tags = var.tags
}

resource "aws_db_parameter_group" "optimized" {
  family = var.parameter_group_family
  name   = "\${var.db_identifier}-optimized"

  dynamic "parameter" {
    for_each = var.db_parameters
    content {
      name  = parameter.value.name
      value = parameter.value.value
    }
  }

  tags = var.tags
}`,
      variables: [
        { name: 'db_identifier', type: 'string', description: 'Database identifier', required: true },
        { name: 'engine', type: 'string', description: 'Database engine', default: 'postgres', required: false },
        { name: 'engine_version', type: 'string', description: 'Engine version', required: true },
        { name: 'instance_class', type: 'string', description: 'Instance class', default: 'db.t3.micro', required: false },
        { name: 'allocated_storage', type: 'number', description: 'Initial storage (GB)', default: 20, required: false },
        { name: 'max_allocated_storage', type: 'number', description: 'Maximum storage (GB)', default: 100, required: false },
        { name: 'storage_type', type: 'string', description: 'Storage type', default: 'gp2', required: false },
        { name: 'storage_encrypted', type: 'bool', description: 'Enable encryption', default: true, required: false },
        { name: 'database_name', type: 'string', description: 'Initial database name', required: false },
        { name: 'master_username', type: 'string', description: 'Master username', required: true },
        { name: 'master_password', type: 'string', description: 'Master password', required: true },
        { name: 'security_group_ids', type: 'list(string)', description: 'Security group IDs', required: true },
        { name: 'db_subnet_group_name', type: 'string', description: 'DB subnet group name', required: true },
        { name: 'backup_retention_period', type: 'number', description: 'Backup retention (days)', default: 7, required: false },
        { name: 'backup_window', type: 'string', description: 'Backup window', default: '03:00-04:00', required: false },
        { name: 'maintenance_window', type: 'string', description: 'Maintenance window', default: 'sun:04:00-sun:05:00', required: false },
        { name: 'monitoring_interval', type: 'number', description: 'Enhanced monitoring interval', default: 60, required: false },
        { name: 'monitoring_role_arn', type: 'string', description: 'Monitoring role ARN', required: false },
        { name: 'performance_insights_enabled', type: 'bool', description: 'Enable Performance Insights', default: false, required: false },
        { name: 'parameter_group_family', type: 'string', description: 'Parameter group family', required: true },
        { name: 'db_parameters', type: 'list(object({name=string,value=string}))', description: 'Database parameters', default: [], required: false },
        { name: 'skip_final_snapshot', type: 'bool', description: 'Skip final snapshot', default: false, required: false },
        { name: 'tags', type: 'map(string)', description: 'Resource tags', default: {}, required: false }
      ],
      outputs: [
        { name: 'db_instance_endpoint', description: 'Database endpoint', value: 'aws_db_instance.optimized.endpoint' },
        { name: 'db_instance_arn', description: 'Database ARN', value: 'aws_db_instance.optimized.arn' },
        { name: 'db_instance_id', description: 'Database ID', value: 'aws_db_instance.optimized.id' }
      ]
    }
  ];

  const categories = [
    { key: 'eks', label: 'EKS', icon: '⚙️' },
    { key: 'rds', label: 'RDS', icon: '🗄️' },
    { key: 'ec2', label: 'EC2', icon: '🖥️' },
    { key: 's3', label: 'S3', icon: '📦' },
    { key: 'networking', label: 'Network', icon: '🌐' },
    { key: 'security', label: 'Security', icon: '🔒' }
  ];

  useEffect(() => {
    if (selectedRecommendation && selectedRecommendation.targetResource.type) {
      const matchingTemplate = templates.find(
        t => t.category === selectedRecommendation.targetResource.type
      );
      if (matchingTemplate) {
        setSelectedTemplate(matchingTemplate);
        setActiveTab('variables');
        initializeVariableValues(matchingTemplate);
      }
    }
  }, [selectedRecommendation]);

  const initializeVariableValues = (template: TerraformTemplate) => {
    const initialValues: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (variable.default !== undefined) {
        initialValues[variable.name] = variable.default;
      } else if (selectedRecommendation) {
        // Auto-populate some values based on the recommendation
        switch (variable.name) {
          case 'cluster_name':
          case 'db_identifier':
            initialValues[variable.name] = selectedRecommendation.targetResource.name;
            break;
          case 'node_group_name':
            initialValues[variable.name] = `${selectedRecommendation.targetResource.name}-optimized`;
            break;
        }
      }
    });
    setVariableValues(initialValues);
  };

  const handleVariableChange = (name: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCode = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    setActiveTab('code');
    
    // Simulate code generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let code = selectedTemplate.code;
    
    // Replace variable references with actual values
    Object.entries(variableValues).forEach(([name, value]) => {
      if (value !== undefined && value !== '') {
        const stringValue = typeof value === 'string' ? `"${value}"` : String(value);
        code = code.replace(new RegExp(`var\\.${name}`, 'g'), stringValue);
      }
    });
    
    // Add variable definitions
    const variablesCode = selectedTemplate.variables
      .filter(v => variableValues[v.name] !== undefined)
      .map(v => {
        const value = variableValues[v.name];
        const defaultValue = typeof value === 'string' ? `"${value}"` : String(value);
        
        return `variable "${v.name}" {
  description = "${v.description}"
  type        = ${v.type}
  default     = ${defaultValue}
}`;
      }).join('\n\n');
    
    // Add outputs
    const outputsCode = selectedTemplate.outputs.map(o => 
      `output "${o.name}" {
  description = "${o.description}"
  value       = ${o.value}${o.sensitive ? '\n  sensitive   = true' : ''}
}`
    ).join('\n\n');
    
    const fullCode = `# Generated Terraform configuration
# Template: ${selectedTemplate.name}
# Generated: ${new Date().toISOString()}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
${variablesCode}

# Resources
${code}

# Outputs
${outputsCode}`;
    
    setGeneratedCode(fullCode);
    setIsGenerating(false);
    
    onCodeGenerate(selectedTemplate.id, variableValues);
  };

  const handleDownload = () => {
    if (!selectedTemplate || !generatedCode) return;
    
    const filename = `${selectedTemplate.id.replace(/-/g, '_')}.tf`;
    onCodeDownload(generatedCode, filename);
  };

  const copyToClipboard = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'complex': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderVariableInput = (variable: TerraformVariable) => {
    const value = variableValues[variable.name] ?? '';
    
    switch (variable.type) {
      case 'bool':
        return (
          <select
            value={value.toString()}
            onChange={(e) => handleVariableChange(variable.name, e.target.value === 'true')}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleVariableChange(variable.name, parseInt(e.target.value))}
            placeholder={variable.default?.toString()}
          />
        );
      
      default:
        if (variable.type.startsWith('list(')) {
          return (
            <textarea
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={(e) => handleVariableChange(variable.name, e.target.value.split('\n').filter(Boolean))}
              placeholder="One item per line"
              rows={3}
            />
          );
        } else if (variable.type.startsWith('map(')) {
          return (
            <textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleVariableChange(variable.name, parsed);
                } catch {
                  handleVariableChange(variable.name, e.target.value);
                }
              }}
              placeholder='{"key": "value"}'
              rows={3}
            />
          );
        } else {
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
              placeholder={variable.default?.toString()}
            />
          );
        }
    }
  };

  return (
    <div className={`terraform-code-generator ${className}`}>
      <div className="generator-header">
        <h2>Terraform Code Generator</h2>
        {selectedRecommendation && (
          <div className="selected-recommendation">
            <span>Generating for: <strong>{selectedRecommendation.title}</strong></span>
          </div>
        )}
      </div>

      <div className="generator-tabs">
        <button
          className={`generator-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`generator-tab ${activeTab === 'variables' ? 'active' : ''}`}
          onClick={() => setActiveTab('variables')}
          disabled={!selectedTemplate}
        >
          Variables
        </button>
        <button
          className={`generator-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
          disabled={!selectedTemplate}
        >
          Generated Code
        </button>
        <button
          className={`generator-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          disabled={!generatedCode}
        >
          Preview
        </button>
      </div>

      <div className="generator-content">
        {activeTab === 'templates' && (
          <div className="templates-grid">
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category.key}
                  className="category-button"
                  onClick={() => {
                    // Filter templates by category (implementation omitted for brevity)
                  }}
                >
                  <span className="category-icon">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
            
            <div className="templates-list">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setActiveTab('variables');
                    initializeVariableValues(template);
                  }}
                >
                  <div className="template-header">
                    <h3>{template.name}</h3>
                    <div className="template-meta">
                      <span 
                        className="complexity-badge"
                        style={{ backgroundColor: getComplexityColor(template.complexity) }}
                      >
                        {template.complexity}
                      </span>
                      <span className="cost-estimate">
                        ${(template.estimatedCost / 1000).toFixed(1)}K/mo
                      </span>
                    </div>
                  </div>
                  <p className="template-description">{template.description}</p>
                  <div className="template-resources">
                    <strong>Resources:</strong> {template.resources.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'variables' && selectedTemplate && (
          <div className="variables-form">
            <div className="form-header">
              <h3>Configure Variables</h3>
              <p>Set values for the Terraform variables used in this template.</p>
            </div>
            
            <div className="variables-list">
              {selectedTemplate.variables.map(variable => (
                <div key={variable.name} className="variable-item">
                  <div className="variable-header">
                    <label className="variable-label">
                      {variable.name}
                      {variable.required && <span className="required">*</span>}
                    </label>
                    <span className="variable-type">{variable.type}</span>
                  </div>
                  <p className="variable-description">{variable.description}</p>
                  <div className="variable-input">
                    {renderVariableInput(variable)}
                  </div>
                  {variable.validation && (
                    <div className="variable-validation">
                      <small>Validation: {variable.validation.condition}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button
                className="generate-button"
                onClick={generateCode}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Terraform Code'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="code-viewer">
            <div className="code-header">
              <h3>Generated Terraform Code</h3>
              <div className="code-actions">
                <button onClick={copyToClipboard} className="action-button">
                  Copy to Clipboard
                </button>
                <button onClick={handleDownload} className="action-button primary">
                  Download .tf File
                </button>
              </div>
            </div>
            
            {isGenerating ? (
              <div className="code-loading">
                <div className="loading-spinner"></div>
                <p>Generating Terraform code...</p>
              </div>
            ) : generatedCode ? (
              <pre className="code-content">
                <code>{generatedCode}</code>
              </pre>
            ) : (
              <div className="code-empty">
                <p>No code generated yet. Configure variables and click "Generate Terraform Code".</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && generatedCode && (
          <div className="code-preview">
            <div className="preview-header">
              <h3>Deployment Preview</h3>
              <p>Review the resources that will be created by this Terraform configuration.</p>
            </div>
            
            <div className="preview-summary">
              <div className="summary-item">
                <span className="summary-label">Resources:</span>
                <span className="summary-value">{selectedTemplate?.resources.length || 0}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Estimated Cost:</span>
                <span className="summary-value">
                  ${((selectedTemplate?.estimatedCost || 0) / 1000).toFixed(1)}K/month
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Provider:</span>
                <span className="summary-value">{selectedTemplate?.provider}</span>
              </div>
            </div>
            
            <div className="resource-list">
              <h4>Resources to be created:</h4>
              <ul>
                {selectedTemplate?.resources.map(resource => (
                  <li key={resource}>{resource}</li>
                ))}
              </ul>
            </div>
            
            <div className="deployment-commands">
              <h4>Deployment Commands:</h4>
              <pre className="commands">
{`terraform init
terraform plan
terraform apply`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerraformCodeGenerator;