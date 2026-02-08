import { addDays } from "date-fns";
import { PrismaClient, UserRole } from "@prisma/client";

import { encrypt } from "../lib/encryption";

const prisma = new PrismaClient();

async function upsertDemoDomain(options: {
  clientId: string;
  credentialId: string;
}) {
  const existing = await prisma.domain.findFirst({
    where: {
      clientId: options.clientId,
      domainName: "democlient.com",
    },
  });

  if (existing) {
    await prisma.domain.update({
      where: {
        id: existing.id,
      },
      data: {
        registrar: "Cloudflare",
        nameservers: "ns1.democlient.com, ns2.democlient.com",
        expiryDate: addDays(new Date(), 80),
        autoRenew: true,
        loginUrl: "https://dash.cloudflare.com/login",
        credentialId: options.credentialId,
      },
    });

    return existing.id;
  }

  const created = await prisma.domain.create({
    data: {
      clientId: options.clientId,
      domainName: "democlient.com",
      registrar: "Cloudflare",
      nameservers: "ns1.democlient.com, ns2.democlient.com",
      expiryDate: addDays(new Date(), 80),
      autoRenew: true,
      loginUrl: "https://dash.cloudflare.com/login",
      credentialId: options.credentialId,
    },
  });

  return created.id;
}

async function upsertDemoHosting(options: {
  clientId: string;
  credentialId: string;
}) {
  const existing = await prisma.hosting.findFirst({
    where: {
      clientId: options.clientId,
      provider: "Vercel",
    },
  });

  if (existing) {
    await prisma.hosting.update({
      where: {
        id: existing.id,
      },
      data: {
        plan: "Pro",
        renewalDate: addDays(new Date(), 26),
        region: "US East",
        controlPanelUrl: "https://vercel.com/dashboard",
        credentialId: options.credentialId,
        notes: "Demo hosting account",
      },
    });

    return existing.id;
  }

  const created = await prisma.hosting.create({
    data: {
      clientId: options.clientId,
      provider: "Vercel",
      plan: "Pro",
      renewalDate: addDays(new Date(), 26),
      region: "US East",
      controlPanelUrl: "https://vercel.com/dashboard",
      credentialId: options.credentialId,
      notes: "Demo hosting account",
    },
  });

  return created.id;
}

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required for seeding encrypted credentials.");
  }

  const existingDemoClient = await prisma.client.findFirst({
    where: {
      emailPrimary: "demo-client@guluzada.dev",
    },
  });

  const demoClient = existingDemoClient
    ? await prisma.client.update({
        where: {
          id: existingDemoClient.id,
        },
        data: {
          name: "Demo Client",
          company: "Demo Industries",
          phone: "+1 555 123 9898",
          notes: "Seeded demo client for local testing.",
        },
      })
    : await prisma.client.create({
        data: {
          name: "Demo Client",
          company: "Demo Industries",
          emailPrimary: "demo-client@guluzada.dev",
          phone: "+1 555 123 9898",
          notes: "Seeded demo client for local testing.",
        },
      });

  const encrypted = encrypt("DemoPassword!123");

  const existingCredential = await prisma.credential.findFirst({
    where: {
      label: "Demo Hosting Login",
      username: "demo-owner",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const demoCredential = existingCredential
    ? await prisma.credential.update({
        where: {
          id: existingCredential.id,
        },
        data: {
          encryptedSecret: encrypted.encryptedSecret,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        },
      })
    : await prisma.credential.create({
        data: {
          label: "Demo Hosting Login",
          username: "demo-owner",
          encryptedSecret: encrypted.encryptedSecret,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        },
      });

  await upsertDemoDomain({
    clientId: demoClient.id,
    credentialId: demoCredential.id,
  });

  await upsertDemoHosting({
    clientId: demoClient.id,
    credentialId: demoCredential.id,
  });

  await prisma.user.upsert({
    where: {
      email: "demo-client@guluzada.dev",
    },
    update: {
      role: UserRole.CLIENT,
      clientId: demoClient.id,
    },
    create: {
      email: "demo-client@guluzada.dev",
      role: UserRole.CLIENT,
      clientId: demoClient.id,
      auth0Sub: null,
    },
  });

  const existingInvite = await prisma.clientInvite.findFirst({
    where: {
      email: "demo-client@guluzada.dev",
      clientId: demoClient.id,
      usedAt: null,
    },
  });

  if (!existingInvite) {
    await prisma.clientInvite.create({
      data: {
        email: "demo-client@guluzada.dev",
        clientId: demoClient.id,
        tokenHash: `seed-${Date.now()}`,
        expiresAt: addDays(new Date(), 14),
      },
    });
  }

  console.log("Seed complete: demo client, domain, hosting, and encrypted credential created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
