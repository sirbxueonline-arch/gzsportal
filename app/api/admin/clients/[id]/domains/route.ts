import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createDomainSchema, toDateOrNull } from "@/lib/validation/schemas";

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

  const parsed = createDomainSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid domain data.", 400);
  }

  if (parsed.data.credentialId) {
    const credential = await prisma.credential.findUnique({
      where: {
        id: parsed.data.credentialId,
      },
      select: {
        id: true,
      },
    });

    if (!credential) {
      return jsonError("Credential not found.", 404);
    }
  }

  const domain = await prisma.domain.create({
    data: {
      clientId,
      domainName: parsed.data.domainName,
      registrar: parsed.data.registrar,
      expiryDate: toDateOrNull(parsed.data.expiryDate),
      autoRenew: parsed.data.autoRenew,
      nameservers: parsed.data.nameservers,
      loginUrl: parsed.data.loginUrl,
      credentialId: parsed.data.credentialId,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/domains");

  return NextResponse.json({ id: domain.id });
}
