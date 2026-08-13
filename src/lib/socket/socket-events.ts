/**
 * Central socket event definitions.
 *
 * Client → server events are in `ClientToServerEvents`; server → client events
 * in `ServerToClientEvents`. Event name strings live in `SOCKET_EVENTS` only —
 * components must never hardcode event names.
 */
export * from "@/types/socket";