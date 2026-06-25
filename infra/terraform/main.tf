terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after creating an S3 bucket and DynamoDB lock table:
  #
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "deploy-preview/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  account_id         = data.aws_caller_identity.current.account_id
  preview_base_domain = "${var.preview_subdomain}.${var.domain_name}"
  preview_wildcard    = "*.${local.preview_base_domain}"
  name_prefix         = var.project_name
  azs                 = slice(data.aws_availability_zones.available.names, 0, 2)
  create_vpc          = var.vpc_id == ""
  vpc_id              = local.create_vpc ? aws_vpc.main[0].id : var.vpc_id
  public_subnet_ids   = local.create_vpc ? aws_subnet.public[*].id : var.public_subnet_ids
}
