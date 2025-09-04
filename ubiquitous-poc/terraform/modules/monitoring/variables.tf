# Monitoring Module Variables

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "kafka_cluster_arn" {
  description = "ARN of the Kafka cluster to monitor"
  type        = string
}

variable "lambda_functions" {
  description = "Map of Lambda function names to ARNs"
  type        = map(string)
  default     = {}
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cloudwatch_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}