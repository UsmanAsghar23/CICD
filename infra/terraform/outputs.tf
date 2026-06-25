output "aws_region" {
  description = "AWS region."
  value       = var.aws_region
}

output "preview_base_domain" {
  description = "Base domain for preview URLs (pr-N.preview.example.com)."
  value       = local.preview_base_domain
}

output "vpc_id" {
  description = "VPC used by preview infrastructure."
  value       = local.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnets for Fargate tasks and ALB."
  value       = local.public_subnet_ids
}

output "ecr_repository_name" {
  description = "ECR repository name for demo-app images."
  value       = aws_ecr_repository.demo_app.name
}

output "ecr_repository_url" {
  description = "ECR repository URL for docker push."
  value       = aws_ecr_repository.demo_app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.main.arn
}

output "ecs_task_execution_role_arn" {
  description = "IAM role ARN for ECS task execution (image pull + logs)."
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "IAM role ARN attached to preview tasks."
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_tasks_security_group_id" {
  description = "Security group for preview Fargate tasks."
  value       = aws_security_group.ecs_tasks.id
}

output "alb_arn" {
  description = "Application Load Balancer ARN."
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name."
  value       = aws_lb.main.dns_name
}

output "alb_listener_arn" {
  description = "HTTPS listener ARN (Part 5 scripts attach per-PR rules here)."
  value       = aws_lb_listener.https.arn
}

output "alb_https_listener_arn" {
  description = "Alias for alb_listener_arn."
  value       = aws_lb_listener.https.arn
}

output "aws_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC authentication."
  value       = aws_iam_role.github_actions.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group for preview tasks."
  value       = aws_cloudwatch_log_group.demo_app.name
}

output "demo_app_port" {
  description = "Container port for demo-app."
  value       = var.demo_app_port
}

output "github_actions_variables" {
  description = "Suggested GitHub repository variables for Part 5 workflows."
  value = {
    AWS_REGION                  = var.aws_region
    AWS_ROLE_ARN                = aws_iam_role.github_actions.arn
    ECR_REPOSITORY              = aws_ecr_repository.demo_app.name
    ECS_CLUSTER                 = aws_ecs_cluster.main.name
    ALB_LISTENER_ARN            = aws_lb_listener.https.arn
    VPC_ID                      = local.vpc_id
    PUBLIC_SUBNET_IDS           = join(",", local.public_subnet_ids)
    ECS_TASK_EXECUTION_ROLE_ARN = aws_iam_role.ecs_task_execution.arn
    ECS_TASK_ROLE_ARN           = aws_iam_role.ecs_task.arn
    ECS_TASKS_SECURITY_GROUP_ID = aws_security_group.ecs_tasks.id
    PREVIEW_BASE_DOMAIN         = local.preview_base_domain
    CLOUDWATCH_LOG_GROUP        = aws_cloudwatch_log_group.demo_app.name
  }
}
