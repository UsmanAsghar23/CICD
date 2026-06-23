import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AppConfig } from "../config.js";
import type { DeploymentService } from "../services/deployments.js";
import type { DeploymentStatus } from "../config.js";

const VALID_STATUSES = new Set<DeploymentStatus>([
  "pending",
  "building",
  "live",
  "failed",
  "destroyed",
]);

interface PatchDeploymentBody {
  status?: DeploymentStatus;
  preview_url?: string | null;
  commit_sha?: string;
}

function serializeDeployment(deployment: {
  id: string;
  prNumber: number;
  branch: string;
  commitSha: string;
  status: string;
  previewUrl: string | null;
  githubRepo: string;
  githubCommentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  destroyedAt: Date | null;
}) {
  return {
    id: deployment.id,
    pr_number: deployment.prNumber,
    branch: deployment.branch,
    commit_sha: deployment.commitSha,
    status: deployment.status,
    preview_url: deployment.previewUrl,
    github_repo: deployment.githubRepo,
    github_comment_id: deployment.githubCommentId,
    created_at: deployment.createdAt.toISOString(),
    updated_at: deployment.updatedAt.toISOString(),
    destroyed_at: deployment.destroyedAt?.toISOString() ?? null,
  };
}

function requireControlPlaneAuth(config: AppConfig) {
  return async function authorize(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token || token !== config.controlPlaneToken) {
      await reply.code(401).send({ error: "Unauthorized" });
    }
  };
}

export async function registerDeploymentRoutes(
  app: FastifyInstance,
  config: AppConfig,
  deploymentService: DeploymentService,
): Promise<void> {
  const authorize = requireControlPlaneAuth(config);

  app.get("/api/deployments", async (_request, reply) => {
    const items = await deploymentService.listDeployments();
    return reply.send({ deployments: items.map(serializeDeployment) });
  });

  app.get<{ Params: { id: string } }>("/api/deployments/:id", async (request, reply) => {
    const deployment = await deploymentService.getDeployment(request.params.id);

    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    return reply.send({ deployment: serializeDeployment(deployment) });
  });

  app.patch<{ Params: { id: string }; Body: PatchDeploymentBody }>(
    "/api/deployments/:id",
    { preHandler: authorize },
    async (request, reply) => {
      const { status, preview_url: previewUrl, commit_sha: commitSha } = request.body ?? {};

      if (status && !VALID_STATUSES.has(status)) {
        return reply.code(400).send({ error: "Invalid status" });
      }

      const deployment = await deploymentService.updateDeployment(request.params.id, {
        status,
        previewUrl,
        commitSha,
      });

      if (!deployment) {
        return reply.code(404).send({ error: "Deployment not found" });
      }

      return reply.send({ deployment: serializeDeployment(deployment) });
    },
  );
}
