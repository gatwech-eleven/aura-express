import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import logger from "@/shared/core/logger";

// CORS configuration - support multiple origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

export { allowedOrigins };

export function createApp(): Application {
  const app: Application = express();

  app.set("trust proxy", 1);

  // Basic middleware
  app.use(cookieParser());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );

  // Request logging
  app.use((req, res, next) => {
    logger.info(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // Stricter limit for write operations (create, update, delete)
  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  });

  // More lenient limit for read operations (GET requests)
  const readLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please slow down.",
  });

  // Apply appropriate limiter based on request method
  app.use((req, res, next) => {
    if (req.path.includes("/link-preview")) {
      return next();
    }

    if (req.method === "GET") {
      readLimiter(req, res, next);
    } else {
      writeLimiter(req, res, next);
    }
  });

  return app;
}
