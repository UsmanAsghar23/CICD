#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

require_envs \
  AWS_REGION \
  PR_NUMBER \
  ECS_CLUSTER \
  ALB_LISTENER_ARN

IMAGE_TAG="${IMAGE_TAG:-}"
ECR_REPOSITORY="${ECR_REPOSITORY:-}"
PREFIX="$(resource_prefix "$PR_NUMBER")"
SERVICE_NAME="${PREFIX}-svc"
TARGET_GROUP_NAME="${PREFIX}-tg"
PRIORITY="$(listener_priority "$PR_NUMBER")"

log "Cleaning up preview for PR #${PR_NUMBER}"

if aws ecs describe-services --cluster "${ECS_CLUSTER}" --services "${SERVICE_NAME}" \
  --query 'services[0].status' --output text 2>/dev/null | grep -qx "ACTIVE"; then
  log "Deleting ECS service: ${SERVICE_NAME}"
  aws ecs update-service \
    --cluster "${ECS_CLUSTER}" \
    --service "${SERVICE_NAME}" \
    --desired-count 0 \
    >/dev/null

  aws ecs delete-service \
    --cluster "${ECS_CLUSTER}" \
    --service "${SERVICE_NAME}" \
    --force \
    >/dev/null

  wait_for_ecs_service_deleted "${ECS_CLUSTER}" "${SERVICE_NAME}"
else
  log "ECS service not found: ${SERVICE_NAME}"
fi

RULE_ARN="$(aws elbv2 describe-rules \
  --listener-arn "${ALB_LISTENER_ARN}" \
  --query "Rules[?Priority=='${PRIORITY}'].RuleArn | [0]" \
  --output text)"

if [[ -n "${RULE_ARN}" && "${RULE_ARN}" != "None" ]]; then
  log "Deleting listener rule: ${RULE_ARN}"
  aws elbv2 delete-rule --rule-arn "${RULE_ARN}"
else
  log "Listener rule not found for priority ${PRIORITY}"
fi

if aws elbv2 describe-target-groups --names "${TARGET_GROUP_NAME}" >/dev/null 2>&1; then
  TARGET_GROUP_ARN="$(aws elbv2 describe-target-groups \
    --names "${TARGET_GROUP_NAME}" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)"
  log "Deleting target group: ${TARGET_GROUP_ARN}"
  aws elbv2 delete-target-group --target-group-arn "${TARGET_GROUP_ARN}"
else
  log "Target group not found: ${TARGET_GROUP_NAME}"
fi

if [[ -n "${ECR_REPOSITORY}" && -n "${IMAGE_TAG}" ]]; then
  log "Deleting ECR image tag: ${IMAGE_TAG}"
  aws ecr batch-delete-image \
    --repository-name "${ECR_REPOSITORY}" \
    --image-ids "imageTag=${IMAGE_TAG}" \
    >/dev/null 2>&1 || log "ECR tag ${IMAGE_TAG} not found or already deleted"
fi

log "Cleanup complete for PR #${PR_NUMBER}"
