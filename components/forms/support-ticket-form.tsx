"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormMessage } from "@/components/forms/form-message";
import { createSupportTicketSchema } from "@/lib/validation/schemas";

type SupportTicketInput = z.input<typeof createSupportTicketSchema>;
type SupportTicketPayload = z.output<typeof createSupportTicketSchema>;

export function SupportTicketForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketInput, unknown, SupportTicketPayload>({
    resolver: zodResolver(createSupportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: SupportTicketPayload) => {
    setServerError(null);
    setSuccess(null);

    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = await response.json();

    if (!response.ok) {
      setServerError(payload.error ?? "Could not create ticket.");
      return;
    }

    setSuccess("Support ticket submitted.");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Subject</label>
        <input {...register("subject")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        {errors.subject && <p className="mt-1 text-sm text-rose-700">{errors.subject.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Message</label>
        <textarea
          {...register("message")}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.message && <p className="mt-1 text-sm text-rose-700">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {isSubmitting ? "Submitting..." : "Submit Ticket"}
      </button>

      <FormMessage error={serverError} success={success} />
    </form>
  );
}
