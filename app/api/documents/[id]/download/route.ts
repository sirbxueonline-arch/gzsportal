import { NextResponse } from "next/server";

import { canAccessClient } from "@/lib/auth/authorization";
import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createSignedDocumentUrl } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const user = await getCurrentAppUser();

  if (!user) {
    return jsonError("Unauthorized.", 401);
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      clientId: true,
      storagePath: true,
    },
  });

  if (!document) {
    return jsonError("Document not found.", 404);
  }

  if (!canAccessClient(user, document.clientId)) {
    return jsonError("Forbidden.", 403);
  }

  const signedUrl = await createSignedDocumentUrl(document.storagePath);

  return NextResponse.redirect(signedUrl);
}
