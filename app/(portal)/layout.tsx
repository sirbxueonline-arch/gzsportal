import { PortalShell } from "@/components/layout/portal-shell";
import { requireAppUser } from "@/lib/auth/session";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAppUser();

  return <PortalShell user={user}>{children}</PortalShell>;
}
