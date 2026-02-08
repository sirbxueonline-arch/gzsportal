import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatDate(value: Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  return format(value, "MMM d, yyyy");
}
