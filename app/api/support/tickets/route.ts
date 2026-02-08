import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createSupportTicketSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const user = await getCurrentAppUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  if (user.role !== UserRole.CLIENT || !user.clientId) {
    return jsonError("Only client users can open support tickets from this endpoint.", 403);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = createSupportTicketSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid ticket data.", 400);
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      clientId: user.clientId,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "OPEN",
    },
  });

  revalidatePath("/support");

  return NextResponse.json({ id: ticket.id });
}
