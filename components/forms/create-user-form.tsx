"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createUserSchema } from "@/lib/validation/schemas";

type CreateUserInput = z.input<typeof createUserSchema>;
type CreateUserPayload = z.output<typeof createUserSchema>;

type CreateUserFormProps = {
  clients: Array<{ id: string; name: string }>;
};

export function CreateUserForm({ clients }: CreateUserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput, unknown, CreateUserPayload>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      role: "CLIENT",
      clientId: clients[0]?.id,
      password: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: CreateUserPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create user.");
      return;
    }

    setSuccess(
      payload.authProvisioned
        ? "User saved and Supabase Auth password account provisioned."
        : "User saved.",
    );
    reset({ email: "", role: "CLIENT", clientId: clients[0]?.id, password: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input {...register("email")} type="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.email && <p className="mt-1 text-sm text-rose-700">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Initial Password (Optional)</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          If provided, the portal creates or updates this user in Supabase Auth.
        </p>
        {errors.password && <p className="mt-1 text-sm text-rose-700">{errors.password.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Role</label>
        <select {...register("role")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="CLIENT">CLIENT</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {selectedRole === "CLIENT" && (
        <div>
          <label className="mb-1 block text-sm font-medium">Assigned Client</label>
          <select {...register("clientId")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.clientId && <p className="mt-1 text-sm text-rose-700">{errors.clientId.message}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {isSubmitting ? "Creating..." : "Create User"}
      </button>

      <FormMessage error={serverError} success={success} />
    </form>
  );
}
