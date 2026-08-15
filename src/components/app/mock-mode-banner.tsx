import { AlertTriangle } from "lucide-react";
import { USE_MOCK_API } from "@/config/env";

/**
 * Shown whenever the build was compiled in mock mode (no NEXT_PUBLIC_API_URL
 * at build time, or NEXT_PUBLIC_USE_MOCK_API=true). NEXT_PUBLIC_* variables
 * are baked in at build time, so a missing banner here after setting the env
 * vars means the site needs a fresh deploy.
 */
export function MockModeBanner() {
  if (!USE_MOCK_API) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-amber-950">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Demo mode: showing sample data. Set NEXT_PUBLIC_API_URL in the deploy
      environment and rebuild to connect the live backend.
    </div>
  );
}
