import { UserRole } from "@prisma/client";

import { SupportTicketForm } from "@/components/forms/support-ticket-form";
import { TicketStatusToggle } from "@/components/ticket-status-toggle";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireAppUser();

  const tickets = await prisma.supportTicket.findMany({
    where: user.role === "ADMIN" ? {} : { clientId: user.clientId! },
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
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-sm text-slate-600">Track open requests and submit new tickets.</p>
      </header>

      {user.role === UserRole.CLIENT && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Open a Ticket</h2>
          <div className="mt-3">
            <SupportTicketForm />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Ticket History</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Subject</th>
                {user.role === UserRole.ADMIN && <th className="px-3 py-2 font-medium">Client</th>}
                <th className="px-3 py-2 font-medium">Status</th>
                {user.role === UserRole.ADMIN && <th className="px-3 py-2 font-medium">Action</th>}
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-slate-600">{ticket.message}</p>
                  </td>
                  {user.role === UserRole.ADMIN && <td className="px-3 py-2">{ticket.client.name}</td>}
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        ticket.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  {user.role === UserRole.ADMIN && (
                    <td className="px-3 py-2">
                      <TicketStatusToggle ticketId={ticket.id} status={ticket.status} />
                    </td>
                  )}
                  <td className="px-3 py-2">{formatDate(ticket.createdAt)}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={user.role === UserRole.ADMIN ? 5 : 3}>
                    No tickets yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
