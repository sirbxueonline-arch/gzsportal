import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
