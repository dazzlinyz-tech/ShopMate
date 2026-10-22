export interface DialogueTurn {
  id: number;
  partnerPrompt: string;
  partnerKorean: string;
  studentTarget: string;
  koreanMeaning: string;
  acceptedAlternatives?: string[];
  keywords: string[];
  smallWords: string[];
  firstChunk: string;
  nextChunk: string;
  firstLetterHints: Record<string, string>;
  category?: string;
  categoryKo?: string;
}

export interface ShoppingScenario {
  id: string;
  level: 1 | 2 | 3;
  topic: string;
  topicKo: string;
  title: string;
  titleKo: string;
  situation: string;
  situationKo: string;
  turns: DialogueTurn[];
}

export interface ExpressionItem {
  id: string;
  english: string;
  korean: string;
  category: string;
  categoryKo: string;
  level: 1 | 2 | 3;
  exampleDialogue: {
    lucy: string;
    lucyKo: string;
    student: string;
    studentKo: string;
  };
  scenarioId?: string;
}

export interface FeedbackResult {
  isSuccess: boolean;
  hasSmallWordMissing: boolean;
  feedbackType: 'success' | 'small-word' | 'recast' | 'elicitation' | 'chunking' | 'silence';
  english: string;
  korean: string;
  missingKeyWord?: string;
  firstLetterHint?: string;
  missingSmallWord?: string;
  matchedAlternative?: string;
}

export interface TurnProgress {
  turnId: number;
  attempts: number;
  completed: boolean;
  spokenText: string;
  feedbackHistory: FeedbackResult[];
  skipped: boolean;
}

export interface ScenarioCompletionData {
  completedTurns: number;
  totalTurns: number;
  stars: number;
  completedAt: string;
}

export interface UserProgress {
  completedScenarioIds: string[];
  bookmarkedExpressionIds: string[];
  learnedExpressionIds: string[];
  lastPracticedScenarioId: string | null;
  totalTurnsPracticed: number;
  totalStarsEarned: number;
  scenarioProgress: Record<string, ScenarioCompletionData>;
}
