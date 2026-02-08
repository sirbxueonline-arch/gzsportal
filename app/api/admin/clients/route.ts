import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError, normalizeEmail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validation/schemas";

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

  const parsed = createClientSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid client data.", 400);
  }

  const createdClient = await prisma.client.create({
    data: {
      name: parsed.data.name,
      company: parsed.data.company,
      emailPrimary: normalizeEmail(parsed.data.emailPrimary),
      phone: parsed.data.phone,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/admin/clients");

  return NextResponse.json({ id: createdClient.id });
}
