import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { DeploymentService } from "../services/deployments.js";
import { parsePullRequestWebhook, verifyGitHubSignature } from "../services/github.js";

export async function registerWebhookRoutes(
  app: FastifyInstance,
  config: AppConfig,
  deploymentService: DeploymentService,
): Promise<void> {
  app.post("/webhooks/github", async (request, reply) => {
    const rawBody = request.rawBody;

    if (!rawBody) {
      return reply.code(400).send({ error: "Missing raw request body" });
    }

    const signature = request.headers["x-hub-signature-256"];
    const signatureValue = Array.isArray(signature) ? signature[0] : signature;

    if (!verifyGitHubSignature(rawBody, signatureValue, config.githubWebhookSecret)) {
      return reply.code(401).send({ error: "Invalid webhook signature" });
    }

    const event = request.headers["x-github-event"];
    const eventName = Array.isArray(event) ? event[0] : event;

    if (eventName !== "pull_request") {
      return reply.send({ ok: true, ignored: true, event: eventName ?? "unknown" });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return reply.code(400).send({ error: "Invalid JSON payload" });
    }

    const webhook = parsePullRequestWebhook(payload);
    if (!webhook) {
      return reply.code(400).send({ error: "Invalid pull_request payload" });
    }

    const { action, pull_request: pr, repository } = webhook;

    if (!["opened", "synchronize", "closed"].includes(action)) {
      return reply.send({ ok: true, ignored: true, action });
    }

    const status = action === "closed" ? "destroyed" : "pending";

    const deployment = await deploymentService.upsertFromPullRequest({
      githubRepo: repository.full_name,
      prNumber: pr.number,
      branch: pr.head.ref,
      commitSha: pr.head.sha,
      status,
    });

    return reply.send({
      ok: true,
      action,
      deployment_id: deployment.id,
      status: deployment.status,
    });
  });
}
