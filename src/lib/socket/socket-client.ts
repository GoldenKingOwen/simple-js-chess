import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import { useUIStore } from "@/stores/ui-store";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ConnectionStatus,
} from "@/types/socket";
import { SOCKET_EVENTS } from "@/types/socket";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;
let authToken: string | null = null;
let listenerCount = 0;

function updateConnection(status: ConnectionStatus) {
  useUIStore.getState().setConnection(status);
}

function ensureSocket(): GameSocket | null {
  if (socket) return socket;
  if (!env.socketUrl) return null;

  socket = io(env.socketUrl, {
    path: env.socketPath,
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
    auth: { token: authToken },
  });

  socket.on("connect", () => {
    updateConnection("connected");
    if (authToken) socket?.emit(SOCKET_EVENTS.authenticate, { token: authToken });
  });
  socket.on("disconnect", () => updateConnection("disconnected"));
  socket.on("connect_error", () => {
    if (socket?.connected === false) updateConnection("reconnecting");
  });

  return socket;
}

/** Wire the auth token into the singleton socket before connecting. */
export function setSocketAuth(token: string | null) {
  authToken = token;
  if (socket) {
    socket.auth = { token };
  }
}

/** Explicitly connect the socket (used when entering online game screens). */
export function connectSocket() {
  const sock = ensureSocket();
  if (sock && !sock.connected && !sock.active) {
    updateConnection("connecting");
    sock.connect();
  }
}

/** Disconnect the socket. */
export function disconnectSocket() {
  socket?.disconnect();
  socket?.removeAllListeners();
  socket = null;
  listenerCount = 0;
  updateConnection("disconnected");
}

/**
 * Subscribe to a server event. Returns an unsubscribe function. The first real
 * subscription triggers the lazy connection; the last removal keeps the socket
 * alive for the current session.
 */
export function onSocket<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
): () => void {
  const sock = ensureSocket();
  if (!sock) {
    // No backend configured — return a no-op handle (dev/mock mode).
    return () => undefined;
  }
  if (listenerCount === 0) connectSocket();
  listenerCount += 1;
  sock.on(event, handler as never);
  return () => {
    listenerCount -= 1;
    sock.off(event, handler as never);
  };
}

/** Emit a typed client event (no-op when no backend is reachable). */
export function emitSocket<K extends keyof ClientToServerEvents>(
  event: K,
  ...args: Parameters<ClientToServerEvents[K]>
): void {
  socket?.emit(event, ...(args as never));
}

/** Current singleton socket (may be null in mock mode). */
export function getSocket(): GameSocket | null {
  return socket;
}

export { SOCKET_EVENTS };