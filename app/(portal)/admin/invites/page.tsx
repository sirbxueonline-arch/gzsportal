import { InviteForm } from "@/components/forms/invite-form";
import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  await requireAppUser({ adminOnly: true });

  const [clients, invites] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.clientInvite.findMany({
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Client Invites</h1>
        <p className="text-sm text-slate-600">Generate invite records for first-time client access.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card title="Generate Invite">
          <InviteForm clients={clients} />
        </Card>

        <Card title="Invite History">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Expires</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invites.map((invite) => {
                  const used = Boolean(invite.usedAt);

                  return (
                    <tr key={invite.id}>
                      <td className="px-3 py-2">{invite.email}</td>
                      <td className="px-3 py-2">{invite.client.name}</td>
                      <td className="px-3 py-2">{formatDate(invite.expiresAt)}</td>
                      <td className="px-3 py-2">
                        {used ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Used
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {invites.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={4}>
                      No invites generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
