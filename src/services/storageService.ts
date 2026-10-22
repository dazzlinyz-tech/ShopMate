import { UserProgress, ScenarioCompletionData } from '../types/dialogue';

const STORAGE_KEY = 'shopmate_user_progress_v2';

const DEFAULT_PROGRESS: UserProgress = {
  completedScenarioIds: [],
  bookmarkedExpressionIds: [],
  learnedExpressionIds: [],
  lastPracticedScenarioId: null,
  totalTurnsPracticed: 0,
  totalStarsEarned: 0,
  scenarioProgress: {},
};

export class StorageService {
  static getProgress(): UserProgress {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
      };
    } catch (e) {
      console.warn('Failed to read ShopMate progress from localStorage:', e);
      return DEFAULT_PROGRESS;
    }
  }

  static saveProgress(progress: UserProgress): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save ShopMate progress to localStorage:', e);
    }
  }

  static recordScenarioCompletion(
    scenarioId: string,
    stars: number,
    completedTurns: number,
    totalTurns: number,
    expressionIdsToLearn: string[] = []
  ): UserProgress {
    const current = this.getProgress();

    const isAlreadyCompleted = current.completedScenarioIds.includes(scenarioId);
    const updatedCompleted = isAlreadyCompleted
      ? current.completedScenarioIds
      : [...current.completedScenarioIds, scenarioId];

    // Merge learned expressions without duplicates
    const learnedSet = new Set([...current.learnedExpressionIds, ...expressionIdsToLearn]);

    const oldScenarioData = current.scenarioProgress[scenarioId];
    const prevStars = oldScenarioData?.stars || 0;
    const additionalStars = Math.max(0, stars - prevStars);

    const scenarioProgressUpdate: ScenarioCompletionData = {
      completedTurns,
      totalTurns,
      stars: Math.max(stars, prevStars),
      completedAt: new Date().toISOString(),
    };

    const updated: UserProgress = {
      ...current,
      completedScenarioIds: updatedCompleted,
      learnedExpressionIds: Array.from(learnedSet),
      lastPracticedScenarioId: scenarioId,
      totalTurnsPracticed: current.totalTurnsPracticed + completedTurns,
      totalStarsEarned: current.totalStarsEarned + additionalStars,
      scenarioProgress: {
        ...current.scenarioProgress,
        [scenarioId]: scenarioProgressUpdate,
      },
    };

    this.saveProgress(updated);
    return updated;
  }

  static toggleBookmark(expressionId: string): boolean {
    const current = this.getProgress();
    const set = new Set(current.bookmarkedExpressionIds);
    let isBookmarked = false;

    if (set.has(expressionId)) {
      set.delete(expressionId);
      isBookmarked = false;
    } else {
      set.add(expressionId);
      isBookmarked = true;
    }

    const updated: UserProgress = {
      ...current,
      bookmarkedExpressionIds: Array.from(set),
    };

    this.saveProgress(updated);
    return isBookmarked;
  }

  static isBookmarked(expressionId: string): boolean {
    const current = this.getProgress();
    return current.bookmarkedExpressionIds.includes(expressionId);
  }

  static setLastPracticed(scenarioId: string): void {
    const current = this.getProgress();
    const updated: UserProgress = {
      ...current,
      lastPracticedScenarioId: scenarioId,
    };
    this.saveProgress(updated);
  }
}
