# Ubiquitous Data Ingestion Platform - Terraform Infrastructure

Enterprise-scale AWS infrastructure for the Ubiquitous platform's data ingestion layer, supporting 8 data sources with Kafka streaming architecture capable of processing 1M+ events per second.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Data Sources (8)                                           │
│  ├── DataDog API          ├── OpenTelemetry Collectors     │
│  ├── AWS CloudWatch       ├── ServiceNow REST API         │  
│  ├── Terraform State      ├── GitHub Webhooks             │
│  ├── Flexera API         └── Tanium Endpoints             │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────▼─────────┐
            │   API Gateway     │  ← External webhooks
            └─────────┬─────────┘
                      │
        ┌─────────────▼─────────────┐
        │    Lambda Processors     │  ← 8 data source processors
        │  (Auto-scaling)          │    Each optimized per source
        └─────────────┬─────────────┘
                      │
           ┌──────────▼──────────┐
           │   Kafka Streaming   │  ← MSK cluster with 6 brokers
           │   (365M+ events/day) │    Fault-tolerant streaming bus
           └──────────┬──────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼───┐      ┌─────▼─────┐      ┌────▼────┐
│ Neo4j │      │TimescaleDB│      │  Redis  │
│Graph  │      │Time-Series│      │ Cache   │
│10M+   │      │90d Metrics│      │Sessions │
│Nodes  │      │           │      │         │
└───────┘      └───────────┘      └─────────┘
```

## 📦 Module Structure

| Module | Purpose | Key Resources |
|--------|---------|---------------|
| **vpc** | Network foundation | VPC, Subnets, NAT Gateway, VPC Endpoints |
| **kafka** | Streaming platform | MSK Cluster, KMS encryption, CloudWatch monitoring |
| **lambda** | Data processing | 8 Lambda functions, IAM roles, Event source mappings |
| **data-stores** | Storage layer | Neo4j (RDS), TimescaleDB (RDS), Redis (ElastiCache), S3 |
| **monitoring** | Observability | CloudWatch dashboards, X-Ray tracing, SNS alerts |

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install required tools
brew install terraform aws-cli
aws configure  # Configure AWS credentials

# Verify access
aws sts get-caller-identity
```

### 2. Environment Setup
```bash
cd terraform/

# Initialize Terraform
terraform init

# Select environment and apply
terraform workspace new dev
terraform plan -var-file=environments/dev.tfvars
terraform apply -var-file=environments/dev.tfvars
```

### 3. Validation
```bash
# Check Kafka cluster
aws kafka describe-cluster --cluster-arn $(terraform output -raw kafka_cluster_arn)

# Test Lambda functions
aws lambda list-functions --function-version ALL | grep ubiquitous

# Verify databases
aws rds describe-db-instances | grep ubiquitous
```

## 🎛️ Environment Configurations

### Development (`dev.tfvars`)
- **Cost-optimized**: t3.medium instances, minimal storage
- **Kafka**: 3 brokers (kafka.t3.small), 100GB storage each
- **Databases**: Neo4j & TimescaleDB (db.t3.medium), Redis (cache.t3.micro)
- **Monitoring**: Basic CloudWatch, 7-day retention
- **Estimated cost**: $1,200-2,500/month (per terraform plan output)

### Staging (`staging.tfvars`)
- **Production-like**: r5.large instances, expanded storage
- **Kafka**: 3 brokers (kafka.m5.large), 500GB storage each
- **Databases**: Neo4j & TimescaleDB (db.r5.large), Redis (cache.r5.large)
- **Monitoring**: Full monitoring, 30-day retention
- **Estimated cost**: $3,500-5,000/month

### Production (`prod.tfvars`)
- **Enterprise-scale**: r5.4xlarge instances, high-performance storage
- **Kafka**: 6 brokers (kafka.m5.2xlarge), 2TB storage each
- **Databases**: Neo4j & TimescaleDB (db.r5.4xlarge), Redis cluster (cache.r5.2xlarge)
- **Monitoring**: Comprehensive observability, 90-day retention
- **Estimated cost**: $12,000-18,000/month

## 📊 Data Source Processing

### Critical Priority (Phase 1)
| Source | Processor | Memory | Timeout | Key Capabilities |
|--------|-----------|---------|---------|------------------|
| **DataDog** | `datadog_processor.py` | 1GB | 5min | Metrics, events, infrastructure discovery |
| **CloudWatch** | `cloudwatch_processor.py` | 512MB | 3min | AWS metrics, logs, alarms |
| **OpenTelemetry** | `opentelemetry_processor.py` | 2GB | 10min | Traces, metrics, service topology |
| **ServiceNow** | `servicenow_processor.py` | 1GB | 5min | CMDB, incidents, change records |

### High Priority (Phase 2)
| Source | Processor | Memory | Timeout | Key Capabilities |
|--------|-----------|---------|---------|------------------|
| **Terraform** | `terraform_processor.py` | 512MB | 2min | State files, resource tracking |
| **GitHub** | `github_processor.py` | 256MB | 1min | Repository events, deployments |

### Medium Priority (Phase 3)  
| Source | Processor | Memory | Timeout | Key Capabilities |
|--------|-----------|---------|---------|------------------|
| **Flexera** | `flexera_processor.py` | 512MB | 3min | License compliance, cost optimization |
| **Tanium** | `tanium_processor.py` | 1GB | 5min | Endpoint security, compliance |

