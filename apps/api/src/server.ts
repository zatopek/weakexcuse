import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { authMiddleware } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { groupRoutes } from "./routes/groups.js";
import { incidentRoutes } from "./routes/incidents.js";
import { voteRoutes } from "./routes/votes.js";
import { reactionRoutes } from "./routes/reactions.js";
import { statsRoutes } from "./routes/stats.js";
import { startExpireIncidentsJob } from "./jobs/expire-incidents.js";

const app = Fastify({ logger: true });

await app.register(cors);

// Public routes
app.get("/health", async () => {
  return { status: "ok" };
});

// Protected routes — all require auth
app.register(async (protectedScope) => {
  protectedScope.addHook("onRequest", authMiddleware);

  await protectedScope.register(authRoutes);
  await protectedScope.register(groupRoutes);
  await protectedScope.register(incidentRoutes);
  await protectedScope.register(voteRoutes);
  await protectedScope.register(reactionRoutes);
  await protectedScope.register(statsRoutes);
});

// Start background jobs
startExpireIncidentsJob();

const start = async () => {
  try {
    await app.listen({ port: 3001, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
