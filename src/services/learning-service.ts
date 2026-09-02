import { apiClient } from "@/lib/api/client";
import { USE_MOCK_API } from "@/config/env";
import type {
  Lesson,
  LearningPath,
  LessonCompletionResult,
  PuzzleAttemptResult,
} from "@/types";
import { mockLearning } from "./mock/mock-learning";

export interface LearningService {
  getPath(): Promise<LearningPath>;
  getLesson(slug: string): Promise<Lesson>;
  submitAttempt(slug: string, puzzleId: string, moves: string[]): Promise<PuzzleAttemptResult>;
  startPractice(slug: string): Promise<{ gameId: string }>;
  completeLesson(slug: string): Promise<LessonCompletionResult>;
}

const realLearningService: LearningService = {
  getPath() {
    return apiClient.get<LearningPath>("/learning/path");
  },
  getLesson(slug) {
    return apiClient.get<Lesson>(`/learning/lessons/${encodeURIComponent(slug)}`);
  },
  submitAttempt(slug, puzzleId, moves) {
    return apiClient.post<PuzzleAttemptResult>(
      `/learning/lessons/${encodeURIComponent(slug)}/attempt`,
      { puzzleId, moves },
    );
  },
  startPractice(slug) {
    return apiClient.post<{ gameId: string }>(
      `/learning/lessons/${encodeURIComponent(slug)}/practice`,
    );
  },
  completeLesson(slug) {
    return apiClient.post<LessonCompletionResult>(
      `/learning/lessons/${encodeURIComponent(slug)}/complete`,
    );
  },
};

export const learningService: LearningService = USE_MOCK_API ? mockLearning : realLearningService;
