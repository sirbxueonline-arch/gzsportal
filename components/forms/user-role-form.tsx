"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { updateUserSchema } from "@/lib/validation/schemas";

type UpdateUserInput = z.input<typeof updateUserSchema>;
type UpdateUserPayload = z.output<typeof updateUserSchema>;

type UserRoleFormProps = {
  userId: string;
  initialRole: "ADMIN" | "CLIENT";
  initialClientId: string | null;
  clients: Array<{ id: string; name: string }>;
};

export function UserRoleForm({ userId, initialRole, initialClientId, clients }: UserRoleFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput, unknown, UpdateUserPayload>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      role: initialRole,
      clientId: initialClientId ?? "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: UpdateUserPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not update user.");
      return;
    }

    setSuccess("Saved.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select {...register("role")} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
          <option value="CLIENT">CLIENT</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        {selectedRole === "CLIENT" && (
          <select {...register("clientId")} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
        >
          Save
        </button>
      </div>

      {errors.clientId && <p className="text-sm text-rose-700">{errors.clientId.message}</p>}
      <FormMessage error={serverError} success={success} />
    </form>
  );
}
