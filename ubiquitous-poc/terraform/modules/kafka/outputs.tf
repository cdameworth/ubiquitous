# Kafka Module Outputs

output "cluster_arn" {
  description = "ARN of the MSK cluster"
  value       = aws_msk_cluster.main.arn
}

output "cluster_name" {
  description = "Name of the MSK cluster"
  value       = aws_msk_cluster.main.cluster_name
}

output "bootstrap_brokers" {
  description = "Comma separated list of one or more hostname:port pairs of Kafka brokers suitable to bootstrap connectivity to the Kafka cluster"
  value       = aws_msk_cluster.main.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  description = "Comma separated list of one or more DNS names (or IP addresses) and TLS port pairs"
  value       = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "bootstrap_brokers_sasl_scram" {
  description = "Comma separated list of one or more DNS names (or IP addresses) and SASL SCRAM port pairs"
  value       = aws_msk_cluster.main.bootstrap_brokers_sasl_scram
}

output "bootstrap_brokers_sasl_iam" {
  description = "Comma separated list of one or more DNS names (or IP addresses) and SASL IAM port pairs"
  value       = aws_msk_cluster.main.bootstrap_brokers_sasl_iam
}

output "zookeeper_connect_string" {
  description = "Comma separated list of one or more hostname:port pairs to use to connect to the Apache Zookeeper cluster"
  value       = aws_msk_cluster.main.zookeeper_connect_string
}

output "security_group_id" {
  description = "ID of the security group created for MSK cluster"
  value       = aws_security_group.msk.id
}

output "kms_key_id" {
  description = "KMS key ID for MSK encryption"
  value       = aws_kms_key.msk.key_id
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name for MSK"
  value       = aws_cloudwatch_log_group.msk.name
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.msk.dashboard_name}"
}

output "connect_service_role_arn" {
  description = "ARN of the MSK Connect service role"
  value       = aws_iam_role.msk_connect_service_role.arn
}