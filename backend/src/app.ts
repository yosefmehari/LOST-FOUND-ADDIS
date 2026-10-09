import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { errorHandler, AppError } from "./middleware/errorHandler.js";

// Import Route Modules
import authRoutes from "./modules/auth/auth.routes.js";
import itemsRoutes from "./modules/items/items.routes.js";
import claimsRoutes from "./modules/claims/claims.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

export const app = express();

// Trust proxy for secure cookies behind proxies/platforms (e.g. Render, Vercel)
app.set("trust proxy", 1);

// CORS configuration supporting frontend cross-origin requests with credentials
app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Safe HTTP Request logging (never logs tokens, passwords, or sensitive payloads)
app.use((req, _res, next) => {
  if (env.NODE_ENV !== "test") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health & Readiness Endpoint
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Lost & Found Addis API is running",
      database: "connected",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: "Lost & Found Addis API is running",
      database: "disconnected",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount API Modules
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route Not Found Handler
app.use((req, _res, next) => {
  next(new AppError(`API endpoint not found: ${req.method} ${req.originalUrl}`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
