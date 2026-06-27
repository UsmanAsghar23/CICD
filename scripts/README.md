# GitHub Actions — Preview Deploy Setup

Configure these after running `terraform apply` (see `infra/terraform/README.md`).

## Repository variables

From `terraform output -json github_actions_variables`:

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region |
| `AWS_ROLE_ARN` | GitHub OIDC IAM role ARN |
| `ECR_REPOSITORY` | ECR repository name |
| `ECS_CLUSTER` | ECS cluster name |
| `ALB_LISTENER_ARN` | HTTPS listener ARN |
| `VPC_ID` | VPC ID |
| `PUBLIC_SUBNET_IDS` | Comma-separated subnet IDs |
| `ECS_TASK_EXECUTION_ROLE_ARN` | ECS task execution role |
| `ECS_TASK_ROLE_ARN` | ECS task role |
| `ECS_TASKS_SECURITY_GROUP_ID` | Fargate tasks security group |
| `PREVIEW_BASE_DOMAIN` | e.g. `preview.example.com` |
| `CLOUDWATCH_LOG_GROUP` | Log group for preview tasks |

## Repository secrets

| Secret | Description |
|--------|-------------|
| `CONTROL_PLANE_URL` | Public URL of control plane (e.g. `https://api.preview.example.com`) |
| `CONTROL_PLANE_TOKEN` | Bearer token matching control plane `CONTROL_PLANE_TOKEN` |

## GitHub webhook (control plane)

In repo **Settings → Webhooks**, add:

- **URL:** `{CONTROL_PLANE_URL}/webhooks/github`
- **Content type:** `application/json`
- **Secret:** same as control plane `GITHUB_WEBHOOK_SECRET`
- **Events:** Pull requests

## Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| `preview-deploy.yml` | PR opened / updated | Build image, deploy ECS + ALB rule |
| `preview-cleanup.yml` | PR closed | Tear down ECS, rule, target group, ECR tag |
| `terraform-plan.yml` | PR touching `infra/terraform/` | `fmt` + `validate` |

Preview URLs: `https://pr-{number}.{PREVIEW_BASE_DOMAIN}`
