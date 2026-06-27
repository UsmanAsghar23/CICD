#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

usage() {
  cat <<'EOF'
Usage:
  control-plane.sh wait <pr_number> <github_repo>
  control-plane.sh patch <deployment_id> <status> [preview_url] [commit_sha]
EOF
}

require_control_plane_env() {
  require_envs CONTROL_PLANE_URL CONTROL_PLANE_TOKEN
}

get_deployment_id() {
  local pr_number="$1"
  local github_repo="$2"
  local response

  response="$(curl -fsS "${CONTROL_PLANE_URL}/api/deployments")"
  echo "$response" | jq -r \
    --arg pr "$pr_number" \
    --arg repo "$github_repo" \
    '.deployments[] | select(.pr_number == ($pr | tonumber) and .github_repo == $repo) | .id' \
    | head -n 1
}

wait_for_deployment() {
  local pr_number="$1"
  local github_repo="$2"
  local attempt=0
  local max_attempts="${CONTROL_PLANE_WAIT_ATTEMPTS:-30}"
  local deployment_id=""

  while (( attempt < max_attempts )); do
    deployment_id="$(get_deployment_id "$pr_number" "$github_repo" || true)"
    if [[ -n "$deployment_id" && "$deployment_id" != "null" ]]; then
      echo "$deployment_id"
      return 0
    fi

    attempt=$((attempt + 1))
    log "Waiting for control plane deployment record (${attempt}/${max_attempts})..."
    sleep 2
  done

  log "ERROR: Deployment record not found for PR #${pr_number} (${github_repo})"
  return 1
}

patch_deployment() {
  local deployment_id="$1"
  local status="$2"
  local preview_url="${3:-}"
  local commit_sha="${4:-}"

  local payload
  payload="$(jq -n \
    --arg status "$status" \
    --arg preview_url "$preview_url" \
    --arg commit_sha "$commit_sha" \
    '{
      status: $status
    }
    + (if $preview_url != "" then {preview_url: $preview_url} else {} end)
    + (if $commit_sha != "" then {commit_sha: $commit_sha} else {} end)')"

  curl -fsS -X PATCH "${CONTROL_PLANE_URL}/api/deployments/${deployment_id}" \
    -H "Authorization: Bearer ${CONTROL_PLANE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null

  log "Updated deployment ${deployment_id} -> ${status}"
}

command="${1:-}"
shift || true

case "$command" in
  wait)
    require_control_plane_env
    require_envs CONTROL_PLANE_URL
    pr_number="${1:?PR number required}"
    github_repo="${2:?GitHub repo required}"
    wait_for_deployment "$pr_number" "$github_repo"
    ;;
  patch)
    require_control_plane_env
    deployment_id="${1:?Deployment ID required}"
    status="${2:?Status required}"
    preview_url="${3:-}"
    commit_sha="${4:-}"
    patch_deployment "$deployment_id" "$status" "$preview_url" "$commit_sha"
    ;;
  *)
    usage
    exit 1
    ;;
esac
