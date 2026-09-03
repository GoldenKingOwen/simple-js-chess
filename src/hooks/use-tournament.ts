"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { onSocket, emitSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { tournamentService } from "@/services/tournament-service";
import type { CreateTournamentInput, TournamentStatus } from "@/types";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: (status?: TournamentStatus) => ["tournaments", "list", status ?? "all"] as const,
  detail: (id: string) => ["tournaments", "detail", id] as const,
};

export function useTournaments(status?: TournamentStatus) {
  return useQuery({
    queryKey: tournamentKeys.list(status),
    queryFn: () => tournamentService.list(status),
  });
}

/**
 * A single tournament, kept live: joins the `tournament:<id>` socket room and
 * refetches on every bracket event (round started, pairing decided, completed).
 */
export function useTournament(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => tournamentService.get(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!id) return;
    emitSocket(SOCKET_EVENTS.joinTournament, { tournamentId: id });
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    };
    const offs = [
      onSocket(SOCKET_EVENTS.roundStarted, (p) => p.tournamentId === id && invalidate()),
      onSocket(SOCKET_EVENTS.pairingResult, (p) => p.tournamentId === id && invalidate()),
      onSocket(SOCKET_EVENTS.tournamentCompleted, (p) => p.tournamentId === id && invalidate()),
    ];
    return () => {
      emitSocket(SOCKET_EVENTS.leaveTournament, { tournamentId: id });
      offs.forEach((off) => off());
    };
  }, [id, queryClient]);

  return query;
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTournamentInput) => tournamentService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
  });
}

function useTournamentAction(action: (id: string) => ReturnType<typeof tournamentService.join>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: (data) => {
      queryClient.setQueryData(tournamentKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    },
  });
}

export const useJoinTournament = () => useTournamentAction((id) => tournamentService.join(id));
export const useLeaveTournament = () => useTournamentAction((id) => tournamentService.leave(id));
export const useStartTournament = () => useTournamentAction((id) => tournamentService.start(id));
