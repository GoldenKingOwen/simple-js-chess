"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeBridge } from "./theme-bridge";
import { setTokenProvider } from "@/lib/api/client";
import { setSocketAuth } from "@/lib/socket/socket-client";
import { useAuthStore } from "@/stores/auth-store";
import { authService } from "@/services/auth-service";
import { ApiError } from "@/types";

/** All client-side providers for the app shell. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Wire the persisted access token into the HTTP client and socket, then
  // validate/refresh the session on boot.
  useEffect(() => {
    setTokenProvider(() => useAuthStore.getState().token);

    let cancelled = false;
    const token = useAuthStore.getState().token;
    setSocketAuth(token);

    if (token) {
      authService
        .me()
        .then((user) => {
          if (!cancelled) useAuthStore.getState().setUser(user);
        })
        .catch(async () => {
          if (cancelled) return;
          try {
            // Access token expired — rotate the refresh cookie into a new one.
            const session = await authService.refresh();
            if (cancelled) return;
            useAuthStore.getState().setAuthenticated(session.user, session.token);
            setSocketAuth(session.token);
          } catch {
            if (!cancelled) useAuthStore.getState().logout();
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the session alive: the access token expires after 15 minutes, so
  // rotate it via the httpOnly refresh cookie before that happens, and
  // re-validate when the tab becomes visible again after a long absence
  // (e.g. laptop sleep). Without this, REST calls and new socket handshakes
  // start failing with 401 mid-session.
  useEffect(() => {
    let inFlight = false;

    const rotate = async (): Promise<void> => {
      const { token, status } = useAuthStore.getState();
      if (!token || status !== "authenticated" || inFlight) return;
      inFlight = true;
      try {
        const session = await authService.refresh();
        useAuthStore.getState().setAuthenticated(session.user, session.token);
        setSocketAuth(session.token);
      } catch (error) {
        // Transient failures (offline, cold-starting Render instance) must not
        // log the user out — only a rejected refresh cookie ends the session.
        const statusCode = error instanceof ApiError ? error.statusCode : 0;
        if (statusCode === 401 || statusCode === 403) {
          useAuthStore.getState().logout();
          setSocketAuth(null);
        }
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(() => void rotate(), 10 * 60_000);

    let hiddenAt = 0;
    const onVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 5 * 60_000) {
        hiddenAt = 0;
        void rotate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="chess-theme"
    >
      <ThemeBridge />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextThemesProvider>
  );
}
