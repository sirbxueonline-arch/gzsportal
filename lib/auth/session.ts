import { UserRole, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/prisma";

type SessionUser = {
  sub?: string;
  email?: string;
  app_metadata?: {
    role?: string;
  };
  [key: string]: unknown;
};

export type AppUser = Pick<User, "id" | "email" | "role" | "clientId" | "auth0Sub">;

const ADMIN_ROLE_CLAIMS = [
  "https://guluzada.dev/role",
  "https://guluzada.dev/app_metadata_role",
  "role",
] as const;

function getAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hasAdminMetadata(user: SessionUser): boolean {
  if (user.app_metadata?.role?.toLowerCase() === "admin") {
    return true;
  }

  return ADMIN_ROLE_CLAIMS.some((claim) => {
    const value = user[claim];

    return typeof value === "string" && value.toLowerCase() === "admin";
  });
}

function normalizeEmail(value?: string): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

function toAppUser(user: User): AppUser {
  return {
    id: user.id,
    auth0Sub: user.auth0Sub,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
  };
}

async function resolveUserFromSession(sessionUser: SessionUser): Promise<AppUser | null> {
  const email = normalizeEmail(sessionUser.email);
  const auth0Sub = typeof sessionUser.sub === "string" ? sessionUser.sub : null;

  if (!email || !auth0Sub) {
    return null;
  }

  const adminEmailSet = getAdminEmailSet();
  const shouldBeAdmin = adminEmailSet.has(email) || hasAdminMetadata(sessionUser);

  let user = await prisma.user.findUnique({
    where: {
      auth0Sub,
    },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  if (user) {
    const nextRole = shouldBeAdmin ? UserRole.ADMIN : user.role;
    const nextClientId = nextRole === UserRole.ADMIN ? null : user.clientId;

    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        auth0Sub,
        email,
        role: nextRole,
        clientId: nextClientId,
      },
    });

    if (user.role === UserRole.CLIENT && !user.clientId) {
      return null;
    }

    return toAppUser(user);
  }

  if (shouldBeAdmin) {
    const createdAdmin = await prisma.user.create({
      data: {
        auth0Sub,
        email,
        role: UserRole.ADMIN,
      },
    });

    return toAppUser(createdAdmin);
  }

  const invite = await prisma.clientInvite.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!invite) {
    return null;
  }

  const createdClientUser = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        auth0Sub,
        email,
        role: UserRole.CLIENT,
        clientId: invite.clientId,
      },
    });

    await tx.clientInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return newUser;
  });

  return toAppUser(createdClientUser);
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const session = await auth0.getSession();

  if (!session?.user) {
    return null;
  }

  return resolveUserFromSession(session.user as SessionUser);
}

export async function requireAppUser(options?: { adminOnly?: boolean }): Promise<AppUser> {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const appUser = await resolveUserFromSession(session.user as SessionUser);

  if (!appUser) {
    redirect("/not-authorized");
  }

  if (options?.adminOnly && appUser.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return appUser;
}

export function isAdmin(user: AppUser): boolean {
  return user.role === UserRole.ADMIN;
}
