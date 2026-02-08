import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createHostingSchema, toDateOrNull } from "@/lib/validation/schemas";

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

  const parsed = createHostingSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid hosting data.", 400);
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

  const hosting = await prisma.hosting.create({
    data: {
      clientId,
      provider: parsed.data.provider,
      plan: parsed.data.plan,
      renewalDate: toDateOrNull(parsed.data.renewalDate),
      region: parsed.data.region,
      controlPanelUrl: parsed.data.controlPanelUrl,
      credentialId: parsed.data.credentialId,
      notes: parsed.data.notes,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/hosting");

  return NextResponse.json({ id: hosting.id });
}
