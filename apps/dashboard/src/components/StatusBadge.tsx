import type { DeploymentStatus } from "../types";

const STATUS_LABELS: Record<DeploymentStatus, string> = {
  pending: "Pending",
  building: "Building",
  live: "Live",
  failed: "Failed",
  destroyed: "Destroyed",
};

interface StatusBadgeProps {
  status: DeploymentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}
