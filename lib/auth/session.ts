import { UserRole, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentSupabaseAuthUser } from "@/lib/supabase-auth";

type SessionUser = {
  id: string;
  email?: string | null;
  app_metadata?: {
    role?: string;
  };
  user_metadata?: {
    role?: string;
  };
  [key: string]: unknown;
};

export type AppUser = Pick<User, "id" | "email" | "role" | "clientId" | "auth0Sub">;

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

  if (user.user_metadata?.role?.toLowerCase() === "admin") {
    return true;
  }

  const role = user.role;
  return typeof role === "string" && role.toLowerCase() === "admin";
}

function normalizeEmail(value?: string | null): string | null {
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
  const authUserId = typeof sessionUser.id === "string" ? sessionUser.id : null;

  if (!email || !authUserId) {
    return null;
  }

  const adminEmailSet = getAdminEmailSet();
  const shouldBeAdmin = adminEmailSet.has(email) || hasAdminMetadata(sessionUser);

  let user = await prisma.user.findUnique({
    where: {
      auth0Sub: authUserId,
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
        auth0Sub: authUserId,
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
        auth0Sub: authUserId,
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
        auth0Sub: authUserId,
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

export async function getCurrentAuthSessionUser(): Promise<SessionUser | null> {
  const user = await getCurrentSupabaseAuthUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    app_metadata:
      typeof user.app_metadata === "object" && user.app_metadata
        ? (user.app_metadata as SessionUser["app_metadata"])
        : undefined,
    user_metadata:
      typeof user.user_metadata === "object" && user.user_metadata
        ? (user.user_metadata as SessionUser["user_metadata"])
        : undefined,
  };
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const sessionUser = await getCurrentAuthSessionUser();

  if (!sessionUser) {
    return null;
  }

  return resolveUserFromSession(sessionUser);
}

export async function requireAppUser(options?: { adminOnly?: boolean }): Promise<AppUser> {
  const sessionUser = await getCurrentAuthSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const appUser = await resolveUserFromSession(sessionUser);

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
