# Lambda Module Variables

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs for Lambda functions"
  type        = list(string)
}

variable "kafka_bootstrap_servers" {
  description = "Kafka bootstrap servers"
  type        = string
}

variable "kafka_cluster_arn" {
  description = "ARN of the Kafka cluster"
  type        = string
  default     = ""
}

variable "data_lake_bucket" {
  description = "S3 bucket ARN for data lake storage"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "processors" {
  description = "Configuration for each data source processor"
  type = map(object({
    memory_size = number
    timeout     = number
    runtime     = string
  }))
  default = {
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

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}