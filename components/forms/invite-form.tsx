"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createInviteSchema } from "@/lib/validation/schemas";

type InviteInput = z.input<typeof createInviteSchema>;
type InvitePayload = z.output<typeof createInviteSchema>;

type InviteFormProps = {
  clients: Array<{ id: string; name: string }>;
};

export function InviteForm({ clients }: InviteFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput, unknown, InvitePayload>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      email: "",
      clientId: clients[0]?.id,
      expiresInDays: 7,
    },
  });

  const onSubmit = async (values: InvitePayload) => {
    setServerError(null);
    setSuccess(null);
    setToken(null);

    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create invite.");
      return;
    }

    setSuccess("Invite created.");
    setToken(payload.token ?? null);
    reset({ email: "", clientId: values.clientId, expiresInDays: values.expiresInDays });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Client</label>
        <select {...register("clientId")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Client Email</label>
        <input {...register("email")} type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.email && <p className="mt-1 text-sm text-rose-700">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Expires In (days)</label>
        <input
          {...register("expiresInDays", { valueAsNumber: true })}
          type="number"
          min={1}
          max={60}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {isSubmitting ? "Creating..." : "Create Invite"}
      </button>

      <FormMessage error={serverError} success={success} />

      {token && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">One-time token (share securely)</p>
          <p className="mt-1 break-all">{token}</p>
        </div>
      )}
    </form>
  );
}
