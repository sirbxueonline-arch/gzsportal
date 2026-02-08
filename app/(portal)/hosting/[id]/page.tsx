import { notFound } from "next/navigation";

import { SecretRevealButton } from "@/components/secret-reveal-button";
import { canAccessClient } from "@/lib/auth/authorization";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HostingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HostingDetailPage({ params }: HostingDetailPageProps) {
  const user = await requireAppUser();
  const { id } = await params;

  const hosting = await prisma.hosting.findUnique({
    where: {
      id,
    },
    include: {
      client: true,
      credential: {
        select: {
          id: true,
          label: true,
          username: true,
        },
      },
    },
  });

  if (!hosting || !canAccessClient(user, hosting.clientId)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Hosting Detail</p>
        <h1 className="text-2xl font-semibold">{hosting.provider}</h1>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Client</p>
          <p className="mt-1 text-sm text-slate-900">{hosting.client.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Plan</p>
          <p className="mt-1 text-sm text-slate-900">{hosting.plan ?? "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Renewal Date</p>
          <p className="mt-1 text-sm text-slate-900">{formatDate(hosting.renewalDate)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Region</p>
          <p className="mt-1 text-sm text-slate-900">{hosting.region ?? "-"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Control Panel URL</p>
          <p className="mt-1 text-sm text-slate-900">{hosting.controlPanelUrl ?? "-"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{hosting.notes ?? "-"}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Credential</h2>
        {hosting.credential ? (
          <div className="mt-3 space-y-3 text-sm">
            <p>
              <span className="font-medium">Label:</span> {hosting.credential.label}
            </p>
            <p>
              <span className="font-medium">Username:</span> {hosting.credential.username ?? "-"}
            </p>
            <p>
              <span className="font-medium">Password/API Key:</span> ********
            </p>
            <SecretRevealButton credentialId={hosting.credential.id} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No credential attached.</p>
        )}
      </section>
    </div>
  );
}
