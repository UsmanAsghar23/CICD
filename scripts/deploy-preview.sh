#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

require_envs \
  AWS_REGION \
  PR_NUMBER \
  IMAGE_TAG \
  COMMIT_SHA \
  BRANCH \
  ECS_CLUSTER \
  ECR_REPOSITORY \
  VPC_ID \
  PUBLIC_SUBNET_IDS \
  ECS_TASKS_SECURITY_GROUP_ID \
  ECS_TASK_EXECUTION_ROLE_ARN \
  ECS_TASK_ROLE_ARN \
  ALB_LISTENER_ARN \
  PREVIEW_BASE_DOMAIN \
  CLOUDWATCH_LOG_GROUP

DEMO_APP_PORT="${DEMO_APP_PORT:-3000}"
BUILD_TIME="${BUILD_TIME:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}"

PREFIX="$(resource_prefix "$PR_NUMBER")"
SERVICE_NAME="${PREFIX}-svc"
TASK_FAMILY="${PREFIX}-task"
TARGET_GROUP_NAME="${PREFIX}-tg"
HOST="$(preview_host "$PR_NUMBER" "$PREVIEW_BASE_DOMAIN")"
PREVIEW_URL="https://${HOST}"
PRIORITY="$(listener_priority "$PR_NUMBER")"
IMAGE="$(image_uri)"

log "Deploying preview for PR #${PR_NUMBER}"
log "Host: ${HOST}"
log "Image: ${IMAGE}"

TASK_DEF_FILE="$(mktemp)"
trap 'rm -f "${TASK_DEF_FILE}"' EXIT

cat >"${TASK_DEF_FILE}" <<EOF
{
  "family": "${TASK_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${ECS_TASK_EXECUTION_ROLE_ARN}",
  "taskRoleArn": "${ECS_TASK_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "demo-app",
      "image": "${IMAGE}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": ${DEMO_APP_PORT},
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "PORT", "value": "${DEMO_APP_PORT}" },
        { "name": "PR_NUMBER", "value": "${PR_NUMBER}" },
        { "name": "BRANCH", "value": "${BRANCH}" },
        { "name": "COMMIT_SHA", "value": "${COMMIT_SHA}" },
        { "name": "BUILD_TIME", "value": "${BUILD_TIME}" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${CLOUDWATCH_LOG_GROUP}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "pr-${PR_NUMBER}"
        }
      }
    }
  ]
}
EOF

TASK_DEF_ARN="$(aws ecs register-task-definition \
  --cli-input-json "file://${TASK_DEF_FILE}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"

log "Registered task definition: ${TASK_DEF_ARN}"

if aws elbv2 describe-target-groups --names "${TARGET_GROUP_NAME}" >/dev/null 2>&1; then
  TARGET_GROUP_ARN="$(aws elbv2 describe-target-groups \
    --names "${TARGET_GROUP_NAME}" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)"
  log "Reusing target group: ${TARGET_GROUP_ARN}"
else
  TARGET_GROUP_ARN="$(aws elbv2 create-target-group \
    --name "${TARGET_GROUP_NAME}" \
    --protocol HTTP \
    --port "${DEMO_APP_PORT}" \
    --vpc-id "${VPC_ID}" \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --matcher HttpCode=200 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)"
  log "Created target group: ${TARGET_GROUP_ARN}"
fi

EXISTING_RULE_ARN="$(aws elbv2 describe-rules \
  --listener-arn "${ALB_LISTENER_ARN}" \
  --query "Rules[?Priority=='${PRIORITY}'].RuleArn | [0]" \
  --output text)"

if [[ -n "${EXISTING_RULE_ARN}" && "${EXISTING_RULE_ARN}" != "None" ]]; then
  aws elbv2 modify-rule \
    --rule-arn "${EXISTING_RULE_ARN}" \
    --conditions "Field=host-header,Values=${HOST}" \
    --actions "Type=forward,TargetGroupArn=${TARGET_GROUP_ARN}"
  LISTENER_RULE_ARN="${EXISTING_RULE_ARN}"
  log "Updated listener rule: ${LISTENER_RULE_ARN}"
else
  LISTENER_RULE_ARN="$(aws elbv2 create-rule \
    --listener-arn "${ALB_LISTENER_ARN}" \
    --priority "${PRIORITY}" \
    --conditions "Field=host-header,Values=${HOST}" \
    --actions "Type=forward,TargetGroupArn=${TARGET_GROUP_ARN}" \
    --query 'Rules[0].RuleArn' \
    --output text)"
  log "Created listener rule: ${LISTENER_RULE_ARN}"
fi

NETWORK_CONFIG="awsvpcConfiguration={subnets=[${PUBLIC_SUBNET_IDS}],securityGroups=[${ECS_TASKS_SECURITY_GROUP_ID}],assignPublicIp=ENABLED}"

SERVICE_STATUS="$(aws ecs describe-services \
  --cluster "${ECS_CLUSTER}" \
  --services "${SERVICE_NAME}" \
  --query 'services[0].status' \
  --output text 2>/dev/null || echo "MISSING")"

if [[ "${SERVICE_STATUS}" == "ACTIVE" ]]; then
  log "Updating ECS service: ${SERVICE_NAME}"
  aws ecs update-service \
    --cluster "${ECS_CLUSTER}" \
    --service "${SERVICE_NAME}" \
    --task-definition "${TASK_DEF_ARN}" \
    --force-new-deployment \
    >/dev/null
else
  log "Creating ECS service: ${SERVICE_NAME}"
  aws ecs create-service \
    --cluster "${ECS_CLUSTER}" \
    --service-name "${SERVICE_NAME}" \
    --task-definition "${TASK_DEF_ARN}" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "${NETWORK_CONFIG}" \
    --load-balancers "targetGroupArn=${TARGET_GROUP_ARN},containerName=demo-app,containerPort=${DEMO_APP_PORT}" \
    --health-check-grace-period-seconds 60 \
    >/dev/null
fi

wait_for_ecs_service_stable "${ECS_CLUSTER}" "${SERVICE_NAME}"

log "Preview deployed successfully"
log "URL: ${PREVIEW_URL}"

printf 'PREVIEW_URL=%s\n' "${PREVIEW_URL}"
printf 'SERVICE_NAME=%s\n' "${SERVICE_NAME}"
printf 'TARGET_GROUP_ARN=%s\n' "${TARGET_GROUP_ARN}"
printf 'LISTENER_RULE_ARN=%s\n' "${LISTENER_RULE_ARN}"
