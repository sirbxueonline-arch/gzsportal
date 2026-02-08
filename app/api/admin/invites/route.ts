import { createHash, randomBytes } from "node:crypto";

import { UserRole } from "@prisma/client";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError, normalizeEmail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createInviteSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const user = await getCurrentAppUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return jsonError("Forbidden.", 403);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = createInviteSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid invite data.", 400);
  }

  const client = await prisma.client.findUnique({
    where: {
      id: parsed.data.clientId,
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    return jsonError("Client not found.", 404);
  }

  const token = randomBytes(24).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const invite = await prisma.clientInvite.create({
    data: {
      email: normalizeEmail(parsed.data.email),
      clientId: parsed.data.clientId,
      tokenHash,
      expiresAt: addDays(new Date(), parsed.data.expiresInDays),
    },
  });

  revalidatePath("/admin/invites");

  return NextResponse.json({ id: invite.id, token });
}
