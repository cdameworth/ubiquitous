# Outputs for Ubiquitous Data Ingestion Platform

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

# Kafka Outputs
output "kafka_cluster_arn" {
  description = "ARN of the MSK cluster"
  value       = module.kafka.cluster_arn
}

output "kafka_bootstrap_brokers" {
  description = "Kafka bootstrap brokers (plaintext)"
  value       = module.kafka.bootstrap_brokers
}

output "kafka_bootstrap_brokers_tls" {
  description = "Kafka bootstrap brokers (TLS)"
  value       = module.kafka.bootstrap_brokers_tls
  sensitive   = true
}

output "kafka_zookeeper_connect_string" {
  description = "Kafka ZooKeeper connection string"
  value       = module.kafka.zookeeper_connect_string
  sensitive   = true
}

# Lambda Outputs
output "lambda_function_arns" {
  description = "ARNs of Lambda functions"
  value       = module.lambda_processors.function_arns
}

output "lambda_function_names" {
  description = "Names of Lambda functions"
  value       = module.lambda_processors.function_names
}

# Data Store Outputs
output "neo4j_endpoint" {
  description = "Neo4j database endpoint"
  value       = module.data_stores.neo4j_endpoint
  sensitive   = true
}

output "timescaledb_endpoint" {
  description = "TimescaleDB endpoint"
  value       = module.data_stores.timescaledb_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.data_stores.redis_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for data lake"
  value       = module.data_stores.s3_bucket_name
}

# API Gateway Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${awscc_apigateway_rest_api.data_ingestion.id}.execute-api.${var.aws_region}.amazonaws.com"
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = awscc_apigateway_rest_api.data_ingestion.id
}

# Load Balancer Outputs
output "internal_alb_dns_name" {
  description = "DNS name of the internal Application Load Balancer"
  value       = aws_lb.internal.dns_name
}

output "internal_alb_zone_id" {
  description = "Zone ID of the internal Application Load Balancer"
  value       = aws_lb.internal.zone_id
}

# Security Outputs
output "security_groups" {
  description = "Security group IDs created"
  value = {
    internal_alb = aws_security_group.internal_alb.id
    kafka        = module.kafka.security_group_id
    lambda       = module.lambda_processors.security_group_id
    neo4j        = module.data_stores.neo4j_security_group_id
    timescaledb  = module.data_stores.timescaledb_security_group_id
    redis        = module.data_stores.redis_security_group_id
  }
}

# Monitoring Outputs  
output "cloudwatch_log_groups" {
  description = "CloudWatch log group ARNs"
  value       = module.monitoring.log_group_arns
}

output "cloudwatch_dashboards" {
  description = "CloudWatch dashboard URLs"
  value       = module.monitoring.dashboard_urls
}

# Cost Estimation (informational)
output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD (informational)"
  value = {
    kafka = format("~$%d (%s)", var.kafka_broker_count * 150, var.kafka_instance_type)
    databases = format("~$%d Neo4j + ~$%d TimescaleDB", 
      var.neo4j_instance_class == "db.r5.xlarge" ? 350 : 700,
      var.timescale_instance_class == "db.r5.xlarge" ? 350 : 700
    )
    lambda = "~$50-200 (depends on invocations)"
    storage = format("~$%.2f/month", (var.neo4j_storage_size + var.timescale_storage_size) * 0.115)
    total_estimate = "~$1,200-2,500/month depending on usage"
  }
}