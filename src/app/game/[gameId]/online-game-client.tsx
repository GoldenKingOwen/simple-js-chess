"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GameScreen } from "@/components/game/game-screen";
import { ConnectionIndicator } from "@/components/navigation/connection-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gameService } from "@/services/game-service";
import { connectSocket, onSocket, emitSocket, disconnectSocket, getSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { mapChatMessage, mapGame } from "@/lib/api/adapters";
import { USE_MOCK_API } from "@/config/env";
import { MOCK_CURRENT_USER, mockChat } from "@/services/mock/mock-data";
import { useAuthStore } from "@/stores/auth-store";
import type { Game, ChatMessage, GamePlayer } from "@/types";
import type { GamePlayerSlot } from "@/stores/game-store";
import type { EngineMove, Square } from "@/lib/chess/chess-engine";
import type { BoardInteraction } from "@/components/chess/chess-board";

function gamePlayerToSlot(player: GamePlayer): GamePlayerSlot {
  return {
    user: player.user,
    username: player.user.username,
    avatarUrl: player.user.avatarUrl,
    rating: player.rating,
    title: player.user.title ?? null,
    online: !player.disconnected,
    color: player.color,
  };
}

function historyToEngineMoves(moves: Game["moveHistory"]): EngineMove[] {
  return moves.map((move) => ({
    color: move.color,
    from: move.from as Square,
    to: move.to as Square,
    piece: (move.piece ?? "p") as EngineMove["piece"],
    captured: move.captured as EngineMove["captured"],
    promotion: move.promotion as EngineMove["promotion"],
    flags: move.flags,
    lan: move.uci,
    san: move.san,
    before: "",
    after: move.fen,
    isCheck: move.check ?? false,
    isCheckmate: move.checkmate ?? false,
  }));
}

export function OnlineGameClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const selfId = authUser?.id ?? MOCK_CURRENT_USER.id;

  const [game, setGame] = useState<Game | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>(() => (USE_MOCK_API ? mockChat(gameId) : []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opponentGone, setOpponentGone] = useState(false);

  // Load the authoritative game state (REST) on mount, then its move history.
  useEffect(() => {
    let cancelled = false;
    gameService
      .getGame(gameId)
      .then(async (value) => {
        if (cancelled) return;
        const moves = await gameService.getGameMoves(gameId).catch(() => []);
        if (cancelled) return;
        setGame({ ...value, moves: moves.map((move) => move.san), moveHistory: moves });
      })
      .catch(() => {
        if (!cancelled) setError("The game you tried to open does not exist (anymore).");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  // Subscribe to the Socket.IO gateway and join the game room.
  useEffect(() => {
    connectSocket();
    emitSocket(SOCKET_EVENTS.joinGame, { gameId });

    const unsubs = [
      onSocket(SOCKET_EVENTS.gameState, (payload) => setGame(mapGame(payload.game))),
      onSocket(SOCKET_EVENTS.moveMade, (payload) => setGame(mapGame(payload.game))),
      onSocket(SOCKET_EVENTS.gameEnded, (payload) => setGame(mapGame(payload.game))),
      onSocket(SOCKET_EVENTS.drawOffered, (payload) =>
        setGame((current) => (current ? { ...current, drawOfferBy: payload.offeredBy } : current)),
      ),
      onSocket(SOCKET_EVENTS.drawAccepted, () =>
        setGame((current) => (current ? { ...current, drawOfferBy: null } : current)),
      ),
      onSocket(SOCKET_EVENTS.drawRejected, () =>
        setGame((current) => (current ? { ...current, drawOfferBy: null } : current)),
      ),
      onSocket(SOCKET_EVENTS.chatMessage, (payload) =>
        setChat((messages) => [...messages, mapChatMessage(payload.message)]),
      ),
      onSocket(SOCKET_EVENTS.playerDisconnected, (payload) => {
        if (payload.player.userId !== selfId) setOpponentGone(true);
      }),
      onSocket(SOCKET_EVENTS.playerReconnected, (payload) => {
        if (payload.player.userId !== selfId) setOpponentGone(false);
      }),
      onSocket(SOCKET_EVENTS.clockUpdate, (payload) =>
        setGame((current) =>
          current
            ? {
                ...current,
                white: { ...current.white, clockMs: payload.whiteClockMs },
                black: { ...current.black, clockMs: payload.blackClockMs },
              }
            : current,
        ),
      ),
    ];

    return () => {
      emitSocket(SOCKET_EVENTS.leaveGame, { gameId });
      unsubs.forEach((unsub) => unsub());
      disconnectSocket();
    };
  }, [gameId, selfId]);

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      // Prefer the socket; fall back to REST when the gateway is unavailable
      // (mock/dev mode). The mock backend stays authoritative either way.
      getSocket()?.emit(SOCKET_EVENTS.makeMove, { gameId, from, to, promotion });
      gameService
        .makeMove(gameId, from, to, promotion)
        .then(setGame)
        .catch(() => setError("That move could not be sent. Try again."));
    },
    [gameId],
  );

  const resign = useCallback(() => {
    emitSocket(SOCKET_EVENTS.resignGame, { gameId });
    gameService
      .resignGame(gameId)
      .then(setGame)
      .catch(() => setError("Unable to resign right now."));
  }, [gameId]);

  const offerDraw = useCallback(() => {
    emitSocket(SOCKET_EVENTS.offerDraw, { gameId });
    gameService
      .offerDraw(gameId)
      .then(setGame)
      .catch(() => setError("Unable to offer a draw right now."));
  }, [gameId]);

  const respondDraw = useCallback(
    (accept: boolean) => {
      emitSocket(SOCKET_EVENTS.respondDraw, { gameId, accept });
      gameService
        .respondDraw(gameId, accept)
        .then(setGame)
        .catch(() => setError("Unable to respond to the draw offer."));
    },
    [gameId],
  );

  const sendChat = useCallback(
    (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      emitSocket(SOCKET_EVENTS.sendChatMessage, { gameId, message: trimmed });
      if (USE_MOCK_API && getSocket() === null) {
        // Offline/mock: echo the message locally so the UI stays interactive.
        setChat((messages) => [
          ...messages,
          {
            id: `local-${Date.now()}`,
            gameId,
            senderId: selfId,
            senderUsername: selfId === MOCK_CURRENT_USER.id ? MOCK_CURRENT_USER.username : "You",
            senderAvatarUrl: null,
            body: trimmed,
            kind: "chat",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [gameId, selfId],
  );

  const moves = useMemo(() => (game ? historyToEngineMoves(game.moveHistory) : []), [game]);

  const interaction: BoardInteraction = useMemo(() => {
    if (!game || game.status !== "active") return "spectator";
    if (game.white.user.id === selfId) return "white-only";
    if (game.black.user.id === selfId) return "black-only";
    return "spectator";
  }, [game, selfId]);

  const status = game?.status === "active" ? "playing" : game?.status === "ended" ? "ended" : "playing";

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-[560px] gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" strokeLinecap="round" />
            <path d="M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Game unavailable</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/play/online")}>
          Back to lobby
        </Button>
      </div>
    );
  }

  if (!game) return null;

  const white = gamePlayerToSlot(game.white);
  const black = gamePlayerToSlot(game.black);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-6">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {game.rated ? "Rated" : "Casual"} · {game.timeControl.label}
        </p>
        <ConnectionIndicator />
      </div>
      {opponentGone && (
        <p className="mb-2 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm font-medium text-amber-700 dark:text-amber-400" role="status">
          Your opponent disconnected. Waiting for them to return…
        </p>
      )}
      <GameScreen
        gameId={gameId}
        white={white}
        black={black}
        whiteMs={game.white.clockMs}
        blackMs={game.black.clockMs}
        activeClock={game.status === "active" ? game.currentPlayerColor : null}
        fen={game.position}
        moves={moves}
        turn={game.currentPlayerColor}
        interaction={interaction}
        status={status}
        result={game.result}
        checkSquare={null}
        drawOffered={game.drawOfferBy === game.white.user.id}
        drawReceived={Boolean(game.drawOfferBy) && game.drawOfferBy !== game.white.user.id}
        onMove={(move) => makeMove(move.from, move.to, move.promotion)}
        onResign={resign}
        onOfferDraw={offerDraw}
        onAcceptDraw={() => respondDraw(true)}
        onDeclineDraw={() => respondDraw(false)}
        onLeave={() => router.push("/play/online")}
        onBackToDashboard={() => router.push("/dashboard")}
        chat={{
          messages: chat,
          selfId,
          onSend: sendChat,
          connecting: false,
        }}
      />
    </div>
  );
}
