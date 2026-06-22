import type { DeployMetadata } from "./config.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPreviewPage(meta: DeployMetadata): string {
  const rows = [
    ["PR", `#${escapeHtml(meta.prNumber)}`],
    ["Branch", escapeHtml(meta.branch)],
    ["Commit", `<code>${escapeHtml(meta.shortSha)}</code>`],
    ["Full SHA", `<code>${escapeHtml(meta.commitSha)}</code>`],
    ["Built at", escapeHtml(meta.buildTime)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row">${label}</th><td>${value}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview PR #${escapeHtml(meta.prNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    main {
      width: min(100%, 32rem);
      border: 1px solid #334155;
      border-radius: 0.75rem;
      background: rgba(15, 23, 42, 0.85);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    header {
      padding: 1.5rem;
      border-bottom: 1px solid #334155;
      background: #1e293b;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
    }
    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.9rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.875rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    th {
      width: 7rem;
      color: #64748b;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    td code {
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
      color: #38bdf8;
    }
    tr:last-child th, tr:last-child td { border-bottom: none; }
    footer {
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #334155;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Deploy Preview</h1>
      <p>Ephemeral environment for pull request #${escapeHtml(meta.prNumber)}</p>
    </header>
    <table>
      <tbody>${tableRows}</tbody>
    </table>
    <footer>demo-app &middot; injected at deploy time via container env</footer>
  </main>
</body>
</html>`;
}
