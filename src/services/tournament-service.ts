import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type {
  CreateTournamentInput,
  Tournament,
  TournamentStatus,
  TournamentSummary,
} from "@/types";
import { mockTournaments } from "./mock/mock-tournaments";

export interface TournamentService {
  list(status?: TournamentStatus): Promise<TournamentSummary[]>;
  get(id: string): Promise<Tournament>;
  create(input: CreateTournamentInput): Promise<Tournament>;
  join(id: string): Promise<Tournament>;
  leave(id: string): Promise<Tournament>;
  start(id: string): Promise<Tournament>;
}

const realTournamentService: TournamentService = {
  async list(status) {
    const raw = await apiClient.get<{ tournaments?: TournamentSummary[] } | TournamentSummary[]>(
      "/tournaments",
      { query: status ? { status } : undefined },
    );
    return Array.isArray(raw) ? raw : (raw.tournaments ?? []);
  },
  get(id) {
    return apiClient.get<Tournament>(`/tournaments/${encodeURIComponent(id)}`);
  },
  create(input) {
    return apiClient.post<Tournament>("/tournaments", input);
  },
  join(id) {
    return apiClient.post<Tournament>(`/tournaments/${encodeURIComponent(id)}/join`);
  },
  leave(id) {
    return apiClient.post<Tournament>(`/tournaments/${encodeURIComponent(id)}/leave`);
  },
  start(id) {
    return apiClient.post<Tournament>(`/tournaments/${encodeURIComponent(id)}/start`);
  },
};

export const tournamentService: TournamentService = USE_MOCK_API
  ? mockTournaments
  : realTournamentService;
