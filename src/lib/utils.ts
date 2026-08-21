import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate a post-auth redirect target from the `?redirect=` query param.
 * Only same-app absolute paths are allowed (no protocol-relative URLs,
 * no external origins) to prevent open redirects.
 */
export function sanitizeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
