import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { uploadDocumentToStorage } from "@/lib/supabase";
import { createDocumentMetadataSchema } from "@/lib/validation/schemas";

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

  const formData = await request.formData();
  const titleInput = formData.get("title");
  const fileInput = formData.get("file");

  const parsedTitle = createDocumentMetadataSchema.safeParse({ title: titleInput });

  if (!parsedTitle.success) {
    return jsonError(parsedTitle.error.issues[0]?.message ?? "Invalid title.", 400);
  }

  if (!(fileInput instanceof File) || fileInput.size === 0) {
    return jsonError("A file is required.", 400);
  }

  const storagePath = await uploadDocumentToStorage({
    clientId,
    file: fileInput,
    filename: fileInput.name,
  });

  const document = await prisma.document.create({
    data: {
      clientId,
      title: parsedTitle.data.title,
      storagePath,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/documents");

  return NextResponse.json({ id: document.id });
}
