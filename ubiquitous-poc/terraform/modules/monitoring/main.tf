# Monitoring Module - CloudWatch, X-Ray, Alarms
# Comprehensive observability for the Ubiquitous data platform

# CloudWatch Dashboard for Platform Overview
resource "aws_cloudwatch_dashboard" "platform_overview" {
  dashboard_name = "${var.environment}-ubiquitous-platform-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "Platform Data Throughput"
          metrics = concat(
            var.kafka_cluster_arn != "" ? [
              ["AWS/Kafka", "BytesInPerSec", "Cluster Name", try(split(":", var.kafka_cluster_arn)[5], "")],
              [".", "MessagesInPerSec", ".", "."]
            ] : [],
            [
              ["AWS/Lambda", "Invocations", "FunctionName", "INSIGHTS"],
              [".", "Duration", ".", "."]
            ]
          )
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 6
        height = 6
        properties = {
          title = "Database Performance"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.environment}-ubiquitous-neo4j"],
            [".", ".", ".", "${var.environment}-ubiquitous-timescale"],
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${var.environment}-ubiquitous-redis-001"]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 6
        y      = 6
        width  = 6
        height = 6
        properties = {
          title = "Lambda Error Rates"
          metrics = [
            for func in var.lambda_functions : 
            ["AWS/Lambda", "ErrorRate", "FunctionName", func]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title = "Recent Platform Errors"
          query = "SOURCE '/aws/lambda/${var.environment}-ubiquitous' | fields @timestamp, @message, @logStream | filter @message like /ERROR/ | sort @timestamp desc | limit 100"
          region = data.aws_region.current.name
          view   = "table"
        }
      }
    ]
  })
}

# CloudWatch Log Insights Queries
resource "aws_cloudwatch_query_definition" "lambda_errors" {
  name = "${var.environment}-ubiquitous-lambda-errors"

  log_group_names = [
    for func in keys(var.lambda_functions) : 
    "/aws/lambda/${var.environment}-ubiquitous-${func}-processor"
  ]

  query_string = <<EOF
fields @timestamp, @message, @requestId, @logStream
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "data_processing_stats" {
  name = "${var.environment}-ubiquitous-data-processing-stats"

  log_group_names = [
    for func in keys(var.lambda_functions) : 
    "/aws/lambda/${var.environment}-ubiquitous-${func}-processor"
  ]

  query_string = <<EOF
fields @timestamp, @message, @duration, @billedDuration, @memorySize, @maxMemoryUsed
| filter @message like /REPORT/
| stats avg(@duration), max(@duration), avg(@maxMemoryUsed) by bin(5m)
| sort @timestamp desc
EOF
}

# SNS Topic for Critical Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "${var.environment}-ubiquitous-critical-alerts"

  tags = var.tags
}

resource "aws_sns_topic" "warning_alerts" {
  name = "${var.environment}-ubiquitous-warning-alerts"

  tags = var.tags
}

# CloudWatch Composite Alarms
resource "aws_cloudwatch_composite_alarm" "platform_health" {
  alarm_name        = "${var.environment}-ubiquitous-platform-health"
  alarm_description = "Overall platform health composite alarm"

  alarm_rule = join(" OR ", [
    "ALARM(${var.environment}-ubiquitous-neo4j-cpu)",
    "ALARM(${var.environment}-ubiquitous-timescale-cpu)",
    "ALARM(${var.environment}-ubiquitous-redis-cpu)"
  ])

  alarm_actions = [aws_sns_topic.critical_alerts.arn]
  ok_actions    = [aws_sns_topic.critical_alerts.arn]

  tags = var.tags
}

# Custom Metrics for Data Source Health
resource "aws_cloudwatch_log_metric_filter" "data_source_errors" {
  for_each = toset(["datadog", "cloudwatch", "opentelemetry", "servicenow", "terraform", "github", "flexera", "tanium"])

  name           = "${var.environment}-ubiquitous-${each.key}-errors"
  log_group_name = "/aws/lambda/${var.environment}-ubiquitous-${each.key}-processor"
  pattern        = "[timestamp, request_id, \"ERROR\", ...]"

  metric_transformation {
    name      = "${each.key}_processor_errors"
    namespace = "Ubiquitous/DataSources"
    value     = "1"
    
    default_value = 0
  }
}

# Data Processing Success Rate Metrics
resource "aws_cloudwatch_log_metric_filter" "data_processing_success" {
  for_each = toset(["datadog", "cloudwatch", "opentelemetry", "servicenow", "terraform", "github", "flexera", "tanium"])

  name           = "${var.environment}-ubiquitous-${each.key}-success"
  log_group_name = "/aws/lambda/${var.environment}-ubiquitous-${each.key}-processor"
  pattern        = "[timestamp, request_id, \"SUCCESS\", ...]"

  metric_transformation {
    name      = "${each.key}_processor_success"
    namespace = "Ubiquitous/DataSources"
    value     = "1"
    
    default_value = 0
  }
}

# X-Ray Service Map
resource "aws_xray_sampling_rule" "ubiquitous" {
  rule_name      = "${var.environment}-ubiquitous-sampling"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  tags = var.tags
}

# CloudWatch Insights for Platform Analytics
resource "aws_cloudwatch_query_definition" "platform_analytics" {
  name = "${var.environment}-ubiquitous-platform-analytics"

  log_group_names = [
    "/aws/msk/${var.environment}-ubiquitous-kafka",
    "/aws/lambda/${var.environment}-ubiquitous"
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /throughput/ or @message like /latency/
| stats count(@message) as events_processed,
        avg(latency) as avg_latency_ms,
        max(latency) as max_latency_ms
  by bin(5m)
| sort @timestamp desc
EOF
}

# EventBridge Rules for Platform Events
resource "aws_cloudwatch_event_rule" "data_source_failures" {
  name        = "${var.environment}-ubiquitous-data-source-failures"
  description = "Capture data source connection failures"

  event_pattern = jsonencode({
    source      = ["aws.lambda"]
    detail-type = ["Lambda Function Invocation Result - Failure"]
    detail = {
      responseElements = {
        functionName = [{
          prefix = "${var.environment}-ubiquitous-"
        }]
      }
    }
  })

  tags = var.tags
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.data_source_failures.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn
}

# Data source for current AWS region
data "aws_region" "current" {}