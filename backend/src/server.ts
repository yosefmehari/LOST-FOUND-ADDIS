import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Lost & Found Addis backend running at http://localhost:${env.PORT}`);
  console.log(`⚡ Allowed frontend origin: ${env.FRONTEND_URL}`);
  console.log(`🩺 Health check at http://localhost:${env.PORT}/api/health`);
});

// Graceful shutdown handling
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Database disconnected. Server terminated cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("Error during database disconnection:", err);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));