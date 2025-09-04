# Production Environment Configuration
# Enterprise-scale configuration for Capital Group production workloads

# Basic Configuration
aws_region   = "us-east-1"
environment  = "prod"
project_name = "ubiquitous"
owner        = "capital-group"
cost_center  = "infrastructure-intelligence"

# Networking - Production VPC
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
enable_nat_gateway = true
enable_vpn_gateway = true  # VPN access for production

# Kafka Configuration - High-throughput production
kafka_version        = "2.8.1"
kafka_instance_type  = "kafka.m5.2xlarge"  # High-performance instances
kafka_broker_count   = 6                    # Increased for redundancy
kafka_volume_size    = 2000                 # Large storage for retention
kafka_volume_type    = "gp3"

# Database Configuration - Production scale
neo4j_instance_class     = "db.r5.4xlarge"   # High-performance for 10M+ nodes
neo4j_storage_size       = 4000               # Large storage for graph data
timescale_instance_class = "db.r5.4xlarge"   # High-performance for metrics
timescale_storage_size   = 8000               # Large storage for 90-day retention
redis_node_type          = "cache.r6g.2xlarge" # High-performance caching
redis_num_cache_nodes    = 6                   # Maximum redundancy

# Lambda Configuration - Production performance
lambda_runtime     = "python3.11"
lambda_timeout     = 600      # Longer timeout for complex processing
lambda_memory_size = 2048     # High memory for performance

# Monitoring Configuration - Full observability
cloudwatch_retention_days  = 90    # Extended retention for compliance
enable_detailed_monitoring = true  # Full monitoring suite

# Data Source Configuration - Complete set for production
datadog_api_endpoints = [
  "/api/v1/metrics",
  "/api/v1/events",
  "/api/v1/logs",
  "/api/v1/traces"  # Full endpoint suite
]

servicenow_instances = {
  prod_primary = {
    url              = "https://prod-primary.service-now.com"
    mid_servers      = ["mid-prod-01", "mid-prod-02", "mid-prod-03"]
    polling_interval = 120  # Frequent polling for production
  }
  prod_secondary = {
    url              = "https://prod-secondary.service-now.com"
    mid_servers      = ["mid-prod-04", "mid-prod-05"]
    polling_interval = 300  # Secondary instance with standard polling
  }
}

# Security Configuration - Maximum security
enable_encryption_at_rest     = true
enable_encryption_in_transit  = true
kms_key_rotation             = true

# Performance Configuration - Maximum throughput
enable_auto_scaling          = true   # Full auto-scaling
max_throughput_per_broker    = 250    # Maximum throughput per broker

# Backup Configuration - Enterprise-grade
backup_retention_days       = 35     # Extended retention for compliance
enable_point_in_time_recovery = true # Full recovery capability

# Environment-specific tags for production compliance
tags = {
  Environment         = "prod"
  Project            = "ubiquitous-data-platform"
  Owner              = "capital-group"
  CostCenter         = "infrastructure-intelligence"
  Terraform          = "true"
  Purpose            = "production-workload"
  Compliance         = "SOX-compliant"
  DataClassification = "confidential"
  BackupRequired     = "true"
  MonitoringLevel    = "comprehensive"
  SecurityLevel      = "high"
  BusinessUnit       = "technology"
  Application        = "infrastructure-intelligence"
  SupportLevel       = "24x7"
}