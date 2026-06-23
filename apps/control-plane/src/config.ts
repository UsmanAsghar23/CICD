export type DeploymentStatus = "pending" | "building" | "live" | "failed" | "destroyed";

export interface AppConfig {
  port: number;
  databaseUrl: string;
  githubWebhookSecret: string;
  githubToken: string;
  previewBaseDomain: string;
  controlPlaneToken: string;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    databaseUrl: requireEnv("DATABASE_URL", "postgres://preview:preview@localhost:5432/preview"),
    githubWebhookSecret: requireEnv("GITHUB_WEBHOOK_SECRET", "dev-secret"),
    githubToken: process.env.GITHUB_TOKEN ?? "",
    previewBaseDomain: requireEnv("PREVIEW_BASE_DOMAIN", "preview.example.com"),
    controlPlaneToken: requireEnv("CONTROL_PLANE_TOKEN", "dev-token"),
  };
}

export function previewUrlForPr(prNumber: number, previewBaseDomain: string): string {
  return `https://pr-${prNumber}.${previewBaseDomain}`;
}
