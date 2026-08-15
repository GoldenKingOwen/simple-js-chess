/**
 * Centralized environment configuration.
 *
 * All environment access goes through this module so that components never
 * read `process.env` directly (which also keeps things testable).
 */

/**
 * NOTE: env vars MUST be read with static property access
 * (`process.env.NEXT_PUBLIC_...`). Next.js only inlines NEXT_PUBLIC_* values
 * into the client bundle for literal member accesses; a dynamic lookup like
 * `process.env[key]` is left untouched and evaluates to `undefined` in the
 * browser, which silently enables mock mode in production regardless of the
 * variables set at build time.
 */
export const env = {
  /** Base URL of the NestJS REST API (e.g. https://api.example.com). */
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  /** Base URL of the NestJS Socket.IO gateway. */
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL,
  socketPath: process.env.NEXT_PUBLIC_SOCKET_PATH ?? "/socket.io",
} as const;

/**
 * Whether the app is running against the local mock layer instead of a real
 * backend. The mock layer is used whenever no API URL is configured or when
 * the build/profile explicitly opts into mocks for development.
 */
export const USE_MOCK_API =
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || !env.apiUrl;

/**
 * Production builds must talk to the real backend. Shipping mock mode silently
 * (e.g. a Netlify build that never received NEXT_PUBLIC_API_URL) makes the app
 * accept any credentials and show sample data — fail the build loudly instead
 * of deploying a broken site.
 */
if (process.env.NODE_ENV === "production" && USE_MOCK_API) {
  throw new Error(
    "Mock mode is enabled in a production build. Set NEXT_PUBLIC_API_URL " +
      "(and NEXT_PUBLIC_USE_MOCK_API=false) in your Netlify environment " +
      "variables, then redeploy.",
  );
}

export const isDev = process.env.NODE_ENV !== "production";