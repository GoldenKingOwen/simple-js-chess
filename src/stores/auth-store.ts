"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  /** Null until the backend is reachable; used to surface connection errors. */
  error: string | null;
  setAuthenticated: (user: User, token: string) => void;
  setUser: (user: User) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      status: "idle",
      error: null,
      setAuthenticated: (user, token) => set({ user, token, status: "authenticated", error: null }),
      setUser: (user) => set({ user }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, token: null, status: "unauthenticated", error: null }),
      reset: () => set({ user: null, token: null, status: "idle", error: null }),
    }),
    {
      name: "chess-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);