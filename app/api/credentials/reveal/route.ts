import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { decrypt } from "@/lib/encryption";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { revealCredentialSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const user = await getCurrentAppUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = revealCredentialSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid credential request.", 400);
  }

  const credential = await prisma.credential.findUnique({
    where: {
      id: parsed.data.credentialId,
    },
    include: {
      domains: {
        select: {
          clientId: true,
        },
      },
      hosting: {
        select: {
          clientId: true,
        },
      },
    },
  });

  if (!credential) {
    return jsonError("Credential not found.", 404);
  }

  const clientIds = new Set<string>();
  credential.domains.forEach((domain) => clientIds.add(domain.clientId));
  credential.hosting.forEach((hosting) => clientIds.add(hosting.clientId));

  const authorized =
    user.role === UserRole.ADMIN || (Boolean(user.clientId) && clientIds.has(user.clientId!));

  if (!authorized) {
    return jsonError("Forbidden.", 403);
  }

  const secret = decrypt({
    encryptedSecret: credential.encryptedSecret,
    iv: credential.iv,
    authTag: credential.authTag,
  });

  await prisma.secretAccessLog.create({
    data: {
      userId: user.id,
      credentialId: credential.id,
      action: "REVEAL",
    },
  });

  return NextResponse.json({
    secret,
  });
}
