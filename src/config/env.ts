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

export const isDev = process.env.NODE_ENV !== "production";