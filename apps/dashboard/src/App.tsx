import { useMemo, useState } from "react";
import { DeploymentDetail } from "./components/DeploymentDetail";
import { DeploymentsTable } from "./components/DeploymentsTable";
import { useDeployments } from "./hooks/useDeployments";
import type { Deployment } from "./types";

export function App() {
  const { deployments, loading, error, lastUpdated, refresh } = useDeployments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedDeployment = useMemo(
    () => deployments.find((deployment) => deployment.id === selectedId) ?? null,
    [deployments, selectedId],
  );

  const handleSelect = (deployment: Deployment) => {
    setSelectedId(deployment.id);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Deploy Preview Dashboard</h1>
          <p className="subtitle">Live status for ephemeral PR environments</p>
        </div>
        <div className="header-actions">
          {lastUpdated ? (
            <span className="muted">Updated {lastUpdated.toLocaleTimeString()}</span>
          ) : null}
          <button type="button" className="ghost-button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="dashboard-grid">
        <section className="table-panel">
          <div className="panel-header">
            <h2>Deployments</h2>
            {loading ? <span className="muted">Loading…</span> : null}
          </div>
          <DeploymentsTable
            deployments={deployments}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </section>

        <DeploymentDetail
          deployment={selectedDeployment}
          onClose={() => setSelectedId(null)}
        />
      </main>
    </div>
  );
}
