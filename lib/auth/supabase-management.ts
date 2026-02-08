import type { User as SupabaseUser } from "@supabase/supabase-js";

import { normalizeEmail } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

async function findSupabaseUserByEmail(email: string): Promise<SupabaseUser | null> {
  const supabase = getSupabaseAdminClient();
  const targetEmail = normalizeEmail(email);
  const perPage = 200;

  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list Supabase users: ${error.message}`);
    }

    const users = data.users ?? [];
    const matchedUser = users.find((user) => normalizeEmail(user.email ?? "") === targetEmail);

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < perPage) {
      return null;
    }
  }

  return null;
}

export async function upsertSupabaseUserWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findSupabaseUserByEmail(normalizedEmail);

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (error || !data.user?.id) {
      throw new Error(error?.message ?? "Could not update Supabase Auth user.");
    }

    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  });

  if (error || !data.user?.id) {
    throw new Error(error?.message ?? "Could not create Supabase Auth user.");
  }

  return data.user.id;
}
