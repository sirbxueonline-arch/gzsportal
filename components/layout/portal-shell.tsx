import { UserRole } from "@prisma/client";

import type { AppUser } from "@/lib/auth/session";
import { SidebarNav } from "@/components/layout/sidebar-nav";

type PortalShellProps = {
  user: AppUser;
  children: React.ReactNode;
};

const clientItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/domains", label: "Domains" },
  { href: "/hosting", label: "Hosting" },
  { href: "/documents", label: "Documents" },
  { href: "/support", label: "Support" },
];

const adminItems = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/invites", label: "Invites" },
];

export function PortalShell({ user, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:px-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Guluzada Studio</p>
            <h1 className="mt-1 text-lg font-semibold">Client Portal</h1>
          </div>

          <SidebarNav items={clientItems} />

          {user.role === UserRole.ADMIN && (
            <>
              <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Administration
              </p>
              <SidebarNav items={adminItems} />
            </>
          )}

          <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <p className="truncate font-medium text-slate-900">{user.email}</p>
            <p className="mt-1">Role: {user.role}</p>
            <a
              href="/logout"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Log out
            </a>
          </div>
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">{children}</main>
      </div>
    </div>
  );
}
