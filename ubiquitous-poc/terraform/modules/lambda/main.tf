# Lambda Module - Data Processing Functions for 8 Data Sources
# Serverless processors for high-throughput data transformation

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.environment}-ubiquitous-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })

  tags = var.tags
}

# IAM Policy for Lambda Functions
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.environment}-ubiquitous-lambda-policy"
  description = "IAM policy for Ubiquitous Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # VPC access
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      },
      # CloudWatch Logs
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      # MSK access
      {
        Effect = "Allow"
        Action = [
          "kafka:DescribeCluster",
          "kafka:DescribeClusterV2",
          "kafka:GetBootstrapBrokers",
          "kafka-cluster:Connect",
          "kafka-cluster:AlterCluster",
          "kafka-cluster:DescribeCluster"
        ]
        Resource = "*"
      },
      # Kafka topic and consumer group access
      {
        Effect = "Allow"
        Action = [
          "kafka-cluster:*Topic*",
          "kafka-cluster:WriteData",
          "kafka-cluster:ReadData",
          "kafka-cluster:AlterGroup",
          "kafka-cluster:DescribeGroup"
        ]
        Resource = "*"
      },
      # S3 access for data lake
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.data_lake_bucket}",
          "${var.data_lake_bucket}/*"
        ]
      },
      # Secrets Manager for API keys
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      },
      # X-Ray tracing
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "${var.environment}-ubiquitous-lambda-sg"
  description = "Security group for Ubiquitous Lambda functions"
  vpc_id      = var.vpc_id

  # Outbound access to Kafka
  egress {
    from_port   = 9092
    to_port     = 9096
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  # Outbound HTTPS
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound HTTP for API calls
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ubiquitous-lambda-sg"
  })
}

# Lambda Functions for Each Data Source
resource "awscc_lambda_function" "processors" {
  for_each = var.processors

  function_name = "${var.environment}-ubiquitous-${each.key}-processor"
  description   = "Data processor for ${each.key} integration"
  
  code = {
    zip_file = <<-EOT
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event, context):
    """Lambda handler for ${each.key} data processing"""
    
    environment = os.environ.get('ENVIRONMENT', 'dev')
    kafka_servers = os.environ.get('KAFKA_BOOTSTRAP_SERVERS')
    s3_bucket = os.environ.get('S3_BUCKET')
    data_source = os.environ.get('DATA_SOURCE')
    
    logger.info(f"Processing {data_source} event in {environment} environment")
    
    # Process event data
    processed_records = []
    
    if 'Records' in event:
        # Kafka event source
        for record in event['Records']:
            processed_records.append({"source": data_source, "data": record})
    else:
        # Direct invocation
        processed_records.append({"source": data_source, "data": event})
    
    logger.info(f"Successfully processed {len(processed_records)} {data_source} records")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed_records': len(processed_records),
            'environment': environment,
            'data_source': data_source
        })
    }
EOT
  }
  
  handler     = "index.handler"
  runtime     = each.value.runtime
  timeout     = each.value.timeout
  memory_size = each.value.memory_size
  
  role = aws_iam_role.lambda_execution_role.arn

  vpc_config = {
    security_group_ids = [aws_security_group.lambda.id]
    subnet_ids         = var.private_subnets
  }

  environment = {
    variables = {
      ENVIRONMENT               = var.environment
      KAFKA_BOOTSTRAP_SERVERS  = var.kafka_bootstrap_servers
      S3_BUCKET               = basename(var.data_lake_bucket)
      DATA_SOURCE             = each.key
      LOG_LEVEL               = var.environment == "prod" ? "INFO" : "DEBUG"
    }
  }

  tracing_config = {
    mode = "Active"
  }

  tags = [
    {
      key   = "Name"
      value = "${var.environment}-ubiquitous-${each.key}-processor"
    },
    {
      key   = "DataSource"
      value = each.key
    },
    {
      key   = "Environment"
      value = var.environment
    }
  ]

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# CloudWatch Log Groups for Lambda Functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = var.processors

  name              = "/aws/lambda/${var.environment}-ubiquitous-${each.key}-processor"
  retention_in_days = 30

  tags = merge(var.tags, {
    DataSource = each.key
  })
}

# Lambda Event Source Mappings for Kafka
resource "aws_lambda_event_source_mapping" "kafka_triggers" {
  for_each = var.kafka_cluster_arn != "" ? var.processors : {}

  event_source_arn  = var.kafka_cluster_arn
  function_name     = awscc_lambda_function.processors[each.key].arn
  topics            = ["${each.key}-events"]
  
  starting_position = "LATEST"
  batch_size        = each.key == "opentelemetry" ? 100 : 50
  
  maximum_batching_window_in_seconds = 5
  parallelization_factor             = 2

  filter_criteria {
    filter {
      pattern = jsonencode({
        source = [each.key]
      })
    }
  }

  tags = merge(var.tags, {
    DataSource = each.key
  })
}

# CloudWatch Alarms for Lambda Functions
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.processors

  alarm_name          = "${var.environment}-ubiquitous-${each.key}-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors for ${each.key} processor"
  
  alarm_actions = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = awscc_lambda_function.processors[each.key].function_name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = var.processors

  alarm_name          = "${var.environment}-ubiquitous-${each.key}-processor-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = tostring(each.value.timeout * 800) # 80% of timeout
  alarm_description   = "This metric monitors lambda duration for ${each.key} processor"

  dimensions = {
    FunctionName = awscc_lambda_function.processors[each.key].function_name
  }

  tags = var.tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-ubiquitous-lambda-alerts"

  tags = var.tags
}

# Data source for VPC information
data "aws_vpc" "main" {
  id = var.vpc_id
}