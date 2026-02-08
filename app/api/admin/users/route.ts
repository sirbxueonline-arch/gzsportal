import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { upsertAuth0DatabaseUserWithPassword } from "@/lib/auth/auth0-management";
import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError, normalizeEmail } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validation/schemas";

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

  const parsed = createUserSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid user data.", 400);
  }

  const email = normalizeEmail(parsed.data.email);
  let auth0Sub: string | null = null;

  if (parsed.data.password) {
    try {
      auth0Sub = await upsertAuth0DatabaseUserWithPassword(email, parsed.data.password);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not provision the Auth0 account for this user.";

      return jsonError(message, 400);
    }
  }

  const createdUser = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      role: parsed.data.role,
      clientId: parsed.data.role === "ADMIN" ? null : parsed.data.clientId,
      ...(auth0Sub ? { auth0Sub } : {}),
    },
    create: {
      email,
      role: parsed.data.role,
      clientId: parsed.data.role === "ADMIN" ? null : parsed.data.clientId,
      auth0Sub,
    },
  });

  revalidatePath("/admin/users");

  return NextResponse.json({
    id: createdUser.id,
    auth0Provisioned: Boolean(parsed.data.password),
  });
}
