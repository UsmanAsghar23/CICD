import type { Deployment, DeploymentResponse, DeploymentsResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function apiUrl(path: string): string {
  if (API_BASE) {
    return `${API_BASE.replace(/\/$/, "")}${path}`;
  }
  return path;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const response = await fetch(apiUrl("/api/deployments"));
  const data = await parseJson<DeploymentsResponse>(response);
  return data.deployments;
}

export async function fetchDeployment(id: string): Promise<Deployment> {
  const response = await fetch(apiUrl(`/api/deployments/${id}`));
  const data = await parseJson<DeploymentResponse>(response);
  return data.deployment;
}
