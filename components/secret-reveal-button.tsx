"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SecretRevealButtonProps = {
  credentialId: string;
};

export function SecretRevealButton({ credentialId }: SecretRevealButtonProps) {
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const revealSecret = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentialId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to reveal secret.");
      }

      setSecret(payload.secret as string);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reveal secret.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={revealSecret}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        {loading ? "Revealing..." : "Reveal secret"}
      </button>

      {secret && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Secret</p>
          <p className="mt-1 break-all">{secret}</p>
        </div>
      )}

      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
