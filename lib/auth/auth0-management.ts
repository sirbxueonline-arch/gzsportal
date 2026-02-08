type Auth0UserRecord = {
  user_id?: string;
  identities?: Array<{
    connection?: string;
  }>;
};

function toIssuerBaseUrl(value: string): string {
  const trimmed = value.trim();
  const prefixed = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return prefixed.replace(/\/+$/, "");
}

function getIssuerBaseUrl(): string {
  const raw = process.env.AUTH0_ISSUER_BASE_URL ?? process.env.AUTH0_DOMAIN;

  if (!raw) {
    throw new Error("Auth0 issuer URL is missing. Set AUTH0_ISSUER_BASE_URL.");
  }

  return toIssuerBaseUrl(raw);
}

function getDatabaseConnection(): string {
  const connection = process.env.AUTH0_DB_CONNECTION?.trim();

  if (!connection) {
    throw new Error("AUTH0_DB_CONNECTION is required to create users with passwords.");
  }

  return connection;
}

function getManagementClientCredentials() {
  const clientId = process.env.AUTH0_M2M_CLIENT_ID?.trim() || process.env.AUTH0_CLIENT_ID?.trim();
  const clientSecret =
    process.env.AUTH0_M2M_CLIENT_SECRET?.trim() || process.env.AUTH0_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Auth0 Management API credentials. Set AUTH0_M2M_CLIENT_ID and AUTH0_M2M_CLIENT_SECRET.",
    );
  }

  return { clientId, clientSecret };
}

function getManagementAudience(issuerBaseUrl: string): string {
  return process.env.AUTH0_MANAGEMENT_AUDIENCE?.trim() || `${issuerBaseUrl}/api/v2/`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const messageCandidates = [record.error_description, record.message, record.error];

  for (const candidate of messageCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return fallback;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getManagementAccessToken(issuerBaseUrl: string): Promise<string> {
  const { clientId, clientSecret } = getManagementClientCredentials();
  const audience = getManagementAudience(issuerBaseUrl);

  const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
    cache: "no-store",
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to get Auth0 Management API token."));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid response from Auth0 token endpoint.");
  }

  const accessToken = (payload as Record<string, unknown>).access_token;

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Auth0 token endpoint did not return an access token.");
  }

  return accessToken;
}

async function fetchUsersByEmail(
  issuerBaseUrl: string,
  token: string,
  email: string,
): Promise<Auth0UserRecord[]> {
  const usersByEmailUrl = new URL(`${issuerBaseUrl}/api/v2/users-by-email`);
  usersByEmailUrl.searchParams.set("email", email);

  const response = await fetch(usersByEmailUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to look up Auth0 user by email."));
  }

  if (!Array.isArray(payload)) {
    throw new Error("Unexpected response while looking up Auth0 user.");
  }

  return payload as Auth0UserRecord[];
}

async function createAuth0User(
  issuerBaseUrl: string,
  token: string,
  connection: string,
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${issuerBaseUrl}/api/v2/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection,
      email,
      password,
      verify_email: true,
      email_verified: false,
    }),
    cache: "no-store",
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, "Failed to create Auth0 user."));
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected response while creating Auth0 user.");
  }

  const userId = (payload as Record<string, unknown>).user_id;

  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Auth0 user create response did not return user_id.");
  }

  return userId;
}

async function updateAuth0Password(
  issuerBaseUrl: string,
  token: string,
  connection: string,
  userId: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${issuerBaseUrl}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection,
      password,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await parseJsonSafe(response);
    throw new Error(extractErrorMessage(payload, "Failed to update Auth0 user password."));
  }
}

export async function upsertAuth0DatabaseUserWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const issuerBaseUrl = getIssuerBaseUrl();
  const connection = getDatabaseConnection();
  const token = await getManagementAccessToken(issuerBaseUrl);
  const users = await fetchUsersByEmail(issuerBaseUrl, token, email);

  const dbUser = users.find((user) =>
    user.identities?.some((identity) => identity.connection === connection),
  );

  if (dbUser?.user_id) {
    await updateAuth0Password(issuerBaseUrl, token, connection, dbUser.user_id, password);
    return dbUser.user_id;
  }

  if (users.length > 0) {
    throw new Error(
      `A user already exists in Auth0 for ${email}, but not in the '${connection}' database connection.`,
    );
  }

  return createAuth0User(issuerBaseUrl, token, connection, email, password);
}
