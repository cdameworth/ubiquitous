# Kafka Module - Amazon MSK for High-Throughput Data Streaming
# Configured for 1M+ events/second with 8 data source topics

# KMS Key for MSK encryption
resource "aws_kms_key" "msk" {
  description             = "KMS key for MSK cluster encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-kms-key"
  })
}

resource "aws_kms_alias" "msk" {
  name          = "alias/${var.cluster_name}-msk"
  target_key_id = aws_kms_key.msk.key_id
}

# CloudWatch Log Group for MSK
resource "aws_cloudwatch_log_group" "msk" {
  name              = "/aws/msk/${var.cluster_name}"
  retention_in_days = 30

  tags = var.tags
}

# Security Group for MSK Cluster
resource "aws_security_group" "msk" {
  name        = "${var.cluster_name}-sg"
  description = "Security group for MSK cluster"
  vpc_id      = var.vpc_id

  # Kafka broker communication
  ingress {
    description = "Kafka plaintext"
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  ingress {
    description = "Kafka TLS"
    from_port   = 9094
    to_port     = 9094
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  ingress {
    description = "Kafka SASL_SSL"
    from_port   = 9096
    to_port     = 9096
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  # ZooKeeper
  ingress {
    description = "ZooKeeper"
    from_port   = 2181
    to_port     = 2181
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  # JMX monitoring
  ingress {
    description = "JMX"
    from_port   = 11001
    to_port     = 11002
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.cluster_name}-sg"
  })
}

# MSK Cluster
resource "aws_msk_cluster" "main" {
  cluster_name           = var.cluster_name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_brokers

  broker_node_group_info {
    instance_type   = var.instance_type
    client_subnets  = var.private_subnets
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = var.volume_size
        provisioned_throughput {
          enabled           = true
          volume_throughput = var.volume_throughput
        }
      }
    }

    connectivity_info {
      public_access {
        type = "DISABLED"
      }
    }
  }

  configuration_info {
    arn      = var.configuration_arn
    revision = 1
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.msk.arn
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  client_authentication {
    sasl {
      scram = true
      iam   = true
    }
    tls {}
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
      firehose {
        enabled         = false
      }
      s3 {
        enabled = false
      }
    }
  }

  enhanced_monitoring = var.monitoring_level

  tags = merge(var.tags, {
    Name = var.cluster_name
  })

  timeouts {
    create = "60m"
    update = "120m"
    delete = "60m"
  }
}

# CloudWatch Dashboard for MSK Monitoring
resource "aws_cloudwatch_dashboard" "msk" {
  dashboard_name = "${var.cluster_name}-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Kafka", "BytesInPerSec", "Cluster Name", var.cluster_name],
            [".", "BytesOutPerSec", ".", "."],
            [".", "MessagesInPerSec", ".", "."],
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Kafka Cluster Throughput"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Kafka", "CpuUser", "Cluster Name", var.cluster_name, "Broker ID", "1"],
            [".", ".", ".", ".", ".", "2"],
            [".", ".", ".", ".", ".", "3"],
            [".", "MemoryUsed", ".", ".", ".", "1"],
            [".", ".", ".", ".", ".", "2"],
            [".", ".", ".", ".", ".", "3"],
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Broker Resource Utilization"
        }
      }
    ]
  })
}

# MSK Connect Service Role
resource "aws_iam_role" "msk_connect_service_role" {
  name = "${var.cluster_name}-connect-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "kafkaconnect.amazonaws.com"
        }
      },
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "msk_connect_service_policy" {
  role       = aws_iam_role.msk_connect_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonMSKConnectServiceExecutionRole"
}

# Data source for VPC information
data "aws_vpc" "main" {
  id = var.vpc_id
}

data "aws_region" "current" {}