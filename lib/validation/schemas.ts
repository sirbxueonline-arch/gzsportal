import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || z.uuid().safeParse(value).success, {
    message: "Invalid UUID.",
  });

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Date must be YYYY-MM-DD.",
  })
  .transform((value) => (value ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || z.url().safeParse(value).success, {
    message: "Invalid URL.",
  })
  .transform((value) => (value ? value : null));

const optionalBooleanInput = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    const normalized = value.toLowerCase();

    if (["true", "1", "on", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "off", "no"].includes(normalized)) {
      return false;
    }

    return null;
  });

const optionalPassword = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || value.length >= 8, {
    message: "Password must be at least 8 characters.",
  })
  .refine((value) => value === null || value.length <= 128, {
    message: "Password must be 128 characters or fewer.",
  });

export const revealCredentialSchema = z.object({
  credentialId: z.uuid(),
});

export const createClientSchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  company: optionalTrimmedString,
  emailPrimary: z.email("Valid primary email is required."),
  phone: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export const createCredentialSchema = z.object({
  label: z.string().trim().min(2, "Label is required."),
  username: optionalTrimmedString,
  secret: z.string().min(1, "Secret is required."),
});

export const createDomainSchema = z.object({
  domainName: z.string().trim().min(3, "Domain name is required."),
  registrar: z.string().trim().min(2, "Registrar is required."),
  expiryDate: optionalDateString,
  autoRenew: optionalBooleanInput,
  nameservers: z.string().trim().min(2, "Nameservers are required."),
  loginUrl: optionalUrl,
  credentialId: optionalUuid,
});

export const createHostingSchema = z.object({
  provider: z.string().trim().min(2, "Provider is required."),
  plan: optionalTrimmedString,
  renewalDate: optionalDateString,
  region: optionalTrimmedString,
  controlPanelUrl: optionalUrl,
  credentialId: optionalUuid,
  notes: optionalTrimmedString,
});

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(4, "Subject is required."),
  message: z.string().trim().min(10, "Message is required."),
});

export const createInviteSchema = z.object({
  email: z.email("Valid email is required."),
  clientId: z.uuid(),
  expiresInDays: z
    .number()
    .int()
    .min(1)
    .max(60)
    .optional()
    .default(7),
});

export const createUserSchema = z
  .object({
    email: z.email("Valid email is required."),
    role: z.enum(["ADMIN", "CLIENT"]),
    clientId: optionalUuid,
    password: optionalPassword,
  })
  .refine((value) => value.role === "ADMIN" || Boolean(value.clientId), {
    message: "Client users must be assigned to a client.",
    path: ["clientId"],
  });

export const updateUserSchema = z
  .object({
    role: z.enum(["ADMIN", "CLIENT"]),
    clientId: optionalUuid,
  })
  .refine((value) => value.role === "ADMIN" || Boolean(value.clientId), {
    message: "Client users must be assigned to a client.",
    path: ["clientId"],
  });

export const closeTicketSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

export const createDocumentMetadataSchema = z.object({
  title: z.string().trim().min(2, "Title is required."),
});

export function toDateOrNull(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
