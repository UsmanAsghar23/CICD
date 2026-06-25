variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment label applied as a default tag."
  type        = string
  default     = "preview"
}

variable "project_name" {
  description = "Prefix used for named AWS resources."
  type        = string
  default     = "deploy-preview"
}

variable "domain_name" {
  description = "Root Route53 hosted zone domain (e.g. example.com)."
  type        = string
}

variable "preview_subdomain" {
  description = "Subdomain used for previews (preview.example.com)."
  type        = string
  default     = "preview"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for domain_name."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role (owner/repo)."
  type        = string
}

variable "vpc_id" {
  description = "Existing VPC ID. Leave empty to create a dedicated VPC."
  type        = string
  default     = ""
}

variable "public_subnet_ids" {
  description = "Public subnet IDs when using an existing VPC (at least 2 AZs)."
  type        = list(string)
  default     = []

  validation {
    condition     = var.vpc_id == "" || length(var.public_subnet_ids) >= 2
    error_message = "Provide at least two public_subnet_ids when using an existing vpc_id."
  }
}

variable "demo_app_port" {
  description = "Container port exposed by the demo app."
  type        = number
  default     = 3000
}

variable "ecr_image_retention_count" {
  description = "Number of preview images to retain in ECR."
  type        = number
  default     = 30
}
