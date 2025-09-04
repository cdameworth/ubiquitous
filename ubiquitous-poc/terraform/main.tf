# Ubiquitous Data Ingestion Platform - Main Configuration
# Terraform infrastructure for enterprise-scale data processing
# Supporting 8 data sources with Kafka streaming architecture

# Provider configuration is in providers.tf

# Local values for managing dependencies
locals {
  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Terraform   = "true"
    }
  )
}

# MSK Configuration for high-throughput processing (defined early for module dependency)
resource "aws_msk_configuration" "ubiquitous_config" {
  kafka_versions = [var.kafka_version]
  name          = "${var.project_name}-${var.environment}-config"
  description   = "Configuration for Ubiquitous data ingestion platform"

  server_properties = <<PROPERTIES
# High-throughput configuration for enterprise workloads
auto.create.topics.enable=false
default.replication.factor=3
min.insync.replicas=2
num.partitions=24

# Performance optimizations
message.max.bytes=1048576
replica.fetch.max.bytes=1048576
group.initial.rebalance.delay.ms=3000

# Log settings for data retention
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000

# Memory and network tuning
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
num.network.threads=8
num.io.threads=16
PROPERTIES
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"

  vpc_name            = "${var.project_name}-${var.environment}"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  environment        = var.environment
  
  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = local.common_tags
}

# Kafka Streaming Infrastructure
module "kafka" {
  source = "./modules/kafka"

  cluster_name       = "${var.project_name}-${var.environment}-kafka"
  kafka_version      = var.kafka_version
  instance_type      = var.kafka_instance_type
  number_of_brokers  = var.kafka_broker_count
  
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnets
  
  volume_size       = var.kafka_volume_size
  volume_type       = var.kafka_volume_type
  
  # Enhanced configuration for high-throughput workloads
  configuration_arn = aws_msk_configuration.ubiquitous_config.arn
  
  monitoring_level  = "PER_TOPIC_PER_PARTITION"
  enhanced_monitoring = ["CPU", "MEMORY", "DISK", "NETWORK"]
  
  environment = var.environment
  tags = local.common_tags
}

# Lambda Functions for Data Processing
module "lambda_processors" {
  source = "./modules/lambda"

  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  kafka_bootstrap_servers = module.kafka.bootstrap_brokers_tls
  kafka_cluster_arn      = module.kafka.cluster_arn
  data_lake_bucket       = "arn:aws:s3:::${var.project_name}-${var.environment}-data-lake"
  
  environment = var.environment
  tags = local.common_tags
  
  # Data source processors
  processors = {
    datadog = {
      memory_size = 1024
      timeout     = 300
      runtime     = "python3.11"
    }
    cloudwatch = {
      memory_size = 512
      timeout     = 180
      runtime     = "python3.11"
    }
    opentelemetry = {
      memory_size = 2048
      timeout     = 600
      runtime     = "python3.11"
    }
    servicenow = {
      memory_size = 1024
      timeout     = 300
      runtime     = "python3.11"
    }
    terraform = {
      memory_size = 512
      timeout     = 120
      runtime     = "python3.11"
    }
    github = {
      memory_size = 256
      timeout     = 60
      runtime     = "python3.11"
    }
    flexera = {
      memory_size = 512
      timeout     = 180
      runtime     = "python3.11"
    }
    tanium = {
      memory_size = 1024
      timeout     = 300
      runtime     = "python3.11"
    }
  }
}

# Data Storage Layer
module "data_stores" {
  source = "./modules/data-stores"

  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  # Subnet groups from VPC module
  db_subnet_group_name = module.vpc.db_subnet_group_name
  elasticache_subnet_group_name = module.vpc.elasticache_subnet_group_name
  
  # Neo4j for graph data
  neo4j_instance_class = var.neo4j_instance_class
  neo4j_storage_size   = var.neo4j_storage_size
  
  # TimescaleDB for metrics
  timescale_instance_class = var.timescale_instance_class
  timescale_storage_size   = var.timescale_storage_size
  
  # Redis for caching
  redis_node_type = var.redis_node_type
  redis_num_cache_nodes = var.redis_num_cache_nodes
  
  environment = var.environment
  tags = local.common_tags
}

# Monitoring and Observability
module "monitoring" {
  source = "./modules/monitoring"

  vpc_id = module.vpc.vpc_id
  
  kafka_cluster_arn = module.kafka.cluster_arn
  lambda_functions  = module.lambda_processors.function_arns
  
  cloudwatch_retention_days  = var.cloudwatch_retention_days
  enable_detailed_monitoring = var.enable_detailed_monitoring
  
  environment = var.environment
  tags = local.common_tags
  
  depends_on = [
    module.kafka,
    module.lambda_processors
  ]
}

# API Gateway for external data source webhooks
resource "awscc_apigateway_rest_api" "data_ingestion" {
  name = "${var.project_name}-${var.environment}-data-api"
  description = "API Gateway for external data source webhooks"
  
  endpoint_configuration = {
    types = ["REGIONAL"]
  }
  
  tags = [
    {
      key   = "Name"
      value = "${var.project_name}-${var.environment}-data-api"
    },
    {
      key   = "Environment"
      value = var.environment
    }
  ]
}

# Application Load Balancer for internal services
resource "aws_lb" "internal" {
  name               = "${var.project_name}-${var.environment}-internal-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.internal_alb.id]
  subnets            = module.vpc.private_subnets

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-internal-alb"
  })
}

# Security group for internal ALB
resource "aws_security_group" "internal_alb" {
  name        = "${var.project_name}-${var.environment}-internal-alb-sg"
  description = "Security group for internal ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-internal-alb-sg"
  })
}