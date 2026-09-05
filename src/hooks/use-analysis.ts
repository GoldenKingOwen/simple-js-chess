"use client";

import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { analysisService } from "@/services/analysis-service";
import type { GameAnalysis } from "@/types";

export const analysisKeys = {
  detail: (gameId: string) => ["analysis", gameId] as const,
};

/**
 * Post-game analysis for a finished game. `start()` kicks off the job; the query
 * then polls while it runs and also refetches on the `analysisComplete` socket
 * event (whichever lands first).
 */
export function useGameAnalysis(gameId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<GameAnalysis | null>({
    queryKey: analysisKeys.detail(gameId),
    queryFn: () => analysisService.get(gameId),
    enabled: Boolean(gameId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "PENDING" || status === "RUNNING" ? 3000 : false;
    },
  });

  useEffect(() => {
    if (!gameId) return;
    return onSocket(SOCKET_EVENTS.analysisComplete, (payload) => {
      if (payload.gameId === gameId) {
        void queryClient.invalidateQueries({ queryKey: analysisKeys.detail(gameId) });
      }
    });
  }, [gameId, queryClient]);

  const start = useMutation({
    mutationFn: () => analysisService.request(gameId),
    onSuccess: (data) => queryClient.setQueryData(analysisKeys.detail(gameId), data),
  });

  const analysis = query.data ?? null;
  const running = analysis?.status === "PENDING" || analysis?.status === "RUNNING" || start.isPending;

  const trigger = useCallback(() => start.mutate(), [start]);

  return {
    analysis,
    isRunning: running,
    isComplete: analysis?.status === "COMPLETE",
    isFailed: analysis?.status === "FAILED",
    start: trigger,
  };
}
