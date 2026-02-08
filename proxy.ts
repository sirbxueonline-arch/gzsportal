import type { NextRequest } from "next/server";

import { refreshSupabaseAuthSession } from "@/lib/supabase-auth";

export async function proxy(request: NextRequest) {
  return refreshSupabaseAuthSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
