/** Socket.IO connection status exposed to the UI. */
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/** Compact player payload the backend sends in presence events. */
export interface SocketPlayer {
  userId: string;
  username: string;
  [key: string]: unknown;
}

/**
 * Events the client emits to the NestJS Socket.IO gateway.
 * Keep in sync with docs/backend-contract.md — identity comes from the
 * handshake token, never from payloads.
 */
export interface ClientToServerEvents {
  /** Join a game room. */
  joinGame: (payload: { gameId: string }) => void;
  /** Leave a game room. */
  leaveGame: (payload: { gameId: string }) => void;
  /** Submit a move. The move itself is validated by the authoritative backend. */
  makeMove: (payload: { gameId: string; from: string; to: string; promotion?: string }) => void;
  /** Resign from a game. */
  resignGame: (payload: { gameId: string }) => void;
  /** Offer a draw to the opponent. */
  offerDraw: (payload: { gameId: string }) => void;
  /** Accept or reject a pending draw offer. */
  respondDraw: (payload: { gameId: string; accept: boolean }) => void;
  /** Send a chat message inside a game room. */
  sendChatMessage: (payload: { gameId: string; message: string }) => void;
  /** Ask the server for the full authoritative game state. */
  requestGameState: (payload: { gameId: string }) => void;
  /** Ask the server for a clock sync. */
  requestClockSync: (payload: { gameId: string }) => void;
  /** Update the player's presence. */
  setPresence: (payload: { status: "ONLINE" | "AWAY" }) => void;
}

/**
 * Events the NestJS Socket.IO gateway emits to clients.
 * Payload shapes come straight from docs/backend-contract.md.
 */
export interface ServerToClientEvents {
  /** Full authoritative game state (sent on join and after reconnects). */
  gameState: (payload: { gameId: string; game: Record<string, unknown> }) => void;
  /** A move was accepted and applied. */
  moveMade: (payload: {
    gameId: string;
    move: Record<string, unknown>;
    game: Record<string, unknown>;
  }) => void;
  /** A player joined the game room. */
  playerJoined: (payload: { gameId: string; player: SocketPlayer }) => void;
  /** A player disconnected. */
  playerDisconnected: (payload: { gameId: string; player: SocketPlayer }) => void;
  /** A player reconnected. */
  playerReconnected: (payload: { gameId: string; player: SocketPlayer }) => void;
  /** The game finished (checkmate, stalemate, timeout, agreement...). */
  gameEnded: (payload: { gameId: string; game: Record<string, unknown> }) => void;
  /** The opponent offered a draw. */
  drawOffered: (payload: { gameId: string; offeredBy: string }) => void;
  /** A draw offer was accepted. */
  drawAccepted: (payload: { gameId: string; acceptedBy: string }) => void;
  /** A draw offer was rejected. */
  drawRejected: (payload: { gameId: string; rejectedBy: string }) => void;
  /** A chat message arrived. */
  chatMessage: (payload: { gameId: string; message: Record<string, unknown> }) => void;
  /** A clock tick (roughly every second during active play). */
  clockUpdate: (payload: {
    gameId: string;
    whiteClockMs: number;
    blackClockMs: number;
    turn: "WHITE" | "BLACK";
    timestamp: string;
  }) => void;
  /** Matchmaking found an opponent — the client should joinGame. */
  matchmakingMatched: (payload: { gameId: string }) => void;
  /** Matchmaking search was cancelled. */
  matchmakingCancelled: () => void;
  /** An error for the offending socket. */
  error: (payload: { code: string; message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type SocketState = ConnectionStatus;

export const SOCKET_EVENTS = {
  // Client → server
  joinGame: "joinGame",
  leaveGame: "leaveGame",
  makeMove: "makeMove",
  resignGame: "resignGame",
  offerDraw: "offerDraw",
  respondDraw: "respondDraw",
  sendChatMessage: "sendChatMessage",
  requestGameState: "requestGameState",
  requestClockSync: "requestClockSync",
  setPresence: "setPresence",
  // Server → client
  gameState: "gameState",
  moveMade: "moveMade",
  playerJoined: "playerJoined",
  playerDisconnected: "playerDisconnected",
  playerReconnected: "playerReconnected",
  gameEnded: "gameEnded",
  drawOffered: "drawOffered",
  drawAccepted: "drawAccepted",
  drawRejected: "drawRejected",
  chatMessage: "chatMessage",
  clockUpdate: "clockUpdate",
  matchmakingMatched: "matchmakingMatched",
  matchmakingCancelled: "matchmakingCancelled",
  error: "error",
} as const;

export type SocketEventName = keyof typeof SOCKET_EVENTS;
