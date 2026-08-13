"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BoardThemeId, PieceStyleId } from "@/config/board-themes";
import { DEFAULT_BOARD_THEME_ID, DEFAULT_PIECE_STYLE_ID } from "@/config/board-themes";

export type ThemeMode = "light" | "dark" | "system";

export type SoundVolume = number;

export interface SoundSettings {
  master: number;
  move: number;
  capture: number;
  check: number;
  gameEnd: number;
  notification: number;
}

export interface GameSettings {
  showLegalMoves: boolean;
  highlightLastMove: boolean;
  showCoordinates: boolean;
  confirmMoves: boolean;
  autoQueen: boolean;
  boardFlip: boolean;
  animations: boolean;
  soundEnabled: boolean;
  sound: SoundSettings;
  /** Enable voice read-out of moves (accessibility). */
  voiceEnabled: boolean;
}

export interface PrivacySettings {
  allowChallenges: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  allowChat: boolean;
}

interface SettingsState {
  themeMode: ThemeMode;
  boardTheme: BoardThemeId;
  pieceStyle: PieceStyleId;
  game: GameSettings;
  privacy: PrivacySettings;
  setThemeMode: (mode: ThemeMode) => void;
  setBoardTheme: (theme: BoardThemeId) => void;
  setPieceStyle: (style: PieceStyleId) => void;
  updateGame: (patch: Partial<GameSettings>) => void;
  updateSound: (patch: Partial<SoundSettings>) => void;
  updatePrivacy: (patch: Partial<PrivacySettings>) => void;
  resetSettings: () => void;
}

const defaultGame: GameSettings = {
  showLegalMoves: true,
  highlightLastMove: true,
  showCoordinates: true,
  confirmMoves: false,
  autoQueen: false,
  boardFlip: true,
  animations: true,
  soundEnabled: true,
  voiceEnabled: false,
  sound: {
    master: 0.7,
    move: 0.7,
    capture: 0.7,
    check: 0.7,
    gameEnd: 0.7,
    notification: 0.7,
  },
};

const defaultPrivacy: PrivacySettings = {
  allowChallenges: true,
  allowFriendRequests: true,
  showOnlineStatus: true,
  allowChat: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      boardTheme: DEFAULT_BOARD_THEME_ID,
      pieceStyle: DEFAULT_PIECE_STYLE_ID,
      game: defaultGame,
      privacy: defaultPrivacy,
      setThemeMode: (themeMode) => set({ themeMode }),
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      setPieceStyle: (pieceStyle) => set({ pieceStyle }),
      updateGame: (patch) => set((state) => ({ game: { ...state.game, ...patch } })),
      updateSound: (patch) =>
        set((state) => ({ game: { ...state.game, sound: { ...state.game.sound, ...patch } } })),
      updatePrivacy: (patch) => set((state) => ({ privacy: { ...state.privacy, ...patch } })),
      resetSettings: () =>
        set({ themeMode: "dark", boardTheme: DEFAULT_BOARD_THEME_ID, pieceStyle: DEFAULT_PIECE_STYLE_ID, game: defaultGame, privacy: defaultPrivacy }),
    }),
    {
      name: "chess-settings",
      partialize: (state) => ({
        themeMode: state.themeMode,
        boardTheme: state.boardTheme,
        pieceStyle: state.pieceStyle,
        game: state.game,
        privacy: state.privacy,
      }),
    },
  ),
);

export const useSoundSettings = () => useSettingsStore((state) => state.game.sound);