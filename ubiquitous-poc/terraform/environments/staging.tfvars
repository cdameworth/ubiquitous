# Staging Environment Configuration
# Production-like for testing with moderate scale

# Basic Configuration
aws_region   = "us-east-1"
environment  = "staging"
project_name = "ubiquitous"
owner        = "capital-group-staging"
cost_center  = "infrastructure-intelligence-staging"

# Networking
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
enable_nat_gateway = true
enable_vpn_gateway = false

# Kafka Configuration - Moderate scale for staging
kafka_version        = "2.8.1"
kafka_instance_type  = "kafka.m5.large"  # Production-like instance
kafka_broker_count   = 3                  # Standard configuration
kafka_volume_size    = 500                # Moderate storage
kafka_volume_type    = "gp3"

# Database Configuration - Production-like performance
neo4j_instance_class     = "db.r5.large"    # Balanced price/performance
neo4j_storage_size       = 500               # Moderate storage
timescale_instance_class = "db.r5.large"    # Balanced price/performance  
timescale_storage_size   = 1000              # Moderate storage
redis_node_type          = "cache.r6g.large" # Production-like
redis_num_cache_nodes    = 3                 # Standard configuration

# Lambda Configuration
lambda_runtime     = "python3.11"
lambda_timeout     = 300
lambda_memory_size = 1024  # Production-like memory

# Monitoring Configuration
cloudwatch_retention_days  = 30   # Standard retention
enable_detailed_monitoring = true # Full monitoring for staging

# Data Source Configuration - Full set for staging
datadog_api_endpoints = [
  "/api/v1/metrics",
  "/api/v1/events",
  "/api/v1/logs"  # Most endpoints for testing
]

servicenow_instances = {
  staging = {
    url              = "https://staging.service-now.com"
    mid_servers      = ["mid-staging-01", "mid-staging-02"]
    polling_interval = 300  # Standard interval
  }
}

# Security Configuration
enable_encryption_at_rest     = true
enable_encryption_in_transit  = true
kms_key_rotation             = true

# Performance Configuration - Moderate for staging
enable_auto_scaling          = true   # Test auto-scaling
max_throughput_per_broker    = 150    # Moderate throughput

# Backup Configuration - Production-like
backup_retention_days       = 21     # Moderate retention
enable_point_in_time_recovery = true # Test recovery procedures

# Environment-specific tags
tags = {
  Environment = "staging"
  Project     = "ubiquitous-data-platform"
  Owner       = "capital-group-staging"
  CostCenter  = "infrastructure-intelligence-staging"
  Terraform   = "true"
  Purpose     = "staging-validation-testing"
  AutoShutdown = "true"  # Can be shut down after hours
}