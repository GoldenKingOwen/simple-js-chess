import type {
  CreateGameInput,
  Game,
  GameColor,
  GameMode,
  GamePlayer,
  GameResult,
  GameStatus,
  Move,
  TimeControl,
  TimeControlId,
  User,
} from "@/types";
import { TIME_CONTROLS } from "@/config/time-controls";

/**
 * Adapters that translate the NestJS backend wire format into the frontend
 * domain types (see docs/backend-contract.md). The backend is the source of
 * truth, so these functions are intentionally defensive: unknown fields get
 * safe defaults instead of crashing the UI.
 *
 * Notes on the wire format:
 * - `timeControl` is a string like "10+0", not an object.
 * - `status` / `mode` / `result` / `terminationReason` are UPPER_SNAKE.
 * - `white` / `black` are compact player objects (or null while waiting).
 * - `currentPosition` holds the FEN; `currentTurn` is "WHITE" | "BLACK".
 */

type BackendRecord = Record<string, unknown>;

function str(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Map a backend user (or user-ish object) to the frontend `User` type. */
export function mapUser(raw: BackendRecord | null | undefined): User {
  const u = raw ?? {};
  // The backend exposes presence as `presence` on public user objects and as
  // `status` on game players.
  const statusRaw = str(u.status, u.presence).toLowerCase();
  const status: User["status"] =
    statusRaw === "online" || statusRaw === "in-game" || statusRaw === "offline"
      ? (statusRaw as User["status"])
      : "offline";
  return {
    id: str(u.id),
    username: str(u.username, "player"),
    email: typeof u.email === "string" ? u.email : undefined,
    avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : typeof u.avatar === "string" ? u.avatar : null,
    rating: num(u.rating, 1200),
    title: typeof u.title === "string" && u.title ? u.title : null,
    status,
    createdAt: str(u.createdAt),
    lastSeenAt: typeof u.lastSeenAt === "string" ? u.lastSeenAt : null,
  };
}

/** Map a compact backend player object (or null while the seat is empty). */
function mapPlayer(raw: BackendRecord | null | undefined, color: GameColor, emptyUsername: string): GamePlayer {
  const p = raw ?? {};
  return {
    user: mapUser({
      id: p.userId ?? p.id ?? "",
      username: p.username ?? emptyUsername,
      rating: p.rating,
      avatarUrl: p.avatarUrl,
      title: p.title,
      status: p.status,
      createdAt: p.createdAt,
    }),
    color,
    rating: p.rating === null || p.rating === undefined ? null : num(p.rating),
    ratingDelta: p.ratingChange === null || p.ratingChange === undefined ? null : num(p.ratingChange),
    clockMs: num(p.clockMs, 0),
    disconnected: bool(p.disconnected, false),
    connected: bool(p.connected, p.disconnected !== true),
  };
}

/**
 * Map a backend time-control string ("10+0") to the frontend `TimeControl`
 * object. The id snaps to the nearest local preset so `timeControlLabel` and
 * friends keep working; the label carries the exact backend value.
 */
export function mapTimeControl(value: unknown): TimeControl {
  const raw = str(value, "10+0");
  const [initialRaw, incrementRaw] = raw.split("+");
  const initialMin = num(initialRaw.trim(), 10);
  const incrementSec = num((incrementRaw ?? "0").trim(), 0);
  const timeMs = initialMin * 60_000;
  const incrementMs = incrementSec * 1_000;

  let id: TimeControlId = "casual";
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const [presetId, preset] of Object.entries(TIME_CONTROLS) as [TimeControlId, TimeControl][]) {
    const diff = Math.abs(preset.timeMs - timeMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      id = presetId;
    }
  }
  return { id, label: raw, timeMs, incrementMs };
}

const RESULT_OUTCOMES: Record<string, GameResult["outcome"]> = {
  CHECKMATE: "checkmate",
  RESIGNATION: "resignation",
  TIMEOUT: "timeout",
  STALEMATE: "stalemate",
  THREEFOLD_REPETITION: "repetition",
  FIFTY_MOVE_RULE: "fifty-move",
  INSUFFICIENT_MATERIAL: "insufficient-material",
  DRAW_AGREEMENT: "agreement",
  AGREEMENT: "agreement",
};

/** Map `result` + `terminationReason` (e.g. "WHITE_WIN" + "CHECKMATE"). */
export function mapGameResult(raw: BackendRecord | null | undefined): GameResult | null {
  const r = raw ?? {};
  const resultRaw = str(r.result).toUpperCase();
  if (!resultRaw) return null;

  const reason = str(r.terminationReason).toUpperCase();
  if (resultRaw === "DRAW") {
    return {
      winner: null,
      outcome: (RESULT_OUTCOMES[reason] ?? "agreement") as Extract<GameResult, { winner: null }>["outcome"],
    };
  }
  if (resultRaw === "WHITE_WIN" || resultRaw === "BLACK_WIN") {
    return {
      winner: resultRaw === "WHITE_WIN" ? "w" : "b",
      outcome: (RESULT_OUTCOMES[reason] ?? "forfeit") as Extract<GameResult, { winner: GameColor }>["outcome"],
    };
  }
  return null;
}

const GAME_STATUS: Record<string, GameStatus> = {
  WAITING: "waiting",
  ACTIVE: "active",
  COMPLETED: "ended",
  ENDED: "ended",
  ABORTED: "aborted",
  SCHEDULED: "scheduled",
};

const GAME_MODE: Record<string, GameMode> = {
  ONLINE: "online",
  BOT: "bot",
  LOCAL: "local",
};

