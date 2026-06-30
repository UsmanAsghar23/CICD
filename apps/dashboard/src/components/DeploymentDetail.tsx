import { cloudWatchLogsUrl, pullRequestUrl } from "../links";
import type { Deployment, DeploymentStatus } from "../types";
import { formatTimestamp, shortSha } from "../utils";
import { StatusBadge } from "./StatusBadge";

interface DeploymentDetailProps {
  deployment: Deployment | null;
  onClose: () => void;
}

interface TimelineStep {
  status: DeploymentStatus;
  label: string;
  timestamp: string | null;
  active: boolean;
  complete: boolean;
}

function buildTimeline(deployment: Deployment): TimelineStep[] {
  const order: DeploymentStatus[] = ["pending", "building", "live", "destroyed"];
  const currentIndex = order.indexOf(
    deployment.status === "failed" ? "building" : deployment.status,
  );

  const timestamps: Partial<Record<DeploymentStatus, string | null>> = {
    pending: deployment.created_at,
    building: deployment.status === "building" ? deployment.updated_at : null,
    live: deployment.status === "live" ? deployment.updated_at : null,
    destroyed: deployment.destroyed_at,
  };

  if (deployment.status === "failed") {
    return [
      {
        status: "pending",
        label: "Webhook received",
        timestamp: deployment.created_at,
        active: false,
        complete: true,
      },
      {
        status: "building",
        label: "Build started",
        timestamp: deployment.updated_at,
        active: false,
        complete: true,
      },
      {
        status: "failed",
        label: "Deploy failed",
        timestamp: deployment.updated_at,
        active: true,
        complete: true,
      },
    ];
  }

  return order.map((status, index) => ({
    status,
    label:
      status === "pending"
        ? "Webhook received"
        : status === "building"
          ? "Build & deploy"
          : status === "live"
            ? "Preview live"
            : "Torn down",
    timestamp: timestamps[status] ?? null,
    active: deployment.status === status,
    complete: index < currentIndex || deployment.status === status,
  }));
}

export function DeploymentDetail({ deployment, onClose }: DeploymentDetailProps) {
  if (!deployment) {
    return (
      <aside className="detail-panel empty-detail">
        <p>Select a deployment to view details.</p>
      </aside>
    );
  }

  const timeline = buildTimeline(deployment);
  const logsUrl = cloudWatchLogsUrl(deployment);

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <h2>PR #{deployment.pr_number}</h2>
          <p className="muted">{deployment.github_repo}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="detail-status">
        <StatusBadge status={deployment.status} />
        <span className="mono">{deployment.branch}</span>
      </div>

      <section>
        <h3>Timeline</h3>
        <ol className="timeline">
          {timeline.map((step) => (
            <li
              key={step.label}
              className={[
                step.complete ? "complete" : "",
                step.active ? "active" : "",
                step.status === "failed" ? "failed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="timeline-dot" />
              <div>
                <strong>{step.label}</strong>
                {step.timestamp ? (
                  <p className="muted">{formatTimestamp(step.timestamp)}</p>
                ) : (
                  <p className="muted">—</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Links</h3>
        <ul className="link-list">
          <li>
            <a href={pullRequestUrl(deployment)} target="_blank" rel="noreferrer">
              GitHub pull request
            </a>
          </li>
          {deployment.preview_url ? (
            <li>
              <a href={deployment.preview_url} target="_blank" rel="noreferrer">
                Preview environment
              </a>
            </li>
          ) : null}
          {logsUrl ? (
            <li>
              <a href={logsUrl} target="_blank" rel="noreferrer">
                CloudWatch logs
              </a>
            </li>
          ) : (
            <li className="muted">CloudWatch link unavailable (set VITE_AWS_REGION + VITE_CLOUDWATCH_LOG_GROUP)</li>
          )}
        </ul>
      </section>

      <section>
        <h3>Metadata</h3>
        <dl className="meta-grid">
          <div>
            <dt>Commit</dt>
            <dd className="mono">{shortSha(deployment.commit_sha)}</dd>
          </div>
          <div>
            <dt>Full SHA</dt>
            <dd className="mono">{deployment.commit_sha}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatTimestamp(deployment.created_at)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatTimestamp(deployment.updated_at)}</dd>
          </div>
          {deployment.destroyed_at ? (
            <div>
              <dt>Destroyed</dt>
              <dd>{formatTimestamp(deployment.destroyed_at)}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </aside>
  );
}
