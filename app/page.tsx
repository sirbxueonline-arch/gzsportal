import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";
import { getCurrentAppUser } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/not-authorized");
  }

  redirect("/dashboard");
}