/** Map a backend game object to the frontend `Game` type. */
export function mapGame(raw: BackendRecord | null | undefined): Game {
  const g = raw ?? {};
  const statusRaw = str(g.status).toUpperCase();
  const modeRaw = str(g.mode).toUpperCase();
  const currentTurnRaw = str(g.currentTurn).toUpperCase();
  const myColorRaw = str(g.myColor).toUpperCase();

  return {
    id: str(g.id),
    mode: GAME_MODE[modeRaw] ?? (modeRaw.toLowerCase() as GameMode),
    status: GAME_STATUS[statusRaw] ?? (statusRaw.toLowerCase() as GameStatus),
    timeControl: mapTimeControl(g.timeControl),
    rated: bool(g.rated, false),
    white: mapPlayer(g.white as BackendRecord, "w", "Waiting…"),
    black: mapPlayer(g.black as BackendRecord, "b", "Waiting…"),
    position: str(g.currentPosition, g.position),
    moves: Array.isArray(g.moves) ? g.moves.map((m) => str(m, (m as BackendRecord)?.san ?? "")) : [],
    moveHistory: Array.isArray(g.moves)
      ? g.moves.map((move, index) => mapMove(move as BackendRecord, index))
      : [],
    result: mapGameResult(g),
    startedAt: typeof g.startedAt === "string" ? g.startedAt : null,
    endedAt: typeof g.endedAt === "string" ? g.endedAt : null,
    pauseRequestedBy: typeof g.pauseRequestedBy === "string" ? g.pauseRequestedBy : null,
    drawOfferBy: typeof g.drawOfferBy === "string" ? g.drawOfferBy : null,
    pgn: str(g.pgn),
    viewers: num(g.viewers, 0),
    currentPlayerColor: currentTurnRaw === "BLACK" ? "b" : "w",
    myColor: myColorRaw === "WHITE" ? "w" : myColorRaw === "BLACK" ? "b" : undefined,
  };
}

/** Map a backend move record (SAN/UCI/FEN) to the frontend `Move` type. */
export function mapMove(raw: BackendRecord | null | undefined, index = 0): Move {
  const m = raw ?? {};
  const uci = str(m.uci);
  const colorRaw = str(m.color).toUpperCase();
  const color: GameColor = colorRaw === "WHITE" ? "w" : colorRaw === "BLACK" ? "b" : index % 2 === 0 ? "w" : "b";
  // Some backends only send uci/san/fen — derive from/to from the UCI string.
  const from = str(m.from, uci.slice(0, 2));
  const to = str(m.to, uci.slice(2, 4));
  return {
    uci,
    san: str(m.san),
    fen: str(m.fen),
    color,
    from,
    to,
    piece: str(m.piece),
    captured: typeof m.captured === "string" && m.captured ? m.captured : undefined,
    flags: str(m.flags),
    promotion: typeof m.promotion === "string" && m.promotion ? m.promotion : undefined,
    check: bool(m.check) || undefined,
    checkmate: bool(m.checkmate) || undefined,
    timeMs: m.timeMs === null || m.timeMs === undefined ? undefined : num(m.timeMs),
    clockDeltaMs: m.clockDeltaMs === null || m.clockDeltaMs === undefined ? undefined : num(m.clockDeltaMs),
    timestamp: str(m.timestamp, m.createdAt),
  };
}

/** Map a backend chat message to the frontend `ChatMessage`-compatible shape. */
export function mapChatMessage(raw: BackendRecord | null | undefined) {
  const c = raw ?? {};
  const sender = c.sender && typeof c.sender === "object" ? (c.sender as BackendRecord) : null;
  return {
    id: str(c.id),
    gameId: str(c.gameId),
    senderId: str(c.senderId, c.userId, sender?.id),
    senderUsername: str(c.senderUsername, c.username, sender?.username, "Unknown"),
    senderAvatarUrl:
      typeof c.senderAvatarUrl === "string"
        ? c.senderAvatarUrl
        : typeof sender?.avatarUrl === "string"
          ? sender.avatarUrl
          : null,
    body: str(c.body, c.message),
    kind: "chat",
    timestamp: str(c.timestamp, c.createdAt),
  } satisfies import("@/types").ChatMessage;
}

/* ───────────────────────── Input mappers ───────────────────────── */

const TIME_CONTROL_TO_BACKEND: Record<TimeControlId, string> = {
  bullet: "1+0",
  blitz: "3+2",
  rapid: "10+0",
  classical: "30+0",
  casual: "15+10",
};

/** Frontend `TimeControlId` → backend time-control string (e.g. "10+0"). */
export function toBackendTimeControl(id: TimeControlId | string): string {
  return TIME_CONTROL_TO_BACKEND[id as TimeControlId] ?? str(id, "10+0");
}

const GAME_MODE_TO_BACKEND: Record<GameMode, string> = {
  online: "ONLINE",
  bot: "BOT",
  local: "LOCAL",
};

/**
 * Map the frontend `CreateGameInput` to the backend `CreateGameDto`.
 * The backend derives everything else (colors, bots, results) itself.
 */
export function toBackendGameInput(input: CreateGameInput): BackendRecord {
  const colorPreference =
    input.colorPreference === "w" || input.colorPreference === "b"
      ? (input.colorPreference === "w" ? "WHITE" : "BLACK")
      : "RANDOM";
  return {
    mode: GAME_MODE_TO_BACKEND[input.mode] ?? "ONLINE",
    timeControl: toBackendTimeControl(input.timeControlId),
    rated: input.rated ?? false,
    colorPreference,
    isPrivate: Boolean(input.inviteeId),
    botLevel: input.botDifficulty ?? undefined,
    inviteeId: input.inviteeId ?? undefined,
    invitationMessage: undefined,
  };
}
