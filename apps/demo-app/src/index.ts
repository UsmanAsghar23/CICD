import Fastify from "fastify";

const port = Number(process.env.PORT ?? 3000);

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok", service: "demo-app" }));

app.get("/", async () => ({
  service: "demo-app",
  message: "Deploy preview target (stub — Part 2 will flesh this out)",
  prNumber: process.env.PR_NUMBER ?? "local",
  branch: process.env.BRANCH ?? "main",
  commitSha: process.env.COMMIT_SHA ?? "dev",
  buildTime: process.env.BUILD_TIME ?? new Date().toISOString(),
}));

await app.listen({ port, host: "0.0.0.0" });
