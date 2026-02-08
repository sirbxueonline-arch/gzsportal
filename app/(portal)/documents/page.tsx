import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await requireAppUser();

  const documents = await prisma.document.findMany({
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
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-slate-600">Private files are served via signed links from Supabase Storage.</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              {user.role === "ADMIN" && <th className="px-3 py-2 font-medium">Client</th>}
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-3 py-2 font-medium text-slate-900">{document.title}</td>
                {user.role === "ADMIN" && <td className="px-3 py-2">{document.client.name}</td>}
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
            {documents.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={user.role === "ADMIN" ? 4 : 3}>
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
