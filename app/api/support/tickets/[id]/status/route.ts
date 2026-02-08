import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { closeTicketSchema } from "@/lib/validation/schemas";

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

  const parsed = closeTicketSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid status payload.", 400);
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
    },
  });

  if (!ticket) {
    return jsonError("Ticket not found.", 404);
  }

  await prisma.supportTicket.update({
    where: {
      id,
    },
    data: {
      status: parsed.data.status,
    },
  });

  revalidatePath("/support");

  return NextResponse.json({ success: true });
}
