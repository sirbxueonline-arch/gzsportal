import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HostingPage() {
  const user = await requireAppUser();

  const hosting = await prisma.hosting.findMany({
    where: user.role === "ADMIN" ? {} : { clientId: user.clientId! },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      provider: "asc",
    },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Hosting</h1>
        <p className="text-sm text-slate-600">Infrastructure and access details for deployed sites.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Provider</th>
              {user.role === "ADMIN" && <th className="px-3 py-2 font-medium">Client</th>}
              <th className="px-3 py-2 font-medium">Plan</th>
              <th className="px-3 py-2 font-medium">Renewal</th>
              <th className="px-3 py-2 font-medium">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {hosting.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-2 font-medium text-slate-900">{record.provider}</td>
                {user.role === "ADMIN" && <td className="px-3 py-2">{record.client.name}</td>}
                <td className="px-3 py-2">{record.plan ?? "-"}</td>
                <td className="px-3 py-2">{formatDate(record.renewalDate)}</td>
                <td className="px-3 py-2">
                  <Link href={`/hosting/${record.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {hosting.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={user.role === "ADMIN" ? 5 : 4}>
                  No hosting records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
