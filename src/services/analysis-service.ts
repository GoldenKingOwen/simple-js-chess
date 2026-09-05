import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type { GameAnalysis } from "@/types";
import { mockAnalysis } from "./mock/mock-analysis";

export interface AnalysisService {
  /** Kick off analysis (idempotent) — returns the current record. */
  request(gameId: string): Promise<GameAnalysis>;
  /** Poll the current status/results; null before analysis was ever requested. */
  get(gameId: string): Promise<GameAnalysis | null>;
}

const realAnalysisService: AnalysisService = {
  request(gameId) {
    return apiClient.post<GameAnalysis>(`/games/${encodeURIComponent(gameId)}/analysis`);
  },
  async get(gameId) {
    return apiClient
      .get<GameAnalysis | null>(`/games/${encodeURIComponent(gameId)}/analysis`)
      .catch(() => null);
  },
};

export const analysisService: AnalysisService = USE_MOCK_API ? mockAnalysis : realAnalysisService;
