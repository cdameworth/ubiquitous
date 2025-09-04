# Variables for Ubiquitous Data Ingestion Platform

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ubiquitous"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "capital-group"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "infrastructure-intelligence"
}

# Networking Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN gateway"
  type        = bool
  default     = false
}

# Kafka Configuration
variable "kafka_version" {
  description = "Kafka version for MSK cluster"
  type        = string
  default     = "2.8.1"
}

variable "kafka_instance_type" {
  description = "Instance type for Kafka brokers"
  type        = string
  default     = "kafka.m5.large"
  validation {
    condition = contains([
      "kafka.t3.small", "kafka.m5.large", "kafka.m5.xlarge", 
      "kafka.m5.2xlarge", "kafka.m5.4xlarge", "kafka.m5.8xlarge"
    ], var.kafka_instance_type)
    error_message = "Invalid Kafka instance type."
  }
}

variable "kafka_broker_count" {
  description = "Number of Kafka brokers"
  type        = number
  default     = 3
  validation {
    condition     = var.kafka_broker_count >= 3 && var.kafka_broker_count <= 15
    error_message = "Kafka broker count must be between 3 and 15."
  }
}

variable "kafka_volume_size" {
  description = "Size of EBS volume for each Kafka broker (GB)"
  type        = number
  default     = 1000
}

variable "kafka_volume_type" {
  description = "EBS volume type for Kafka brokers"
  type        = string
  default     = "gp3"
}

# Database Configuration
variable "neo4j_instance_class" {
  description = "Instance class for Neo4j database"
  type        = string
  default     = "db.r5.xlarge"
}

variable "neo4j_storage_size" {
  description = "Storage size for Neo4j database (GB)"
  type        = number
  default     = 1000
}

variable "timescale_instance_class" {
  description = "Instance class for TimescaleDB"
  type        = string
  default     = "db.r5.xlarge"
}

variable "timescale_storage_size" {
  description = "Storage size for TimescaleDB (GB)"
  type        = number
  default     = 2000
}

variable "redis_node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 3
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Default timeout for Lambda functions (seconds)"
  type        = number
  default     = 300
}

variable "lambda_memory_size" {
  description = "Default memory size for Lambda functions (MB)"
  type        = number
  default     = 1024
}

# Monitoring Configuration
variable "cloudwatch_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for resources"
  type        = bool
  default     = true
}

# Data Source API Configuration
variable "datadog_api_endpoints" {
  description = "DataDog API endpoints to monitor"
  type        = list(string)
  default     = [
    "/api/v1/metrics",
    "/api/v1/events", 
    "/api/v1/logs",
    "/api/v1/traces"
  ]
}

variable "servicenow_instances" {
  description = "ServiceNow instance configurations"
  type = map(object({
    url           = string
    mid_servers   = list(string)
    polling_interval = number
  }))
  default = {
    prod = {
      url              = "https://prod.service-now.com"
      mid_servers      = ["mid-01", "mid-02"]
      polling_interval = 300
    }
  }
}

# Security Configuration
variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest for all data stores"
  type        = bool
  default     = true
}

variable "enable_encryption_in_transit" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "kms_key_rotation" {
  description = "Enable automatic KMS key rotation"
  type        = bool
  default     = true
}

# Performance Configuration
variable "enable_auto_scaling" {
  description = "Enable auto-scaling for applicable services"
  type        = bool
  default     = true
}

variable "max_throughput_per_broker" {
  description = "Maximum throughput per Kafka broker (MB/s)"
  type        = number
  default     = 250
}

# Backup and Disaster Recovery
variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 35
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for databases"
  type        = bool
  default     = true
}

# Common Tags
variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project = "ubiquitous-data-platform"
    Owner   = "capital-group"
    Terraform = "true"
  }
}