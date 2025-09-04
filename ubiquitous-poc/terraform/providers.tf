# Provider Requirements for Ubiquitous Data Platform

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    
    awscc = {
      source  = "hashicorp/awscc" 
      version = "~> 0.70"
    }
    
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  # Backend configuration for state management
  # Uncomment and configure for remote state storage
  # backend "s3" {
  #   bucket         = "ubiquitous-terraform-state"
  #   key            = "data-ingestion/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

# AWS Provider Configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ubiquitous-data-platform"
      Environment = var.environment
      Owner       = var.owner
      CostCenter  = var.cost_center
      Terraform   = "true"
      ManagedBy   = "terraform"
    }
  }
}

# AWSCC Provider Configuration 
provider "awscc" {
  region = var.aws_region
}

# Random Provider (for unique resource naming)
provider "random" {}