# Development Environment Configuration
# Optimized for cost and development workflow

# Basic Configuration
aws_region   = "us-east-1"
environment  = "dev"
project_name = "ubiquitous"
owner        = "capital-group-dev"
cost_center  = "infrastructure-intelligence-dev"

# Networking
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
enable_nat_gateway = true
enable_vpn_gateway = false

# Kafka Configuration - Smaller for development
kafka_version        = "2.8.1"
kafka_instance_type  = "kafka.t3.small"  # Cost-optimized for dev
kafka_broker_count   = 3                  # Minimum for testing
kafka_volume_size    = 100                # Reduced storage
kafka_volume_type    = "gp3"

# Database Configuration - Development sizes
neo4j_instance_class     = "db.t3.medium"   # Cost-optimized
neo4j_storage_size       = 100              # Minimal for testing
timescale_instance_class = "db.t3.medium"   # Cost-optimized
timescale_storage_size   = 200              # Reduced for dev workload
redis_node_type          = "cache.t3.micro" # Minimal for dev
redis_num_cache_nodes    = 2                # Reduced for dev

# Lambda Configuration
lambda_runtime     = "python3.11"
lambda_timeout     = 300
lambda_memory_size = 512  # Reduced for cost

# Monitoring Configuration
cloudwatch_retention_days  = 7   # Shorter retention for dev
enable_detailed_monitoring = false # Reduced monitoring for cost

# Data Source Configuration - Limited for development
datadog_api_endpoints = [
  "/api/v1/metrics"  # Only metrics for dev testing
]

servicenow_instances = {
  dev = {
    url              = "https://dev.service-now.com"
    mid_servers      = ["mid-dev-01"]
    polling_interval = 600  # Less frequent for dev
  }
}

# Security Configuration
enable_encryption_at_rest     = true
enable_encryption_in_transit  = true
kms_key_rotation             = true

# Performance Configuration - Conservative for dev
enable_auto_scaling          = false  # Manual scaling for dev
max_throughput_per_broker    = 50     # Lower throughput

# Backup Configuration - Minimal for dev
backup_retention_days       = 7      # Shorter retention
enable_point_in_time_recovery = false # Disabled for cost

# Environment-specific tags
tags = {
  Environment = "dev"
  Project     = "ubiquitous-data-platform"
  Owner       = "capital-group-dev"
  CostCenter  = "infrastructure-intelligence-dev"
  Terraform   = "true"
  Purpose     = "development-and-testing"
}