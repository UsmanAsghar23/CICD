# Terraform — Deploy Preview Baseline

Provisions shared AWS infrastructure for PR preview deployments. Per-PR ECS services and ALB rules are created by GitHub Actions in Part 5.

## What this creates

| Resource | Purpose |
|----------|---------|
| VPC (optional) | Dedicated network when `vpc_id` is not set |
| ECR repository | Stores `demo-app` container images |
| ECS cluster | Hosts ephemeral Fargate preview services |
| ALB + HTTPS listener | Routes `pr-N.preview.yourdomain.com` (rules added in Part 5) |
| ACM certificate | TLS for `*.preview.yourdomain.com` |
| Route53 records | Wildcard + base preview subdomain → ALB |
| IAM OIDC + role | GitHub Actions auth without static AWS keys |
| Security groups | ALB (443) and Fargate tasks (3000 from ALB) |

## Prerequisites

1. [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
2. AWS CLI configured (`aws configure` or environment credentials)
3. A Route53 hosted zone for your root domain
4. Domain delegated to Route53 (required for ACM DNS validation)

## Usage

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your domain, zone ID, and GitHub repo

terraform init
terraform plan
terraform apply
```

After apply, copy outputs into GitHub repository variables:

```bash
terraform output -json github_actions_variables
```

## State backend (recommended for teams)

Uncomment the `backend "s3"` block in `main.tf` and create:

- S3 bucket for state (versioning enabled)
- DynamoDB table for state locking

For solo development, local state is fine.

## Cost notes

- **ALB:** ~$15–30/month while running
- **Fargate:** pay per vCPU/memory per preview task
- **NAT gateway:** not used (tasks run in public subnets with public IPs to keep costs down)

Run `terraform destroy` when not actively demoing.

## Verify

```bash
terraform output ecr_repository_url
terraform output aws_role_arn
aws ecr describe-repositories --repository-names "$(terraform output -raw ecr_repository_name)"
```

Test OIDC from GitHub Actions in Part 5 with a workflow that calls `aws sts get-caller-identity` after assuming `aws_role_arn`.
