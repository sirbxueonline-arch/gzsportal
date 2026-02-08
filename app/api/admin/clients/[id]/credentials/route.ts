import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { encrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { createCredentialSchema } from "@/lib/validation/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentAppUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return jsonError("Forbidden.", 403);
  }

  const { id: clientId } = await params;

  const client = await prisma.client.findUnique({
    where: {
      id: clientId,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    return jsonError("Client not found.", 404);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = createCredentialSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid credential data.", 400);
  }

  const encryptedPayload = encrypt(parsed.data.secret);

  const credential = await prisma.credential.create({
    data: {
      label: parsed.data.label,
      username: parsed.data.username,
      encryptedSecret: encryptedPayload.encryptedSecret,
      iv: encryptedPayload.iv,
      authTag: encryptedPayload.authTag,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);

  return NextResponse.json({ id: credential.id });
}
