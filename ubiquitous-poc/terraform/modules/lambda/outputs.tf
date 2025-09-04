# Lambda Module Outputs

output "function_arns" {
  description = "Map of data source names to Lambda function ARNs"
  value       = { for k, v in awscc_lambda_function.processors : k => v.arn }
}

output "function_names" {
  description = "Map of data source names to Lambda function names"
  value       = { for k, v in awscc_lambda_function.processors : k => v.function_name }
}

output "execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "log_group_arns" {
  description = "Map of CloudWatch log group ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.arn }
}

output "event_source_mapping_ids" {
  description = "Map of Kafka event source mapping IDs"
  value       = { for k, v in aws_lambda_event_source_mapping.kafka_triggers : k => v.uuid }
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for Lambda alerts"
  value       = aws_sns_topic.alerts.arn
}

output "processor_configurations" {
  description = "Configuration details for each processor"
  value = {
    for k, v in var.processors : k => {
      memory_size = v.memory_size
      timeout     = v.timeout
      runtime     = v.runtime
      function_arn = awscc_lambda_function.processors[k].arn
    }
  }
}