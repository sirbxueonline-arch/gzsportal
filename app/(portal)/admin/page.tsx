import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireAppUser({ adminOnly: true });

  const [clientCount, domainCount, hostingCount, userCount, openTickets, recentReveals] = await Promise.all([
    prisma.client.count(),
    prisma.domain.count(),
    prisma.hosting.count(),
    prisma.user.count(),
    prisma.supportTicket.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.secretAccessLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        credential: {
          select: {
            label: true,
          },
        },
      },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Administration</p>
        <h1 className="text-2xl font-semibold">Portal Control Center</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card title="Clients">{clientCount}</Card>
        <Card title="Users">{userCount}</Card>
        <Card title="Domains">{domainCount}</Card>
        <Card title="Hosting">{hostingCount}</Card>
        <Card title="Open Tickets">{openTickets}</Card>
      </div>

      <Card title="Recent Secret Reveal Activity" subtitle="Every reveal is logged server-side.">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Credential</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {recentReveals.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2">{log.user.email}</td>
                  <td className="px-3 py-2">{log.credential.label}</td>
                  <td className="px-3 py-2">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
              {recentReveals.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    No reveals logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
