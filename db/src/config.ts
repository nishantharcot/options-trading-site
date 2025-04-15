import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production"
export const redisUrl = isProduction
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  : "redis://localhost:6379";

export const filePath = isProduction ? "/app/snapshots/" : "";