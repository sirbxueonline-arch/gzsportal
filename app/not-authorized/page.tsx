export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-8 text-amber-900 shadow-sm">
        <h1 className="text-2xl font-semibold">Not Authorized</h1>
        <p className="mt-3 text-sm">
          Your account is authenticated but not linked to a client profile yet. Contact Guluzada Studio support.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/auth/logout"
            className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Log out
          </a>
          <a
            href="mailto:support@guluzada.dev"
            className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-semibold hover:bg-amber-100"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
