/**
 * Centralized environment configuration.
 *
 * All environment access goes through this module so that components never
 * read `process.env` directly (which also keeps things testable).
 */

const getEnv = (key: string): string | undefined =>
  typeof process !== "undefined" ? process.env[key] : undefined;

export const env = {
  /** Base URL of the future NestJS REST API (e.g. https://api.example.com). */
  apiUrl: getEnv("NEXT_PUBLIC_API_URL"),
  /** Base URL of the future NestJS Socket.IO gateway. */
  socketUrl: getEnv("NEXT_PUBLIC_SOCKET_URL") ?? getEnv("NEXT_PUBLIC_API_URL"),
  socketPath: getEnv("NEXT_PUBLIC_SOCKET_PATH") ?? "/socket.io",
} as const;

/**
 * Whether the app is running against the local mock layer instead of a real
 * backend. The mock layer is used whenever no API URL is configured or when
 * the build/profile explicitly opts into mocks for development.
 */
export const USE_MOCK_API =
  getEnv("NEXT_PUBLIC_USE_MOCK_API") === "true" || !env.apiUrl;

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