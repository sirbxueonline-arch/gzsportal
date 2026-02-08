"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TicketStatusToggleProps = {
  ticketId: string;
  status: "OPEN" | "CLOSED";
};

export function TicketStatusToggle({ ticketId, status }: TicketStatusToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = status === "OPEN" ? "CLOSED" : "OPEN";

  const toggleStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update status.");
      }

      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-500"
      >
        {loading ? "Saving..." : `Mark ${nextStatus}`}
      </button>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
