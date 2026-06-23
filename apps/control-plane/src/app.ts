import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { AppConfig } from "./config.js";
import type { Database } from "./db/client.js";
import { registerDeploymentRoutes } from "./routes/deployments.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { DeploymentService } from "./services/deployments.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

export async function buildApp(config: AppConfig, db: Database): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const deploymentService = new DeploymentService(db, config);

  await app.register(cors, {
    origin: true,
  });

  app.addHook("preParsing", async (request, _reply, payload) => {
    if (request.url !== "/webhooks/github") {
      return payload;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of payload) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    const rawBody = Buffer.concat(chunks);
    request.rawBody = rawBody;
    return rawBody;
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (request, body, done) => {
      if (request.url === "/webhooks/github") {
        done(null, body);
        return;
      }

      try {
        done(null, JSON.parse(body.toString("utf8")));
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );

  app.get("/health", async () => ({ status: "ok", service: "control-plane" }));

  app.get("/", async () => ({
    service: "control-plane",
    endpoints: [
      "POST /webhooks/github",
      "GET /api/deployments",
      "GET /api/deployments/:id",
      "PATCH /api/deployments/:id",
    ],
  }));

  await registerDeploymentRoutes(app, config, deploymentService);
  await registerWebhookRoutes(app, config, deploymentService);

  return app;
}
