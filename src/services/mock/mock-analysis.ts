import type { AnalyzedPly, GameAnalysis, MoveClassification } from "@/types";
import type { AnalysisService } from "../analysis-service";

/**
 * Mock analysis: on request, "runs" for a couple of seconds then serves a
 * deterministic pseudo-analysis derived from the game id + ply index.
 */
const store = new Map<string, GameAnalysis>();

function classify(cpLoss: number): MoveClassification {
  if (cpLoss >= 300) return "BLUNDER";
  if (cpLoss >= 100) return "MISTAKE";
  if (cpLoss >= 50) return "INACCURACY";
  return "GOOD";
}

function fakePlies(gameId: string): AnalyzedPly[] {
  const seed = [...gameId].reduce((n, c) => n + c.charCodeAt(0), 0);
  const count = 24 + (seed % 12);
  let evalCp = 15;
  const plies: AnalyzedPly[] = [];
  for (let i = 0; i < count; i++) {
    const swing = Math.round(Math.sin(i * 1.3 + seed) * 60);
    const blunder = i % 9 === 4 ? 220 + (seed % 200) : 0;
    const cpLoss = Math.max(0, Math.abs(swing) - 25 + blunder);
    evalCp += (i % 2 === 0 ? 1 : -1) * (swing - (i % 2 === 0 ? blunder : 0));
    plies.push({
      ply: i,
      moveNumber: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? "WHITE" : "BLACK",
      san: `m${i + 1}`,
      playedUci: "e2e4",
      bestUci: cpLoss > 40 ? "d2d4" : "e2e4",
      bestEvalCp: Math.round(evalCp + cpLoss),
      playedEvalCp: Math.round(evalCp),
      cpLoss,
      classification: classify(cpLoss),
      missedBest: cpLoss > 40,
    });
  }
  return plies;
}

export const mockAnalysis: AnalysisService = {
  async request(gameId) {
    const existing = store.get(gameId);
    if (existing) return existing;
    const running: GameAnalysis = {
      id: `an-${gameId}`,
      gameId,
      status: "RUNNING",
      depth: 20,
      plies: [],
      error: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    store.set(gameId, running);
    setTimeout(() => {
      store.set(gameId, {
        ...running,
        status: "COMPLETE",
        plies: fakePlies(gameId),
        completedAt: new Date().toISOString(),
      });
    }, 1800);
    return running;
  },
  async get(gameId) {
    return store.get(gameId) ?? null;
  },
};
