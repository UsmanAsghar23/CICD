export function App() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

  return (
    <main className="container">
      <h1>Deploy Preview Dashboard</h1>
      <p className="subtitle">Stub UI — Part 6 will add the deployments table.</p>
      <dl className="meta">
        <div>
          <dt>Status</dt>
          <dd>ok</dd>
        </div>
        <div>
          <dt>API URL</dt>
          <dd>{apiUrl}</dd>
        </div>
      </dl>
    </main>
  );
}
