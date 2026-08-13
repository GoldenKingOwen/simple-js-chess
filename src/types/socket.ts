import type { ChatMessage } from "./chat";
import type { Game, GameColor, GameResult, GameStatus } from "./game";

/** Socket.IO connection status exposed to the UI. */
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/**
 * Events the client emits to the future NestJS Socket.IO gateway.
 * Every event payload must remain in sync with `docs/backend-contract.md`.
 */
export interface ClientToServerEvents {
  /** Send the auth token on connect (socket.io auth is preferred). */
  authenticate: (payload: { token: string }) => void;
  /** Join a game room as spectator or player. */
  joinGame: (payload: { gameId: string; password?: string }) => void;
  /** Leave a game room. */
  leaveGame: (payload: { gameId: string }) => void;
  /** Submit a move. Move itself is validated by the authoritative backend. */
  makeMove: (payload: { gameId: string; from: string; to: string; promotion?: string }) => void;
  /** Resign from a game. */
  resignGame: (payload: { gameId: string }) => void;
  /** Offer a draw to the opponent. */
  offerDraw: (payload: { gameId: string }) => void;
  /** Accept a pending draw offer. */
  acceptDraw: (payload: { gameId: string }) => void;
  /** Decline a pending draw offer. */
  declineDraw: (payload: { gameId: string }) => void;
  /** Send a chat message inside a game room. */
  sendChatMessage: (payload: { gameId: string; body: string }) => void;
  /** Request a rematch after a finished game. */
  requestRematch: (payload: { gameId: string }) => void;
  /** Enter the online matchmaking queue. */
  startMatchmaking: (payload: { timeControlId: string; rated: boolean }) => void;
  /** Cancel an active matchmaking search. */
  cancelMatchmaking: () => void;
  /** Send a friend request. */
  sendFriendRequest: (payload: { userId: string }) => void;
  /** Acknowledge a friend request. */
  respondFriendRequest: (payload: { requestId: string; accept: boolean }) => void;
  /** Send a challenge to a friend. */
  sendChallenge: (payload: { userId: string; timeControlId: string; rated: boolean }) => void;
  /** Join/leave the global matchmaking spectator feed. */
  subscribeMatchmaking: () => void;
  unsubscribeMatchmaking: () => void;
}

/**
 * Events the future NestJS Socket.IO gateway emits to clients.
 */
export interface ServerToClientEvents {
  /** Full authoritative game state (sent on join and after reconnects). */
  gameState: (payload: Game) => void;
  /** A move was accepted and applied. */
  moveMade: (payload: { game: Game; move: Game["moveHistory"][number] }) => void;
  /** A new player (or spectator) joined the game room. */
  playerJoined: (payload: { gameId: string; userId: string; username: string }) => void;
  /** A player disconnected (clock keeps running / pause configured). */
  playerDisconnected: (payload: { gameId: string; userId: string }) => void;
  /** A player reconnected. */
  playerReconnected: (payload: { gameId: string; userId: string }) => void;
  /** The game finished (checkmate, stalemate, timeout, agreement...). */
  gameEnded: (payload: { gameId: string; result: GameResult; game: Game }) => void;
  /** The opponent offered a draw. */
  drawOffered: (payload: { gameId: string; byUserId: string }) => void;
  /** A draw offer was resolved. */
  drawResolved: (payload: { gameId: string; accepted: boolean }) => void;
  /** A chat message arrived. */
  chatMessage: (payload: ChatMessage) => void;
  /** A clock update tick (roughly every second during active play). */
  clockTick: (payload: { gameId: string; whiteMs: number; blackMs: number; turn: GameColor }) => void;
  /** Matchmaking status update while searching. */
  matchmaking: (payload: { status: string; ticketId: string; queueSize: number }) => void;
  /** An opponent was found. */
  matchFound: (payload: {
    ticketId: string;
    gameId: string;
    opponent: {
      id: string;
      username: string;
      avatarUrl: string | null;
      rating: number;
    };
    color: GameColor;
    countdownMs: number;
    timeControlId: string;
    rated: boolean;
  }) => void;
  /** Connection ping used to detect dead sockets. */
  ping: () => void;
  /** A general event with status metadata. */
  event: (payload: { type: string; message: string; data?: unknown }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type SocketState = ConnectionStatus;

export const SOCKET_EVENTS = {
  // Client → server
  authenticate: "authenticate",
  joinGame: "joinGame",
  leaveGame: "leaveGame",
  makeMove: "makeMove",
  resignGame: "resignGame",
  offerDraw: "offerDraw",
  acceptDraw: "acceptDraw",
  declineDraw: "declineDraw",
  sendChatMessage: "sendChatMessage",
  requestRematch: "requestRematch",
  startMatchmaking: "startMatchmaking",
  cancelMatchmaking: "cancelMatchmaking",
  sendFriendRequest: "sendFriendRequest",
  respondFriendRequest: "respondFriendRequest",
  sendChallenge: "sendChallenge",
  subscribeMatchmaking: "subscribeMatchmaking",
  unsubscribeMatchmaking: "unsubscribeMatchmaking",
  // Server → client
  gameState: "gameState",
  moveMade: "moveMade",
  playerJoined: "playerJoined",
  playerDisconnected: "playerDisconnected",
  playerReconnected: "playerReconnected",
  gameEnded: "gameEnded",
  drawOffered: "drawOffered",
  drawResolved: "drawResolved",
  chatMessage: "chatMessage",
  clockTick: "clockTick",
  matchmaking: "matchmaking",
  matchFound: "matchFound",
  ping: "ping",
  event: "event",
} as const;

export type SocketEventName = keyof typeof SOCKET_EVENTS;

export interface GameStatusEvent {
  gameId: string;
  status: GameStatus;
  result: GameResult | null;
}