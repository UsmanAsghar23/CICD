export interface DeployMetadata {
  prNumber: string;
  branch: string;
  commitSha: string;
  shortSha: string;
  buildTime: string;
}

export function getDeployMetadata(): DeployMetadata {
  const commitSha = process.env.COMMIT_SHA ?? "dev";
  const buildTime = process.env.BUILD_TIME ?? new Date().toISOString();

  return {
    prNumber: process.env.PR_NUMBER ?? "local",
    branch: process.env.BRANCH ?? "main",
    commitSha,
    shortSha: commitSha.slice(0, 7),
    buildTime,
  };
}
