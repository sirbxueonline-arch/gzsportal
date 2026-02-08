"use client";

import Link from "next/link";

type PortalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PortalError({ error, reset }: PortalErrorProps) {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Guluzada Studio</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600">
            We couldn&apos;t load this page. Try again, or return to the portal home.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Portal Home
            </Link>
            <a
              href="/logout"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Log Out
            </a>
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Technical details (for admins)
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
}

