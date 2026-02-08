"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createDomainSchema } from "@/lib/validation/schemas";

type CreateDomainInput = z.input<typeof createDomainSchema>;
type CreateDomainPayload = z.output<typeof createDomainSchema>;

type CreateDomainFormProps = {
  clientId: string;
  credentials: Array<{ id: string; label: string }>;
};

export function CreateDomainForm({ clientId, credentials }: CreateDomainFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDomainInput, unknown, CreateDomainPayload>({
    resolver: zodResolver(createDomainSchema),
    defaultValues: {
      domainName: "",
      registrar: "",
      expiryDate: "",
      autoRenew: false,
      nameservers: "",
      loginUrl: "",
      credentialId: "",
    },
  });

  const onSubmit = async (values: CreateDomainPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/clients/${clientId}/domains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create domain.");
      return;
    }

    setSuccess("Domain created.");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Domain Name</label>
        <input {...register("domainName")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.domainName && <p className="mt-1 text-sm text-rose-700">{errors.domainName.message}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Registrar</label>
          <input {...register("registrar")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          {errors.registrar && <p className="mt-1 text-sm text-rose-700">{errors.registrar.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expiry Date</label>
          <input {...register("expiryDate")} type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Nameservers</label>
        <textarea
          {...register("nameservers")}
          rows={2}
          placeholder="ns1.example.com, ns2.example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.nameservers && <p className="mt-1 text-sm text-rose-700">{errors.nameservers.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Login URL</label>
        <input {...register("loginUrl")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Credential</label>
        <select {...register("credentialId")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">No credential</option>
          {credentials.map((credential) => (
            <option key={credential.id} value={credential.id}>
              {credential.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("autoRenew")} />
        Auto Renew
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {isSubmitting ? "Saving..." : "Add Domain"}
      </button>

      <FormMessage error={serverError} success={success} />
    </form>
  );
}
