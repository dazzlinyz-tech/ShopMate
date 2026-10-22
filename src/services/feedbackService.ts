import { DialogueTurn, FeedbackResult } from '../types/dialogue';
import { evaluateAnswer } from './evaluationService';

/**
 * Returns Section 7 deterministic bilingual feedback
 */
export function getSection7Feedback(
  type: 'success' | 'small-word' | 'recast' | 'elicitation' | 'chunking' | 'silence',
  turn: DialogueTurn,
  extra?: {
    missingSmallWord?: string;
    missingKeyWord?: string;
    firstLetterHint?: string;
    matchedAlternative?: string;
  }
): FeedbackResult {
  switch (type) {
    case 'silence':
      return {
        isSuccess: false,
        hasSmallWordMissing: false,
        feedbackType: 'silence',
        english: "That's okay! Tap the mic and try again.",
        korean: "괜찮아요! 마이크를 누르고 다시 시도해 보세요.",
      };

    case 'success':
      return {
        isSuccess: true,
        hasSmallWordMissing: false,
        feedbackType: 'success',
        matchedAlternative: extra?.matchedAlternative,
        english: "Great job! I understood you clearly.",
        korean: "잘했어요! 무슨 말인지 잘 이해했어요.",
      };

    case 'small-word': {
      const word = extra?.missingSmallWord || 'please';
      return {
        isSuccess: true,
        hasSmallWordMissing: true,
        missingSmallWord: word,
        feedbackType: 'small-word',
        english: `Nice job! Add "${word}" to complete your sentence.`,
        korean: `잘했어요! 문장을 완성하려면 "${word}"를 넣어 보세요.`,
      };
    }

    case 'recast':
      return {
        isSuccess: false,
        hasSmallWordMissing: false,
        feedbackType: 'recast',
        english: `Nice try! You can say, "${turn.studentTarget}"`,
        korean: "잘 시도했어요! 이렇게 말해 볼까요?",
      };

    case 'elicitation': {
      const kw = extra?.missingKeyWord || turn.keywords[0];
      const fl = extra?.firstLetterHint || kw.charAt(0).toUpperCase();
      return {
        isSuccess: false,
        hasSmallWordMissing: false,
        missingKeyWord: kw,
        firstLetterHint: fl,
        feedbackType: 'elicitation',
        english: `You're getting there! "${kw}" starts with "${fl}".`,
        korean: `거의 다 왔어요! 빠진 핵심 단어는 "${fl}"로 시작해요.`,
      };
    }

    case 'chunking':
      return {
        isSuccess: false,
        hasSmallWordMissing: false,
        feedbackType: 'chunking',
        english: `Good effort! Let's say it in small parts: "${turn.firstChunk}" / "${turn.nextChunk}"`,
        korean: "잘했어요! 짧은 부분으로 나누어 말해 보세요.",
      };
  }
}

/**
 * Evaluates spoken text and provides feedback.
 * Uses deterministic normalization and accepted alternatives first,
 * with optional Gemini enhancement.
 */
export async function getFeedback(
  spokenText: string,
  turn: DialogueTurn,
  attemptNumber: number,
  isSilent: boolean = false
): Promise<FeedbackResult> {
  if (isSilent || !spokenText?.trim()) {
    return getSection7Feedback('silence', turn);
  }

  const evalResult = evaluateAnswer(spokenText, turn, attemptNumber);
  const fallback = getSection7Feedback(evalResult.feedbackType, turn, {
    missingSmallWord: evalResult.missingSmallWord,
    missingKeyWord: evalResult.missingKeyWord,
    firstLetterHint: evalResult.firstLetterHint,
    matchedAlternative: evalResult.matchedAlternative,
  });

  // Attempt optional Gemini-powered contextual nuance via server route
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        targetSentence: turn.studentTarget,
        koreanMeaning: turn.koreanMeaning,
        spokenText,
        attemptNumber,
        isSuccess: evalResult.isSuccess,
        hasSmallWordMissing: evalResult.hasSmallWordMissing,
        missingSmallWord: evalResult.missingSmallWord,
        missingKeyWord: evalResult.missingKeyWord,
        firstLetterHint: evalResult.firstLetterHint,
        firstChunk: turn.firstChunk,
        nextChunk: turn.nextChunk,
        isSilent: false,
      }),
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.english && data.korean) {
        return {
          ...evalResult,
          english: data.english,
          korean: data.korean,
        };
      }
    }
  } catch {
    // Return deterministic fallback immediately
  }

  return fallback;
}
