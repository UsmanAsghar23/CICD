import type { Deployment } from "../types";
import { formatRelativeTime, shortSha } from "../utils";
import { StatusBadge } from "./StatusBadge";

interface DeploymentsTableProps {
  deployments: Deployment[];
  selectedId: string | null;
  onSelect: (deployment: Deployment) => void;
}

export function DeploymentsTable({ deployments, selectedId, onSelect }: DeploymentsTableProps) {
  if (deployments.length === 0) {
    return (
      <div className="empty-state">
        <p>No deployments yet.</p>
        <p className="muted">Open a pull request to trigger a preview deploy.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PR</th>
            <th>Branch</th>
            <th>Status</th>
            <th>Preview</th>
            <th>Commit</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((deployment) => (
            <tr
              key={deployment.id}
              className={deployment.id === selectedId ? "selected" : ""}
              onClick={() => onSelect(deployment)}
            >
              <td>#{deployment.pr_number}</td>
              <td className="mono">{deployment.branch}</td>
              <td>
                <StatusBadge status={deployment.status} />
              </td>
              <td>
                {deployment.preview_url && deployment.status === "live" ? (
                  <a
                    href={deployment.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Open
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td className="mono">{shortSha(deployment.commit_sha)}</td>
              <td>{formatRelativeTime(deployment.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
