import { betterAuth } from "better-auth";

const REQUIRED_AUTH_SETTINGS = [
  "DB",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET"
];

export function getMissingAuthConfiguration(env = {}) {
  return REQUIRED_AUTH_SETTINGS.filter((key) => {
    if (key === "DB") return !env.DB;
    return typeof env[key] !== "string" || env[key].trim().length === 0;
  });
}

export function createAuth(env) {
  const missing = getMissingAuthConfiguration(env);
  if (missing.length > 0) {
    throw new Error(`Missing authentication configuration: ${missing.join(", ")}`);
  }

  if (env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }

  const baseURL = new URL(env.BETTER_AUTH_URL);
  if (baseURL.protocol !== "https:" && baseURL.hostname !== "localhost" && baseURL.hostname !== "127.0.0.1") {
    throw new Error("BETTER_AUTH_URL must use HTTPS outside local development");
  }

  const trustedOrigins = new Set([
    baseURL.origin,
    ...(env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  ]);

  return betterAuth({
    appName: "dianAI",
    baseURL: baseURL.origin,
    basePath: "/api/auth",
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [...trustedOrigins],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      }
    },
    account: {
      encryptOAuthTokens: true
    },
    advanced: {
      useSecureCookies: baseURL.protocol === "https:"
    }
  });
}
