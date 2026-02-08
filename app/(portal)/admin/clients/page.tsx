import Link from "next/link";

import { CreateClientForm } from "@/components/forms/create-client-form";
import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireAppUser({ adminOnly: true });

  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          domains: true,
          hosting: true,
          users: true,
          documents: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-slate-600">Create and manage client records and linked assets.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card title="Client Directory">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Records</th>
                  <th className="px-3 py-2 font-medium">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-3 py-2 font-medium text-slate-900">{client.name}</td>
                    <td className="px-3 py-2">{client.emailPrimary}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {client._count.domains} domains / {client._count.hosting} hosting / {client._count.documents} docs
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/admin/clients/${client.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={4}>
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Create Client">
          <CreateClientForm />
        </Card>
      </div>
    </div>
  );
}
