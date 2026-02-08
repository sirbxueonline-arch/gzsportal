import { createClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "client-documents";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  return { url, serviceRoleKey };
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function uploadDocumentToStorage(options: {
  clientId: string;
  file: File;
  filename: string;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const safeName = sanitizeFileName(options.filename);
  const storagePath = `${options.clientId}/${Date.now()}-${safeName}`;
  const bytes = await options.file.arrayBuffer();

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, Buffer.from(bytes), {
      contentType: options.file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

export async function createSignedDocumentUrl(
  storagePath: string,
  expiresInSeconds = 120,
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not generate signed download URL.");
  }

  return data.signedUrl;
}
