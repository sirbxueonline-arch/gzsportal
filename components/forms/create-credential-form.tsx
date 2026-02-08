"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createCredentialSchema } from "@/lib/validation/schemas";

type CreateCredentialInput = z.input<typeof createCredentialSchema>;
type CreateCredentialPayload = z.output<typeof createCredentialSchema>;

type CreateCredentialFormProps = {
  clientId: string;
};

export function CreateCredentialForm({ clientId }: CreateCredentialFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCredentialInput, unknown, CreateCredentialPayload>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      label: "",
      username: "",
      secret: "",
    },
  });

  const onSubmit = async (values: CreateCredentialPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/clients/${clientId}/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create credential.");
      return;
    }

    setSuccess("Credential saved.");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Label</label>
        <input {...register("label")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.label && <p className="mt-1 text-sm text-rose-700">{errors.label.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Username</label>
        <input {...register("username")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Secret</label>
        <input
          {...register("secret")}
          type="password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.secret && <p className="mt-1 text-sm text-rose-700">{errors.secret.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {isSubmitting ? "Saving..." : "Add Credential"}
      </button>

      <FormMessage error={serverError} success={success} />
    </form>
  );
}
