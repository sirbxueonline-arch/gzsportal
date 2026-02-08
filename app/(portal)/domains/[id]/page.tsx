import { notFound } from "next/navigation";

import { SecretRevealButton } from "@/components/secret-reveal-button";
import { canAccessClient } from "@/lib/auth/authorization";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DomainDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const user = await requireAppUser();
  const { id } = await params;

  const domain = await prisma.domain.findUnique({
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

  if (!domain || !canAccessClient(user, domain.clientId)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Domain Detail</p>
        <h1 className="text-2xl font-semibold">{domain.domainName}</h1>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Client</p>
          <p className="mt-1 text-sm text-slate-900">{domain.client.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Registrar</p>
          <p className="mt-1 text-sm text-slate-900">{domain.registrar}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Expiry Date</p>
          <p className="mt-1 text-sm text-slate-900">{formatDate(domain.expiryDate)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Auto Renew</p>
          <p className="mt-1 text-sm text-slate-900">{domain.autoRenew === null ? "-" : domain.autoRenew ? "Yes" : "No"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Nameservers</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{domain.nameservers || "-"}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Credential</h2>
        {domain.credential ? (
          <div className="mt-3 space-y-3 text-sm">
            <p>
              <span className="font-medium">Label:</span> {domain.credential.label}
            </p>
            <p>
              <span className="font-medium">Username:</span> {domain.credential.username ?? "-"}
            </p>
            <p>
              <span className="font-medium">Password/API Key:</span> ********
            </p>
            <SecretRevealButton credentialId={domain.credential.id} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No credential attached.</p>
        )}
      </section>
    </div>
  );
}
