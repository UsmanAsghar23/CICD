import Fastify from "fastify";
import { getDeployMetadata } from "./config.js";
import { renderPreviewPage } from "./page.js";

const port = Number(process.env.PORT ?? 3000);

const app = Fastify({ logger: true });

app.get("/health", async (_request, reply) => {
  return reply.code(200).send({ status: "ok", service: "demo-app" });
});

app.get("/", async (_request, reply) => {
  const meta = getDeployMetadata();
  return reply.type("text/html").send(renderPreviewPage(meta));
});

await app.listen({ port, host: "0.0.0.0" });
