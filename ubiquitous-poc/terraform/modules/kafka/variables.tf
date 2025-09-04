# Kafka Module Variables

variable "cluster_name" {
  description = "Name of the MSK cluster"
  type        = string
}

variable "kafka_version" {
  description = "Version of Apache Kafka"
  type        = string
  default     = "2.8.1"
}

variable "instance_type" {
  description = "Instance type for Kafka brokers"
  type        = string
  default     = "kafka.m5.large"
}

variable "number_of_brokers" {
  description = "Number of broker nodes in the cluster"
  type        = number
  default     = 3
  validation {
    condition     = var.number_of_brokers >= 3 && var.number_of_brokers <= 15
    error_message = "Number of brokers must be between 3 and 15."
  }
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "volume_size" {
  description = "Size of the EBS volume for each broker (GB)"
  type        = number
  default     = 1000
}

variable "volume_type" {
  description = "Type of EBS volume"
  type        = string
  default     = "gp3"
}

variable "volume_throughput" {
  description = "Throughput for gp3 volumes (MiB/s)"
  type        = number
  default     = 250
}

variable "configuration_arn" {
  description = "ARN of the MSK configuration"
  type        = string
}

variable "monitoring_level" {
  description = "Enhanced monitoring level"
  type        = string
  default     = "PER_TOPIC_PER_PARTITION"
  validation {
    condition = contains([
      "DEFAULT", 
      "PER_BROKER", 
      "PER_TOPIC_PER_BROKER", 
      "PER_TOPIC_PER_PARTITION"
    ], var.monitoring_level)
    error_message = "Invalid monitoring level."
  }
}

variable "enhanced_monitoring" {
  description = "List of enhanced monitoring metrics"
  type        = list(string)
  default     = ["CPU", "MEMORY", "DISK", "NETWORK"]
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}