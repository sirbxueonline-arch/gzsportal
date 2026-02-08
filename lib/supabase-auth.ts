import { createServerClient } from "@supabase/ssr";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

type SupabaseAuthConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseAuthConfig(): SupabaseAuthConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required for authentication.");
  }

  return { url, anonKey };
}

export async function getSupabaseServerAuthClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseAuthConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not be able to mutate cookies directly.
        }
      },
    },
  });
}

export async function getCurrentSupabaseAuthUser(): Promise<SupabaseAuthUser | null> {
  const supabase = await getSupabaseServerAuthClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function refreshSupabaseAuthSession(request: NextRequest): Promise<NextResponse> {
  const { url, anonKey } = getSupabaseAuthConfig();
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