## 🔧 Operational Commands

### Infrastructure Management
```bash
# Deploy to specific environment
terraform workspace select prod
terraform apply -var-file=environments/prod.tfvars

# Scale Kafka cluster
terraform apply -var="kafka_broker_count=9" -var-file=environments/prod.tfvars

# Update Lambda memory
terraform apply -var="lambda_memory_size=2048" -var-file=environments/prod.tfvars
```

### Monitoring & Debugging
```bash
# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name $(terraform output -json | jq -r '.dashboard_urls.value.platform_overview')

# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/prod-ubiquitous"

# Monitor Kafka metrics  
aws kafka list-clusters --cluster-name-filter "ubiquitous"
```

### Data Pipeline Testing
```bash
# Test data source processors
aws lambda invoke \
  --function-name $(terraform output -json | jq -r '.lambda_function_names.value.datadog') \
  --payload '{"test": "data"}' \
  response.json

# Check Kafka topics
kafka-topics.sh --bootstrap-server $(terraform output -raw kafka_bootstrap_brokers_tls) --list
```

## 📈 Performance Specifications

### Throughput Targets
- **Kafka Streaming**: 1,000,000 events/second sustained
- **Lambda Processing**: 50,000 concurrent executions  
- **Database Storage**: 10M+ nodes, 90-day metrics retention
- **Response Time**: <2 seconds for queries, <5 seconds for transformations

### Capacity Planning
- **Small Deployment**: Supports 100K events/day, 10 organizations
- **Medium Deployment**: Supports 10M events/day, 100 organizations  
- **Large Deployment**: Supports 365M+ events/day, 1000+ organizations
- **Enterprise**: Unlimited scale with auto-scaling

## 🔐 Security Features

### Encryption
- **In Transit**: TLS 1.2 for all services, mTLS for Kafka
- **At Rest**: KMS encryption for databases, S3, Kafka topics
- **Key Management**: Automatic key rotation, separate keys per service

### Network Security
- **VPC Isolation**: All resources in private subnets
- **Security Groups**: Principle of least privilege
- **VPC Endpoints**: Private connectivity to AWS services
- **NAT Gateways**: Controlled outbound access

### Access Control
- **IAM Roles**: Service-specific roles with minimal permissions
- **Resource Policies**: Fine-grained access control
- **Secret Management**: AWS Secrets Manager for API keys
- **Audit Trail**: CloudTrail logging for all API calls

## 💰 Cost Optimization

### Cost-Saving Features
- **Spot Instances**: Available for non-critical Lambda functions
- **Reserved Capacity**: RDS and ElastiCache reserved instances
- **S3 Lifecycle**: Automatic transition to cheaper storage classes
- **Auto-Scaling**: Scale down during low usage periods

### Monitoring Costs
- **Cost Alarms**: Alerts when spending exceeds thresholds
- **Resource Tagging**: Detailed cost allocation by team/project
- **Right-Sizing**: CloudWatch recommendations for optimization

## 🔄 Deployment Pipeline

### Recommended Workflow
1. **Plan**: `terraform plan -var-file=environments/{env}.tfvars`
2. **Validate**: Run Checkov security scanning  
3. **Apply**: `terraform apply -var-file=environments/{env}.tfvars`
4. **Test**: Verify all services are healthy
5. **Monitor**: Check CloudWatch dashboards

### Multi-Environment Strategy
```bash
# Development workflow
terraform workspace select dev
terraform apply -var-file=environments/dev.tfvars

# Promote to staging
terraform workspace select staging  
terraform apply -var-file=environments/staging.tfvars

# Production deployment
terraform workspace select prod
terraform apply -var-file=environments/prod.tfvars
```

## 📚 Additional Resources

- **Architecture Diagrams**: `../generated-diagrams/` 
- **Data Source Analysis**: `../ubiquitous-data-source-analysis.md`
- **Business Case**: `../ubiquitous-business-case.md`
- **Kafka Topics**: See `../claudedocs/transformation-pipeline-specs.md`
- **Lambda Code**: `modules/lambda/lambda-code/`

## 🆘 Troubleshooting

### Common Issues

**Kafka Cluster Creation Timeout**
```bash
# Check subnet routing and security groups
terraform show | grep -A 10 "aws_msk_cluster"
aws kafka describe-cluster --cluster-arn <cluster-arn>
```

**Lambda VPC Connectivity Issues**
```bash
# Verify NAT gateway and route tables
aws ec2 describe-nat-gateways
aws ec2 describe-route-tables
```

**Database Connection Failures**
```bash
# Check security groups and subnet groups
aws rds describe-db-instances --db-instance-identifier <instance-id>
aws ec2 describe-security-groups --group-ids <sg-id>
```

### Performance Monitoring
```bash
# Check Kafka broker metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Kafka \
  --metric-name BytesInPerSec \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 🎯 Business Value

This infrastructure enables the **$23.2M annual cost savings** demonstrated in the Ubiquitous business case through:

- **Real-time Infrastructure Intelligence**: 10M+ node topology analysis
- **Predictive Cost Optimization**: ML-driven recommendations  
- **Security Threat Detection**: Real-time vulnerability correlation
- **Compliance Automation**: Continuous drift detection and remediation

**ROI**: 18-month payback period with $41.6M total annual benefits.