# VPC Module for Ubiquitous Data Platform
# Provides secure networking foundation for data ingestion infrastructure

# Main VPC
resource "awscc_ec2_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = [
    {
      key   = "Name"
      value = var.vpc_name
    },
    {
      key   = "Environment"
      value = var.environment
    }
  ]
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = awscc_ec2_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = awscc_ec2_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-${var.availability_zones[count.index]}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = awscc_ec2_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-${var.availability_zones[count.index]}"
    Type = "Private"
  })
}

# Database Subnets (isolated)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = awscc_ec2_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-db-${var.availability_zones[count.index]}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-${var.availability_zones[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = awscc_ec2_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-rt"
  })
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = awscc_ec2_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-rt-${var.availability_zones[count.index]}"
  })
}

# Route Tables - Database
resource "aws_route_table" "database" {
  vpc_id = awscc_ec2_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-db-rt"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Database
resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# VPC Endpoint for S3 (cost optimization)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = awscc_ec2_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    [aws_route_table.database.id]
  )

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-s3-endpoint"
  })
}

# VPC Endpoint for Lambda (security)
resource "aws_vpc_endpoint" "lambda" {
  vpc_id              = awscc_ec2_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.lambda"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-lambda-endpoint"
  })
}

# VPC Endpoint for CloudWatch Logs
resource "aws_vpc_endpoint" "cloudwatch_logs" {
  vpc_id              = awscc_ec2_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-logs-endpoint"
  })
}

# Security Group for VPC Endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.vpc_name}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = awscc_ec2_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-vpc-endpoints-sg"
  })
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.vpc_name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-db-subnet-group"
  })
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.vpc_name}-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = var.tags
}

# MSK Subnet Group (private subnets for security)
resource "aws_msk_configuration" "vpc_kafka_config" {
  kafka_versions = ["2.8.1"]
  name          = "${var.vpc_name}-msk-config"

  server_properties = <<PROPERTIES
auto.create.topics.enable=false
default.replication.factor=3
min.insync.replicas=2
num.partitions=24
PROPERTIES
}

# Flow Logs for VPC monitoring
resource "aws_flow_log" "vpc_flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = awscc_ec2_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-flow-logs"
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name              = "/aws/vpc/${var.vpc_name}/flowlogs"
  retention_in_days = 30

  tags = var.tags
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${var.vpc_name}-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      },
    ]
  })

  tags = var.tags
}

# IAM Role Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${var.vpc_name}-flow-log-policy"
  role = aws_iam_role.flow_log[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Effect = "Allow"
        Resource = "*"
      },
    ]
  })
}

# Data source for current AWS region
data "aws_region" "current" {}