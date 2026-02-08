"use server";

import { redirect } from "next/navigation";

import { getSupabaseServerAuthClient } from "@/lib/supabase-auth";

function normalizeValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toErrorLoginUrl(path: "/login" | "/alogin", message: string): string {
  return `${path}?error=${encodeURIComponent(message)}`;
}

async function signInWithPassword(options: {
  formData: FormData;
  successPath: "/" | "/admin";
  errorPath: "/login" | "/alogin";
}): Promise<void> {
  const email = normalizeValue(options.formData.get("email")).toLowerCase();
  const password = normalizeValue(options.formData.get("password"));

  if (!email || !password) {
    redirect(toErrorLoginUrl(options.errorPath, "Email and password are required."));
  }

  const supabase = await getSupabaseServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(toErrorLoginUrl(options.errorPath, error.message));
  }

  redirect(options.successPath);
}

export async function loginWithPasswordAction(formData: FormData): Promise<void> {
  return signInWithPassword({
    formData,
    successPath: "/",
    errorPath: "/login",
  });
}

export async function adminLoginWithPasswordAction(formData: FormData): Promise<void> {
  return signInWithPassword({
    formData,
    successPath: "/admin",
    errorPath: "/alogin",
  });
}
