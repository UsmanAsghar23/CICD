#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[%s] %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$*"
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    log "ERROR: Missing required environment variable: ${name}"
    exit 1
  fi
}

require_envs() {
  for name in "$@"; do
    require_env "$name"
  done
}

preview_host() {
  printf 'pr-%s.%s' "$1" "$2"
}

resource_prefix() {
  printf 'dp-pr-%s' "$1"
}

listener_priority() {
  local pr_number="$1"
  echo $((1000 + pr_number))
}

split_csv() {
  local value="$1"
  echo "${value//,/ }"
}

aws_account_id() {
  aws sts get-caller-identity --query Account --output text
}

image_uri() {
  local account_id
  account_id="$(aws_account_id)"
  printf '%s.dkr.ecr.%s.amazonaws.com/%s:%s' \
    "$account_id" "$AWS_REGION" "$ECR_REPOSITORY" "$IMAGE_TAG"
}

wait_for_ecs_service_stable() {
  local cluster="$1"
  local service="$2"
  log "Waiting for ECS service ${service} to stabilize..."
  aws ecs wait services-stable --cluster "$cluster" --services "$service"
}

wait_for_ecs_service_deleted() {
  local cluster="$1"
  local service="$2"
  local attempt=0
  local max_attempts=30

  while (( attempt < max_attempts )); do
    local status
    status="$(aws ecs describe-services \
      --cluster "$cluster" \
      --services "$service" \
      --query 'services[0].status' \
      --output text 2>/dev/null || true)"

    if [[ -z "$status" || "$status" == "None" || "$status" == "INACTIVE" ]]; then
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 10
  done

  log "WARNING: ECS service ${service} may still be draining"
}

target_group_exists() {
  local arn="$1"
  aws elbv2 describe-target-groups --target-group-arns "$arn" >/dev/null 2>&1
}

listener_rule_exists() {
  local rule_arn="$1"
  aws elbv2 describe-rules --rule-arns "$rule_arn" >/dev/null 2>&1
}
