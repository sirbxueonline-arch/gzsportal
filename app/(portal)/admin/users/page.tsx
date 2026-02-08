import { CreateUserForm } from "@/components/forms/create-user-form";
import { UserRoleForm } from "@/components/forms/user-role-form";
import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAppUser({ adminOnly: true });

  const [clients, users] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.user.findMany({
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
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-slate-600">Manage role, client assignment, and Auth0 account linking.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card title="User Directory">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Current</th>
                  <th className="px-3 py-2 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{user.email}</p>
                      <p className="text-xs text-slate-500">Auth0 Sub: {user.auth0Sub ?? "Not linked yet"}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {user.role}
                      {user.client?.name ? ` / ${user.client.name}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <UserRoleForm
                        userId={user.id}
                        initialRole={user.role}
                        initialClientId={user.clientId}
                        clients={clients}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={3}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Create or Provision User">
          <CreateUserForm clients={clients} />
        </Card>
      </div>
    </div>
  );
}
