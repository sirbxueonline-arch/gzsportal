"use client";

type FormMessageProps = {
  error?: string | null;
  success?: string | null;
};

export function FormMessage({ error, success }: FormMessageProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <p className={`text-sm ${error ? "text-rose-700" : "text-emerald-700"}`}>
      {error ?? success}
    </p>
  );
}
