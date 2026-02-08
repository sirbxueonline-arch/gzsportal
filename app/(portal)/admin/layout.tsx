import { requireAppUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAppUser({ adminOnly: true });

  return children;
}
