import { UserRole } from "@prisma/client";

import type { AppUser } from "@/lib/auth/session";

export function canAccessClient(user: AppUser, clientId: string | null): boolean {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (!clientId) {
    return false;
  }

  return user.clientId === clientId;
}
