/**
 * Central board theme definitions.
 *
 * Board colors live ONLY here (plus the settings store that picks the active
 * id). UI components resolve colors through `getBoardTheme()` and never
 * hardcode chess-board colors.
 */

export type BoardThemeId = "classic" | "green" | "blue" | "brown" | "purple" | "high-contrast";

export interface BoardTheme {
  id: BoardThemeId;
  label: string;
  /** Light square color. */
  light: string;
  /** Dark square color. */
  dark: string;
  /** Color used for the square border in settings previews. */
  accent: string;
}

export type PieceStyleId = "standard" | "unicode";

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  classic: {
    id: "classic",
    label: "Classic",
    light: "#f0d9b5",
    dark: "#b58863",
    accent: "#d18b47",
  },
  green: {
    id: "green",
    label: "Green",
    light: "#ebecd0",
    dark: "#739552",
    accent: "#588144",
  },
  blue: {
    id: "blue",
    label: "Blue",
    light: "#dee3e6",
    dark: "#8ca2ad",
    accent: "#5f7d8c",
  },
  brown: {
    id: "brown",
    label: "Brown",
    light: "#e8cba8",
    dark: "#a9714f",
    accent: "#8d5a37",
  },
  purple: {
    id: "purple",
    label: "Purple",
    light: "#d9c4ec",
    dark: "#8e6bb0",
    accent: "#6f4d94",
  },
  "high-contrast": {
    id: "high-contrast",
    label: "High contrast",
    light: "#ffffff",
    dark: "#2f4a5c",
    accent: "#16324f",
  },
};

export const BOARD_THEME_LIST = Object.values(BOARD_THEMES);

export const PIECE_STYLES: Record<PieceStyleId, { label: string }> = {
  standard: { label: "Standard" },
  unicode: { label: "Unicode" },
};

export const PIECE_STYLE_LIST = Object.values(PIECE_STYLES);

/** Default settings (mirrored by the settings store). */
export const DEFAULT_BOARD_THEME_ID: BoardThemeId = "green";
export const DEFAULT_PIECE_STYLE_ID: PieceStyleId = "standard";

/**
 * Overlay colors used to communicate move/selection state. Kept centralized so
 * themes and accessibility options can tweak them in one place.
 */
export interface BoardOverlays {
  selected: string;
  lastMove: string;
  check: string;
  legalMoveDot: string;
  legalMoveCapture: string;
}

export const DEFAULT_OVERLAYS: BoardOverlays = {
  selected: "rgba(20, 85, 30, 0.5)",
  lastMove: "rgba(155, 199, 0, 0.41)",
  check: "radial-gradient(circle at center, #ff3333 0%, #cc0000 60%, #990000 100%)",
  legalMoveDot: "rgba(20, 85, 30, 0.4)",
  legalMoveCapture: "rgba(20, 85, 30, 0.45)",
};

export function getBoardTheme(id: BoardThemeId): BoardTheme {
  return BOARD_THEMES[id] ?? BOARD_THEMES[DEFAULT_BOARD_THEME_ID];
}