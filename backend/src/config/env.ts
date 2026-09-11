import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export function assertEnvForStart(): void {
  if (!process.env.DATABASE_URL) {
    // Allow boot without DB for health checks; routes using DB will 500 with clear message.
    // eslint-disable-next-line no-console
    console.warn("[placeprep] DATABASE_URL not set — DB routes will fail until configured.");
  }
  if (env.nodeEnv === "production" && env.jwtSecret === "dev-secret-change-me") {
    throw new Error("JWT_SECRET must be set in production");
  }
}
