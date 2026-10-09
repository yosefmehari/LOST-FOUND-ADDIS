import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Lost & Found Addis API is running",
      database: "connected",
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: "Lost & Found Addis API is running",
      database: "disconnected",
    });
  }
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});