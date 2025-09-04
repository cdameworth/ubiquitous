# Data Stores Module Outputs

# S3 Data Lake Outputs
output "s3_bucket_name" {
  description = "Name of the S3 data lake bucket"
  value       = awscc_s3_bucket.data_lake.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 data lake bucket"
  value       = "arn:aws:s3:::${awscc_s3_bucket.data_lake.bucket_name}"
}

# Neo4j Database Outputs
output "neo4j_endpoint" {
  description = "Neo4j database endpoint"
  value       = awscc_rds_db_instance.neo4j.endpoint
  sensitive   = true
}

output "neo4j_port" {
  description = "Neo4j database port"
  value       = awscc_rds_db_instance.neo4j.port
}

output "neo4j_database_name" {
  description = "Neo4j database name"
  value       = awscc_rds_db_instance.neo4j.db_name
}

output "neo4j_security_group_id" {
  description = "ID of the Neo4j security group"
  value       = aws_security_group.neo4j.id
}

# TimescaleDB Outputs
output "timescaledb_endpoint" {
  description = "TimescaleDB endpoint"
  value       = awscc_rds_db_instance.timescaledb.endpoint
  sensitive   = true
}

output "timescaledb_port" {
  description = "TimescaleDB port"
  value       = awscc_rds_db_instance.timescaledb.port
}

output "timescaledb_database_name" {
  description = "TimescaleDB database name"
  value       = awscc_rds_db_instance.timescaledb.db_name
}

output "timescaledb_security_group_id" {
  description = "ID of the TimescaleDB security group"
  value       = aws_security_group.timescaledb.id
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "redis_auth_token" {
  description = "Redis auth token"
  value       = random_password.redis_auth_token.result
  sensitive   = true
}

# KMS Key Outputs
output "kms_key_id" {
  description = "KMS key ID for data stores"
  value       = aws_kms_key.data_stores.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for data stores"
  value       = aws_kms_key.data_stores.arn
}

# Database Connection Information
output "connection_info" {
  description = "Database connection information for applications"
  value = {
    neo4j = {
      endpoint = awscc_rds_db_instance.neo4j.endpoint
      port     = awscc_rds_db_instance.neo4j.port
      database = awscc_rds_db_instance.neo4j.db_name
    }
    timescaledb = {
      endpoint = awscc_rds_db_instance.timescaledb.endpoint
      port     = awscc_rds_db_instance.timescaledb.port
      database = awscc_rds_db_instance.timescaledb.db_name
    }
    redis = {
      endpoint = aws_elasticache_replication_group.redis.configuration_endpoint_address
      port     = aws_elasticache_replication_group.redis.port
    }
  }
  sensitive = true
}

# Monitoring and Alerting
output "cloudwatch_alarms" {
  description = "CloudWatch alarm ARNs"
  value = {
    neo4j_cpu       = aws_cloudwatch_metric_alarm.neo4j_cpu.arn
    timescaledb_cpu = aws_cloudwatch_metric_alarm.timescaledb_cpu.arn
    redis_cpu       = aws_cloudwatch_metric_alarm.redis_cpu.arn
  }
}