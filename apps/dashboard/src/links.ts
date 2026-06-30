import type { Deployment } from "./types";

export function pullRequestUrl(deployment: Deployment): string {
  return `https://github.com/${deployment.github_repo}/pull/${deployment.pr_number}`;
}

export function cloudWatchLogsUrl(deployment: Deployment): string | null {
  const region = import.meta.env.VITE_AWS_REGION;
  const logGroup = import.meta.env.VITE_CLOUDWATCH_LOG_GROUP;

  if (!region || !logGroup) {
    return null;
  }

  const encodedGroup = encodeURIComponent(encodeURIComponent(logGroup));
  const filter = encodeURIComponent(`pr-${deployment.pr_number}`);

  return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodedGroup}/log-events$3FfilterPattern$3D${filter}`;
}
