# Data Stores Module - Neo4j, TimescaleDB, Redis, S3
# Optimized for 10M+ nodes and 90-day metric retention

# KMS Key for database encryption
resource "aws_kms_key" "data_stores" {
  description             = "KMS key for data stores encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-data-stores-kms"
  })
}

resource "aws_kms_alias" "data_stores" {
  name          = "alias/${var.environment}-ubiquitous-data-stores"
  target_key_id = aws_kms_key.data_stores.key_id
}

# S3 Bucket for Data Lake
resource "awscc_s3_bucket" "data_lake" {
  bucket_name = "${var.environment}-ubiquitous-data-lake-${random_string.bucket_suffix.result}"

  versioning_configuration = {
    status = "Enabled"
  }

  bucket_encryption = {
    server_side_encryption_configuration = [{
      server_side_encryption_by_default = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = aws_kms_key.data_stores.arn
      }
      bucket_key_enabled = true
    }]
  }

  lifecycle_configuration = {
    rules = [{
      id     = "data_lifecycle"
      status = "Enabled"
      transitions = [{
        days          = 30
        storage_class = "STANDARD_IA"
      }, {
        days          = 90
        storage_class = "GLACIER"
      }, {
        days          = 365
        storage_class = "DEEP_ARCHIVE"
      }]
    }]
  }

  notification_configuration = {
    cloud_watch_configurations = [{
      event = "s3:ObjectCreated:*"
    }]
  }

  tags = [
    {
      key   = "Name"
      value = "${var.environment}-ubiquitous-data-lake"
    },
    {
      key   = "Environment"
      value = var.environment
    }
  ]
}

resource "random_string" "bucket_suffix" {
  length  = 8
  upper   = false
  special = false
}

# Security Group for RDS (Neo4j on RDS PostgreSQL)
resource "aws_security_group" "neo4j" {
  name        = "${var.environment}-ubiquitous-neo4j-sg"
  description = "Security group for Neo4j database"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL port for Neo4j"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-neo4j-sg"
  })
}

# RDS Instance for Neo4j (using PostgreSQL with APOC plugin support)
resource "awscc_rds_db_instance" "neo4j" {
  db_instance_identifier = "${var.environment}-ubiquitous-neo4j"
  allocated_storage      = var.neo4j_storage_size
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.data_stores.arn

  engine         = "postgres"
  engine_version = "15.4"
  db_instance_class = var.neo4j_instance_class

  db_name  = "ubiquitous_graph"
  master_username = "ubiquitous_admin"
  manage_master_user_password = true
  master_user_secret = {
    kms_key_id = aws_kms_key.data_stores.arn
  }

  vpc_security_groups = [aws_security_group.neo4j.id]
  db_subnet_group_name = var.db_subnet_group_name

  backup_retention_period = 35
  preferred_backup_window      = "03:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  
  deletion_protection = var.environment == "prod"

  enable_performance_insights = true
  performance_insights_kms_key_id = aws_kms_key.data_stores.arn
  performance_insights_retention_period = 7
  
  monitoring_interval         = 60
  auto_minor_version_upgrade  = false

  tags = [
    {
      key   = "Name"
      value = "${var.environment}-ubiquitous-neo4j"
    },
    {
      key   = "DatabaseType"
      value = "Neo4j"
    }
  ]
}

# Security Group for TimescaleDB
resource "aws_security_group" "timescaledb" {
  name        = "${var.environment}-ubiquitous-timescaledb-sg"
  description = "Security group for TimescaleDB"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL port for TimescaleDB"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-timescaledb-sg"
  })
}

# RDS Instance for TimescaleDB
resource "awscc_rds_db_instance" "timescaledb" {
  db_instance_identifier = "${var.environment}-ubiquitous-timescale"
  allocated_storage      = var.timescale_storage_size
  max_allocated_storage  = var.timescale_storage_size * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.data_stores.arn

  engine         = "postgres"
  engine_version = "15.4"
  db_instance_class = var.timescale_instance_class

  db_name  = "ubiquitous_metrics"
  master_username = "ubiquitous_admin"
  manage_master_user_password = true
  master_user_secret = {
    kms_key_id = aws_kms_key.data_stores.arn
  }

  vpc_security_groups = [aws_security_group.timescaledb.id]
  db_subnet_group_name = var.db_subnet_group_name

  backup_retention_period = 35
  preferred_backup_window      = "02:00-03:00"
  preferred_maintenance_window = "sun:03:00-sun:04:00"
  
  deletion_protection = var.environment == "prod"

  enable_performance_insights = true
  performance_insights_kms_key_id = aws_kms_key.data_stores.arn
  performance_insights_retention_period = 7
  
  monitoring_interval         = 60
  auto_minor_version_upgrade  = false

  # Enhanced for time-series workloads
  db_parameter_group_name = aws_db_parameter_group.timescaledb.name

  tags = [
    {
      key   = "Name"
      value = "${var.environment}-ubiquitous-timescale"
    },
    {
      key   = "DatabaseType"
      value = "TimescaleDB"
    }
  ]
}

# Parameter Group for TimescaleDB optimization
resource "aws_db_parameter_group" "timescaledb" {
  family = "postgres15"
  name   = "${var.environment}-ubiquitous-timescale-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "timescaledb,pg_stat_statements"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "32768"  # 32MB
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "2097152"  # 2GB
  }

  parameter {
    name  = "effective_cache_size"
    value = "12582912"  # 12GB for r5.xlarge
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  tags = var.tags
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "${var.environment}-ubiquitous-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis port"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-redis-sg"
  })
}

# Random password for Redis auth token
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id         = "${var.environment}-ubiquitous-redis"
  description                  = "Redis cluster for Ubiquitous platform caching and sessions"

  node_type                    = var.redis_node_type
  port                         = 6379
  parameter_group_name         = aws_elasticache_parameter_group.redis.name
  num_cache_clusters           = var.redis_num_cache_nodes

  subnet_group_name            = var.elasticache_subnet_group_name
  security_group_ids           = [aws_security_group.redis.id]

  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                  = random_password.redis_auth_token.result
  kms_key_id                  = aws_kms_key.data_stores.arn

  automatic_failover_enabled   = true
  multi_az_enabled            = true

  # Backup configuration
  snapshot_retention_limit = 7
  snapshot_window         = "01:00-02:00"
  maintenance_window      = "sun:02:00-sun:03:00"

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "slow-log"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-redis"
  })
}

# Parameter Group for Redis optimization
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7.x"
  name   = "${var.environment}-ubiquitous-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  tags = var.tags
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${var.environment}-ubiquitous-redis"
  retention_in_days = 30

  tags = var.tags
}

# CloudWatch Alarms for Data Stores
resource "aws_cloudwatch_metric_alarm" "neo4j_cpu" {
  alarm_name          = "${var.environment}-ubiquitous-neo4j-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Neo4j CPU utilization"

  dimensions = {
    DBInstanceIdentifier = awscc_rds_db_instance.neo4j.db_instance_identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "timescaledb_cpu" {
  alarm_name          = "${var.environment}-ubiquitous-timescale-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors TimescaleDB CPU utilization"

  dimensions = {
    DBInstanceIdentifier = awscc_rds_db_instance.timescaledb.db_instance_identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.environment}-ubiquitous-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis CPU utilization"

  dimensions = {
    CacheClusterId = "${var.environment}-ubiquitous-redis-001"
  }

  tags = var.tags
}

# Data source for VPC information
data "aws_vpc" "main" {
  id = var.vpc_id
}