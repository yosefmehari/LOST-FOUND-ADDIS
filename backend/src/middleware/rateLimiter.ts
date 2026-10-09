import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Stricter rate limit for authentication routes to prevent credential stuffing & brute-force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many login/registration attempts. Please try again after 15 minutes.",
  },
});

// General API write limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Rate limit exceeded. Please try again later.",
  },
});
