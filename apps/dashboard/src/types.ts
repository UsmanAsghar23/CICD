export type DeploymentStatus = "pending" | "building" | "live" | "failed" | "destroyed";

export interface Deployment {
  id: string;
  pr_number: number;
  branch: string;
  commit_sha: string;
  status: DeploymentStatus;
  preview_url: string | null;
  github_repo: string;
  github_comment_id: number | null;
  created_at: string;
  updated_at: string;
  destroyed_at: string | null;
}

export interface DeploymentsResponse {
  deployments: Deployment[];
}

export interface DeploymentResponse {
  deployment: Deployment;
}
