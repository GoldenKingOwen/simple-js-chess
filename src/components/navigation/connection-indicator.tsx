"use client";

import { useUIStore } from "@/stores/ui-store";
import type { ConnectionStatus } from "@/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<ConnectionStatus, { label: string; className: string }> = {
  connected: { label: "Connected", className: "bg-emerald-500" },
  connecting: { label: "Connecting", className: "bg-amber-400" },
  reconnecting: { label: "Reconnecting", className: "bg-amber-400 animate-pulse" },
  disconnected: { label: "Offline", className: "bg-red-500" },
};

/** Live socket connection indicator for online play. */
export function ConnectionIndicator({ className }: { className?: string }) {
  const status = useUIStore((state) => state.connection);
  const config = CONFIG[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}
      role="status"
      aria-live="polite"
      data-connection={status}
    >
      <span className={cn("h-2 w-2 rounded-full", config.className)} aria-hidden="true" />
      {config.label}
    </span>
  );
}