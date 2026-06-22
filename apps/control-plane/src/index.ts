import Fastify from "fastify";

const port = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok", service: "control-plane" }));

app.get("/", async () => ({
  service: "control-plane",
  message: "Deploy preview control plane (stub — Part 3 will add webhooks and DB)",
}));

await app.listen({ port, host: "0.0.0.0" });
