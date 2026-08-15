"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeBridge } from "./theme-bridge";
import { setTokenProvider } from "@/lib/api/client";
import { setSocketAuth } from "@/lib/socket/socket-client";
import { useAuthStore } from "@/stores/auth-store";
import { authService } from "@/services/auth-service";

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
