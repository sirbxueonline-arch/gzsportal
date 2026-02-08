import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateCredentialForm } from "@/components/forms/create-credential-form";
import { CreateDomainForm } from "@/components/forms/create-domain-form";
import { CreateHostingForm } from "@/components/forms/create-hosting-form";
import { UploadDocumentForm } from "@/components/forms/upload-document-form";
import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AdminClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: AdminClientDetailPageProps) {
  await requireAppUser({ adminOnly: true });
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: {
      id,
    },
    include: {
      users: {
        orderBy: {
          createdAt: "desc",
        },
      },
      domains: {
        orderBy: {
          createdAt: "desc",
        },
      },
      hosting: {
        orderBy: {
          createdAt: "desc",
        },
      },
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const credentials = await prisma.credential.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
    select: {
      id: true,
      label: true,
      username: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/admin/clients" className="text-sm text-slate-600 underline-offset-2 hover:underline">
          Back to clients
        </Link>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-slate-600">Primary email: {client.emailPrimary}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Add Credential">
          <CreateCredentialForm clientId={client.id} />
        </Card>

        <Card title="Upload Document">
          <UploadDocumentForm clientId={client.id} />
        </Card>

        <Card title="Add Domain">
          <CreateDomainForm
            clientId={client.id}
            credentials={credentials.map((credential) => ({ id: credential.id, label: credential.label }))}
          />
        </Card>

        <Card title="Add Hosting">
          <CreateHostingForm
            clientId={client.id}
            credentials={credentials.map((credential) => ({ id: credential.id, label: credential.label }))}
          />
        </Card>
      </div>

      <Card title="Domains">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium">Registrar</th>
                <th className="px-3 py-2 font-medium">Expiry</th>
                <th className="px-3 py-2 font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {client.domains.map((domain) => (
                <tr key={domain.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{domain.domainName}</td>
                  <td className="px-3 py-2">{domain.registrar}</td>
                  <td className="px-3 py-2">{formatDate(domain.expiryDate)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/domains/${domain.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {client.domains.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No domains yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Hosting">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Provider</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Renewal</th>
                <th className="px-3 py-2 font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {client.hosting.map((hosting) => (
                <tr key={hosting.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{hosting.provider}</td>
                  <td className="px-3 py-2">{hosting.plan ?? "-"}</td>
                  <td className="px-3 py-2">{formatDate(hosting.renewalDate)}</td>
                  <td className="px-3 py-2">
                    <Link href={`/hosting/${hosting.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {client.hosting.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No hosting records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Documents">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {client.documents.map((document) => (
                <tr key={document.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{document.title}</td>
                  <td className="px-3 py-2">{formatDate(document.createdAt)}</td>
                  <td className="px-3 py-2">
                    <a
                      href={`/api/documents/${document.id}/download`}
                      className="text-slate-900 underline-offset-2 hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
              {client.documents.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    No documents uploaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Assigned Users">
        <ul className="space-y-2 text-sm">
          {client.users.map((assignedUser) => (
            <li key={assignedUser.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {assignedUser.email} ({assignedUser.role})
            </li>
          ))}
          {client.users.length === 0 && <li className="text-slate-500">No linked users.</li>}
        </ul>
      </Card>
    </div>
  );
}
