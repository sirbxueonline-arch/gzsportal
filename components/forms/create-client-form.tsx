"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createClientSchema } from "@/lib/validation/schemas";

type CreateClientInput = z.input<typeof createClientSchema>;
type CreateClientPayload = z.output<typeof createClientSchema>;

export function CreateClientForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput, unknown, CreateClientPayload>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      company: "",
      emailPrimary: "",
      phone: "",
      notes: "",
    },
  });

  const onSubmit = async (values: CreateClientPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create client.");
      return;
    }

    setSuccess("Client created.");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input {...register("name")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.name && <p className="mt-1 text-sm text-rose-700">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Company</label>
        <input {...register("company")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Primary Email</label>
        <input
          {...register("emailPrimary")}
          type="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.emailPrimary && <p className="mt-1 text-sm text-rose-700">{errors.emailPrimary.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Phone</label>
        <input {...register("phone")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea {...register("notes")} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {isSubmitting ? "Creating..." : "Create Client"}
      </button>

      <FormMessage error={serverError} success={success} />
    </form>
  );
}
