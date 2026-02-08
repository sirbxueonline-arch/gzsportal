"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="mx-auto flex w-full max-w-xl flex-col justify-center py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Guluzada Studio</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Portal Error</h1>
          <p className="mt-3 text-sm text-slate-600">
            Something went wrong while loading the portal. Try again, or log out and sign back in.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Try Again
            </button>
            <a
              href="/logout"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Log Out
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Go To Login
            </Link>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Technical details (for admins)
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
            <p className="mt-3 text-xs text-slate-600">
              Common cause: a misconfigured <code>DATABASE_URL</code> (Supabase connection pooler) in Vercel environment
              variables.
            </p>
          </details>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need help?{" "}
          <a href="mailto:support@guluzada.dev" className="font-semibold text-slate-700 hover:text-slate-900">
            Contact support
          </a>
          .
        </p>
      </div>
    </main>
  );
}

