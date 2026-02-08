"use server";

import { redirect } from "next/navigation";

import { getSupabaseServerAuthClient } from "@/lib/supabase-auth";

function normalizeValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toErrorLoginUrl(message: string): string {
  return `/login?error=${encodeURIComponent(message)}`;
}

export async function loginWithPasswordAction(formData: FormData): Promise<void> {
  const email = normalizeValue(formData.get("email")).toLowerCase();
  const password = normalizeValue(formData.get("password"));

  if (!email || !password) {
    redirect(toErrorLoginUrl("Email and password are required."));
  }

  const supabase = await getSupabaseServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(toErrorLoginUrl(error.message));
  }

  redirect("/");
}
