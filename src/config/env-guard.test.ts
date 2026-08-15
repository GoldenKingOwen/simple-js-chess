import { afterEach, describe, expect, it, vi } from "vitest";

/** process.env is typed read-only; tests need to mutate it. */
const testEnv = process.env as Record<string, string | undefined>;

const NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  testEnv.NODE_ENV = NODE_ENV;
  delete testEnv.NEXT_PUBLIC_API_URL;
  delete testEnv.NEXT_PUBLIC_USE_MOCK_API;
  vi.resetModules();
});

describe("production env guard", () => {
  it("fails a production build that would ship mock mode (no API URL)", async () => {
    testEnv.NODE_ENV = "production";
    delete testEnv.NEXT_PUBLIC_API_URL;
    delete testEnv.NEXT_PUBLIC_USE_MOCK_API;

    await expect(import("@/config/env")).rejects.toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("allows a production build with a real API URL", async () => {
    testEnv.NODE_ENV = "production";
    testEnv.NEXT_PUBLIC_API_URL = "https://api.example.com";
    testEnv.NEXT_PUBLIC_USE_MOCK_API = "false";

    const mod = await import("@/config/env");
    expect(mod.USE_MOCK_API).toBe(false);
  });

  it("allows mock mode outside production (local development)", async () => {
    testEnv.NODE_ENV = "test";
    delete testEnv.NEXT_PUBLIC_API_URL;

    const mod = await import("@/config/env");
    expect(mod.USE_MOCK_API).toBe(true);
  });
});
