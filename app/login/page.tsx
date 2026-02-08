import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentAppUser, getCurrentAuthSessionUser } from "@/lib/auth/session";

import { loginWithPasswordAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const sessionUser = await getCurrentAuthSessionUser();

  if (sessionUser) {
    const appUser = await getCurrentAppUser();
    redirect(appUser ? "/dashboard" : "/not-authorized");
  }

  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Guluzada Studio</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Client Portal Login</h1>
        <p className="mt-3 text-sm text-slate-600">
          Sign in to access your domains, hosting credentials, and project documents.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form action={loginWithPasswordAction} className="mt-6 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="block w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign In
          </button>
        </form>

        <Link href="/" className="mt-3 block text-center text-sm text-slate-600 hover:text-slate-900">
          Back to portal
        </Link>

        <p className="mt-5 text-xs text-slate-500">
          Admin access is granted by <code>ADMIN_EMAILS</code> or user metadata role <code>admin</code>.
        </p>
      </div>
    </main>
  );
}
