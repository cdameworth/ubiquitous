# Monitoring Module Outputs

output "dashboard_urls" {
  description = "CloudWatch dashboard URLs"
  value = {
    platform_overview = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.platform_overview.dashboard_name}"
  }
}

output "log_group_arns" {
  description = "CloudWatch log group ARNs"
  value = {
    platform_overview = aws_cloudwatch_dashboard.platform_overview.dashboard_name
  }
}

output "sns_topic_arns" {
  description = "SNS topic ARNs for alerts"
  value = {
    critical_alerts = aws_sns_topic.critical_alerts.arn
    warning_alerts  = aws_sns_topic.warning_alerts.arn
  }
}

output "composite_alarm_arn" {
  description = "Platform health composite alarm ARN"
  value       = aws_cloudwatch_composite_alarm.platform_health.arn
}

output "log_insights_queries" {
  description = "CloudWatch Log Insights query definitions"
  value = {
    lambda_errors           = aws_cloudwatch_query_definition.lambda_errors.query_definition_id
    data_processing_stats   = aws_cloudwatch_query_definition.data_processing_stats.query_definition_id
    platform_analytics     = aws_cloudwatch_query_definition.platform_analytics.query_definition_id
  }
}

output "custom_metrics" {
  description = "Custom metrics created for data source monitoring"
  value = {
    for source in ["datadog", "cloudwatch", "opentelemetry", "servicenow", "terraform", "github", "flexera", "tanium"] :
    source => {
      error_metric   = aws_cloudwatch_log_metric_filter.data_source_errors[source].name
      success_metric = aws_cloudwatch_log_metric_filter.data_processing_success[source].name
    }
  }
}

output "event_rules" {
  description = "EventBridge rules for platform monitoring"
  value = {
    data_source_failures = aws_cloudwatch_event_rule.data_source_failures.arn
  }
}

output "xray_sampling_rule" {
  description = "X-Ray sampling rule for the platform"
  value       = aws_xray_sampling_rule.ubiquitous.arn
}