# Data Stores Module Variables

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "db_subnet_group_name" {
  description = "Name of the database subnet group"
  type        = string
}

variable "elasticache_subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  type        = string
}

# Neo4j Configuration
variable "neo4j_instance_class" {
  description = "Instance class for Neo4j database"
  type        = string
  default     = "db.r5.xlarge"
  validation {
    condition = contains([
      "db.t3.medium", "db.t3.large", "db.t3.xlarge",
      "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge", 
      "db.r5.4xlarge", "db.r6g.large", "db.r6g.xlarge"
    ], var.neo4j_instance_class)
    error_message = "Invalid Neo4j instance class."
  }
}

variable "neo4j_storage_size" {
  description = "Storage size for Neo4j database (GB)"
  type        = number
  default     = 1000
  validation {
    condition     = var.neo4j_storage_size >= 100 && var.neo4j_storage_size <= 65536
    error_message = "Neo4j storage size must be between 100 and 65536 GB."
  }
}

# TimescaleDB Configuration
variable "timescale_instance_class" {
  description = "Instance class for TimescaleDB"
  type        = string
  default     = "db.r5.xlarge"
  validation {
    condition = contains([
      "db.t3.medium", "db.t3.large", "db.t3.xlarge",
      "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge",
      "db.r5.4xlarge", "db.r6g.large", "db.r6g.xlarge"
    ], var.timescale_instance_class)
    error_message = "Invalid TimescaleDB instance class."
  }
}

variable "timescale_storage_size" {
  description = "Storage size for TimescaleDB (GB)"
  type        = number
  default     = 2000
  validation {
    condition     = var.timescale_storage_size >= 100 && var.timescale_storage_size <= 65536
    error_message = "TimescaleDB storage size must be between 100 and 65536 GB."
  }
}

# Redis Configuration
variable "redis_node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.r6g.large"
  validation {
    condition = contains([
      "cache.t3.micro", "cache.t3.small", "cache.t3.medium",
      "cache.r6g.large", "cache.r6g.xlarge", "cache.r6g.2xlarge"
    ], var.redis_node_type)
    error_message = "Invalid Redis node type."
  }
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 3
  validation {
    condition     = var.redis_num_cache_nodes >= 2 && var.redis_num_cache_nodes <= 6
    error_message = "Redis cache nodes must be between 2 and 6."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}