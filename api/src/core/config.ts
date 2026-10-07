import "dotenv/config";

const env = process.env;

export const config = {
  env: env.NODE_ENV ?? "development",
  port: Number(env.PORT ?? 4000),
  databaseUrl: env.DATABASE_URL ?? "",
  sessionSecret: env.SESSION_SECRET ?? "",
  appUrl: env.APP_URL ?? "http://localhost:3000",
  apiUrl: env.API_URL ?? "http://localhost:4000",
  termii: {
    mode: (env.TERMII_MODE ?? "mock") as "mock" | "live",
    apiKey: env.TERMII_API_KEY ?? "",
    baseUrl: env.TERMII_BASE_URL ?? "https://v4.api.termii.com",
    deviceId: env.TERMII_DEVICE_ID ?? "dev-placeholder",
    templateId: env.TERMII_TEMPLATE_ID ?? "",
  },
};

export const isMockMode = () => config.termii.mode !== "live";
