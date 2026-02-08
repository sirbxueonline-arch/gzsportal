import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { upsertSupabaseUserWithPassword } from "@/lib/auth/supabase-management";
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
  let authUserId: string | null = null;

  if (parsed.data.password) {
    try {
      authUserId = await upsertSupabaseUserWithPassword(email, parsed.data.password);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not provision the Supabase Auth account for this user.";

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
      ...(authUserId ? { auth0Sub: authUserId } : {}),
    },
    create: {
      email,
      role: parsed.data.role,
      clientId: parsed.data.role === "ADMIN" ? null : parsed.data.clientId,
      auth0Sub: authUserId,
    },
  });

  revalidatePath("/admin/users");

  return NextResponse.json({
    id: createdUser.id,
    authProvisioned: Boolean(parsed.data.password),
  });
}
