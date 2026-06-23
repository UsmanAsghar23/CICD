import { and, desc, eq } from "drizzle-orm";
import type { DeploymentStatus, AppConfig } from "../config.js";
import { previewUrlForPr } from "../config.js";
import type { Database } from "../db/client.js";
import { deployments, type Deployment } from "../db/schema.js";
import { upsertPullRequestComment } from "./github.js";

export interface UpdateDeploymentInput {
  status?: DeploymentStatus;
  previewUrl?: string | null;
  commitSha?: string;
}

export class DeploymentService {
  constructor(
    private readonly db: Database,
    private readonly config: AppConfig,
  ) {}

  async listDeployments(): Promise<Deployment[]> {
    return this.db.select().from(deployments).orderBy(desc(deployments.createdAt));
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    const [deployment] = await this.db
      .select()
      .from(deployments)
      .where(eq(deployments.id, id))
      .limit(1);

    return deployment;
  }

  async getByRepoAndPr(githubRepo: string, prNumber: number): Promise<Deployment | undefined> {
    const [deployment] = await this.db
      .select()
      .from(deployments)
      .where(and(eq(deployments.githubRepo, githubRepo), eq(deployments.prNumber, prNumber)))
      .limit(1);

    return deployment;
  }

  async upsertFromPullRequest(input: {
    githubRepo: string;
    prNumber: number;
    branch: string;
    commitSha: string;
    status: DeploymentStatus;
  }): Promise<Deployment> {
    const existing = await this.getByRepoAndPr(input.githubRepo, input.prNumber);
    const previewUrl =
      input.status === "live"
        ? previewUrlForPr(input.prNumber, this.config.previewBaseDomain)
        : existing?.previewUrl;

    if (existing) {
      const [updated] = await this.db
        .update(deployments)
        .set({
          branch: input.branch,
          commitSha: input.commitSha,
          status: input.status,
          previewUrl,
          updatedAt: new Date(),
          destroyedAt: input.status === "destroyed" ? new Date() : null,
        })
        .where(eq(deployments.id, existing.id))
        .returning();

      await this.syncPullRequestComment(updated);
      return updated;
    }

    const [created] = await this.db
      .insert(deployments)
      .values({
        githubRepo: input.githubRepo,
        prNumber: input.prNumber,
        branch: input.branch,
        commitSha: input.commitSha,
        status: input.status,
        previewUrl,
      })
      .returning();

    await this.syncPullRequestComment(created);
    return created;
  }

  async updateDeployment(id: string, input: UpdateDeploymentInput): Promise<Deployment | undefined> {
    const existing = await this.getDeployment(id);
    if (!existing) {
      return undefined;
    }

    const status = input.status ?? (existing.status as DeploymentStatus);
    const commitSha = input.commitSha ?? existing.commitSha;
    const previewUrl =
      input.previewUrl ??
      (status === "live"
        ? previewUrlForPr(existing.prNumber, this.config.previewBaseDomain)
        : existing.previewUrl);

    const [updated] = await this.db
      .update(deployments)
      .set({
        status,
        commitSha,
        previewUrl,
        updatedAt: new Date(),
        destroyedAt: status === "destroyed" ? new Date() : existing.destroyedAt,
      })
      .where(eq(deployments.id, id))
      .returning();

    await this.syncPullRequestComment(updated);
    return updated;
  }

  private async syncPullRequestComment(deployment: Deployment): Promise<void> {
    try {
      const commentId = await upsertPullRequestComment({
        token: this.config.githubToken,
        repo: deployment.githubRepo,
        prNumber: deployment.prNumber,
        status: deployment.status as DeploymentStatus,
        previewUrl: deployment.previewUrl,
        commitSha: deployment.commitSha,
        existingCommentId: deployment.githubCommentId,
      });

      if (commentId && commentId !== deployment.githubCommentId) {
        await this.db
          .update(deployments)
          .set({ githubCommentId: commentId })
          .where(eq(deployments.id, deployment.id));
      }
    } catch (error) {
      console.error("Failed to sync GitHub PR comment:", error);
    }
  }
}
