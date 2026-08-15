import { ApiError } from "@/types";
import { env } from "@/config/env";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  /** JSON body. */
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Abort after N ms. Defaults to none for long operations. */
  timeoutMs?: number;
  auth?: boolean;
}

const isBrowser = typeof window !== "undefined";

/**
 * API version prefix of the NestJS backend. The backend contract puts every
 * REST endpoint under `/api/v1` — the client adds it automatically, so
 * `NEXT_PUBLIC_API_URL` should be the bare host (no prefix).
 */
export const API_PREFIX = "/api/v1";

/**
 * Resolve the auth token for requests. Overridden by the auth store at runtime;
 * kept injectable so tests can pass a fixed token.
 */
export let tokenProvider: (() => string | null) | null = null;

export function setTokenProvider(provider: (() => string | null) | null) {
  tokenProvider = provider;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

async function processBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = await response.json();
    // NestJS-style envelope: { data: T, meta? }
    if (
      json &&
      typeof json === "object" &&
      "data" in json &&
      !response.ok === false
    ) {
      return json.data as T;
    }
    return json as T;
  }
  return (await response.text()) as T;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

/**
 * Central HTTP client for the future NestJS REST API.
 *
 * All network calls flow through here — components never call `fetch`
 * directly. Handles base URL, auth headers, JSON serialization, timeouts and
 * normalized error objects (`ApiError`).
 */
export class ApiClient {
  readonly baseUrl: string;
  readonly defaultTimeout: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.defaultTimeout = config.timeoutMs ?? 15_000;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      body,
      headers: extraHeaders = {},
      query,
      timeoutMs = this.defaultTimeout,
      auth = true,
    } = options;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...extraHeaders,
    };

    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (auth) {
      const token = tokenProvider?.() ?? null;
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // NestJS prefixes every route with /api/v1. Avoid double-prefixing in
    // case a caller already includes it in the path.
    const urlPath = path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path}`;

    try {
      const response = await fetch(`${this.baseUrl}${urlPath}${buildQuery(query)}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: "no-store",
        // Send cookies (the httpOnly refresh-token cookie) on cross-origin
        // calls to the Render backend from the Netlify frontend.
        credentials: "include",
      });

      if (!response.ok) {
        // NestJS error shape: { statusCode, message, error, details }
        let errorBody: { message?: string | string[]; error?: string; statusCode?: number; details?: Record<string, string[]> } = {};
        try {
          errorBody = await response.json();
        } catch {
          /* non-JSON error body */
        }
        const rawMessage = Array.isArray(errorBody.message) ? errorBody.message.join(", ") : errorBody.message;
        throw new ApiError(
          rawMessage || errorBody.error || `Request failed (${response.status})`,
          errorBody.statusCode ?? response.status,
          errorBody.details,
        );
      }

      return await processBody<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(`Request timed out after ${timeoutMs}ms`, 408);
      }
      if (!isBrowser) throw error instanceof Error ? error : new ApiError("Unknown network error");
      throw new ApiError("Network error — is the API reachable?", 0);
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

/**
 * The singleton API client used across the app.
 *
 * In mock mode (`USE_MOCK_API`) services skip this client entirely; in
 * production it talks to `NEXT_PUBLIC_API_URL`.
 */
export const apiClient = new ApiClient({
  baseUrl: env.apiUrl ?? "",
  timeoutMs: 15_000,
});

export function isApiConfigured(): boolean {
  return Boolean(env.apiUrl);
}