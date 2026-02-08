import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const user = await requireAppUser();

  const domains = await prisma.domain.findMany({
    where: user.role === "ADMIN" ? {} : { clientId: user.clientId! },
    include: {
      client: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      domainName: "asc",
    },
  });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Domains</h1>
        <p className="text-sm text-slate-600">Registrar and renewal visibility across your properties.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Domain</th>
              {user.role === "ADMIN" && <th className="px-3 py-2 font-medium">Client</th>}
              <th className="px-3 py-2 font-medium">Registrar</th>
              <th className="px-3 py-2 font-medium">Expiry</th>
              <th className="px-3 py-2 font-medium">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {domains.map((domain) => (
              <tr key={domain.id}>
                <td className="px-3 py-2 font-medium text-slate-900">{domain.domainName}</td>
                {user.role === "ADMIN" && <td className="px-3 py-2">{domain.client.name}</td>}
                <td className="px-3 py-2">{domain.registrar}</td>
                <td className="px-3 py-2">{formatDate(domain.expiryDate)}</td>
                <td className="px-3 py-2">
                  <Link href={`/domains/${domain.id}`} className="text-slate-900 underline-offset-2 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {domains.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={user.role === "ADMIN" ? 5 : 4}>
                  No domain records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
