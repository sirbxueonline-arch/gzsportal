import { UserRole } from "@prisma/client";
import { addDays } from "date-fns";

import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAppUser();

  if (user.role === UserRole.ADMIN) {
    const [clientCount, domainCount, hostingCount, openTicketCount] = await prisma.$transaction([
      prisma.client.count(),
      prisma.domain.count(),
      prisma.hosting.count(),
      prisma.supportTicket.count({
        where: {
          status: "OPEN",
        },
      }),
    ]);

    const recentClients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm text-slate-500">Overview</p>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Clients">{clientCount}</Card>
          <Card title="Domains">{domainCount}</Card>
          <Card title="Hosting">{hostingCount}</Card>
          <Card title="Open Tickets">{openTicketCount}</Card>
        </div>

        <Card title="Recent Clients">
          <ul className="space-y-2 text-sm text-slate-700">
            {recentClients.map((client) => (
              <li key={client.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{client.name}</span>
                <span className="text-slate-500">{formatDate(client.createdAt)}</span>
              </li>
            ))}
            {recentClients.length === 0 && <li className="text-slate-500">No clients yet.</li>}
          </ul>
        </Card>
      </div>
    );
  }

  const today = new Date();
  const upcoming = addDays(today, 30);

  const [domainCount, hostingCount, documentCount, openTicketCount, expiringDomains, expiringHosting] =
    await prisma.$transaction([
      prisma.domain.count({
        where: {
          clientId: user.clientId!,
        },
      }),
      prisma.hosting.count({
        where: {
          clientId: user.clientId!,
        },
      }),
      prisma.document.count({
        where: {
          clientId: user.clientId!,
        },
      }),
      prisma.supportTicket.count({
        where: {
          clientId: user.clientId!,
          status: "OPEN",
        },
      }),
      prisma.domain.findMany({
        where: {
          clientId: user.clientId!,
          expiryDate: {
            gte: today,
            lte: upcoming,
          },
        },
        orderBy: {
          expiryDate: "asc",
        },
        take: 5,
      }),
      prisma.hosting.findMany({
        where: {
          clientId: user.clientId!,
          renewalDate: {
            gte: today,
            lte: upcoming,
          },
        },
        orderBy: {
          renewalDate: "asc",
        },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Summary</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Domains">{domainCount}</Card>
        <Card title="Hosting">{hostingCount}</Card>
        <Card title="Documents">{documentCount}</Card>
        <Card title="Open Tickets">{openTicketCount}</Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Domains Expiring Soon" subtitle="Next 30 days">
          <ul className="space-y-2 text-sm text-slate-700">
            {expiringDomains.map((domain) => (
              <li key={domain.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{domain.domainName}</span>
                <span className="text-slate-500">{formatDate(domain.expiryDate)}</span>
              </li>
            ))}
            {expiringDomains.length === 0 && <li className="text-slate-500">No domain renewals due soon.</li>}
          </ul>
        </Card>

        <Card title="Hosting Renewals" subtitle="Next 30 days">
          <ul className="space-y-2 text-sm text-slate-700">
            {expiringHosting.map((hosting) => (
              <li key={hosting.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{hosting.provider}</span>
                <span className="text-slate-500">{formatDate(hosting.renewalDate)}</span>
              </li>
            ))}
            {expiringHosting.length === 0 && <li className="text-slate-500">No hosting renewals due soon.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
