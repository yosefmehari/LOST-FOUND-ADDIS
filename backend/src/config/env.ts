import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET || "lost-found-addis-dev-jwt-secret-key-2026",
  DATABASE_URL: process.env.DATABASE_URL || "",
};

if (!env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not defined in environment variables!");
}
