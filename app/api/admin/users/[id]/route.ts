import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validation/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentAppUser();

  if (!user || user.role !== UserRole.ADMIN) {
    return jsonError("Forbidden.", 403);
  }

  const { id } = await params;

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = updateUserSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid user update payload.", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!existingUser) {
    return jsonError("User not found.", 404);
  }

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: parsed.data.role,
      clientId: parsed.data.role === "ADMIN" ? null : parsed.data.clientId,
    },
  });

  revalidatePath("/admin/users");

  return NextResponse.json({ success: true });
}
