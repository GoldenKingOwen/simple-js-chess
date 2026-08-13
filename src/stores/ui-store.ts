"use client";

import { create } from "zustand";
import type { ConnectionStatus } from "@/types";

interface UIState {
  /** Global socket connection status (driven by the socket client). */
  connection: ConnectionStatus;
  /** Mobile navigation drawer open state. */
  navOpen: boolean;
  /** Whether a matchmaking search is currently running. */
  matchmaking: { active: boolean; timeControlId: string | null; rated: boolean };
  /** Command palette / quick actions open state (reserved). */
  paletteOpen: boolean;
  setConnection: (connection: ConnectionStatus) => void;
  setNavOpen: (open: boolean) => void;
  setMatchmaking: (matchmaking: UIState["matchmaking"]) => void;
  setPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  connection: "disconnected",
  navOpen: false,
  matchmaking: { active: false, timeControlId: null, rated: false },
  paletteOpen: false,
  setConnection: (connection) => set({ connection }),
  setNavOpen: (navOpen) => set({ navOpen }),
  setMatchmaking: (matchmaking) => set({ matchmaking }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));