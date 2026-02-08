import { redirect } from "next/navigation";

import { getCurrentAppUser, getCurrentAuthSessionUser } from "@/lib/auth/session";

export default async function HomePage() {
  const sessionUser = await getCurrentAuthSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/not-authorized");
  }

  redirect("/dashboard");
}
