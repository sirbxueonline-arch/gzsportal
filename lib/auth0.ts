import { Auth0Client } from "@auth0/nextjs-auth0/server";

const isProduction = process.env.NODE_ENV === "production";
const fallbackSecret =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const domain =
  process.env.AUTH0_DOMAIN ??
  process.env.AUTH0_ISSUER_BASE_URL ??
  "https://example.us.auth0.com";

const appBaseUrl = process.env.AUTH0_BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
const clientId = process.env.AUTH0_CLIENT_ID ?? "dev-client-id";
const clientSecret = process.env.AUTH0_CLIENT_SECRET ?? "dev-client-secret";
const secret = process.env.AUTH0_SECRET ?? fallbackSecret;

if (isProduction) {
  const requiredVars = [
    "AUTH0_CLIENT_ID",
    "AUTH0_CLIENT_SECRET",
    "AUTH0_SECRET",
    "AUTH0_BASE_URL",
    "AUTH0_ISSUER_BASE_URL",
  ];

  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.warn(`Missing required Auth0 environment variables: ${missing.join(", ")}`);
  }
}

export const auth0 = new Auth0Client({
  domain,
  clientId,
  clientSecret,
  appBaseUrl,
  secret,
  signInReturnToPath: "/dashboard",
});
