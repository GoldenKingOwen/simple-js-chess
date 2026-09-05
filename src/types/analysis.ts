export type AnalysisStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";
export type MoveClassification = "GOOD" | "INACCURACY" | "MISTAKE" | "BLUNDER";

export interface AnalyzedPly {
  ply: number;
  moveNumber: number;
  color: "WHITE" | "BLACK";
  san: string;
  playedUci: string;
  bestUci: string;
  /** Centipawns, from the mover's point of view. */
  bestEvalCp: number;
  playedEvalCp: number;
  cpLoss: number;
  classification: MoveClassification;
  missedBest: boolean;
}

export interface GameAnalysis {
  id: string;
  gameId: string;
  status: AnalysisStatus;
  depth: number;
  plies: AnalyzedPly[];
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}
