import Link from "next/link";
import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";
import { getCurrentAppUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await auth0.getSession();

  if (session?.user) {
    const appUser = await getCurrentAppUser();
    redirect(appUser ? "/dashboard" : "/not-authorized");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Guluzada Studio</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Client Portal Login</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in to access your domains, hosting credentials, and project documents.
        </p>

        <div className="mt-6 space-y-3">
          <a
            href="/auth/login"
            className="block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700"
          >
            Client Login
          </a>
          <a
            href="/auth/login?returnTo=%2Fadmin"
            className="block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Admin Login
          </a>
          <Link href="/" className="block text-center text-sm text-slate-600 hover:text-slate-900">
            Back to portal
          </Link>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Admin access requires your email in <code>ADMIN_EMAILS</code> or Auth0 metadata role.
        </p>
      </div>
    </main>
  );
}
