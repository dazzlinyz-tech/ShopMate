import { DialogueTurn, FeedbackResult } from '../types/dialogue';
import { evaluateAnswer } from './evaluationService';

interface PraisePair {
  english: string;
  korean: string;
}

/**
 * Varied, friendly, and encouraging positive expressions
 * to make each response feel fresh, spontaneous, and natural.
 */
const SUCCESS_PRAISES: PraisePair[] = [
  {
    english: "That's fantastic! You said that so clearly.",
    korean: "정말 환상적이에요! 아주 또렷하고 자연스럽게 말씀하셨어요.",
  },
  {
    english: "You explained that really well! I understood right away.",
    korean: "정말 잘 설명해 주셨어요! 무슨 말인지 바로 이해했어요.",
  },
  {
    english: "I love how you expressed that! Sounded so natural.",
    korean: "표현이 정말 훌륭해요! 아주 자연스럽게 들렸어요.",
  },
  {
    english: "That sounds very natural! Great shopping English.",
    korean: "정말 자연스럽게 들려요! 멋진 쇼핑 영어 표현이에요.",
  },
  {
    english: "Nicely done! You got your point across easily.",
    korean: "참 잘했어요! 원하는 바를 아주 쉽게 전달하셨어요.",
  },
  {
    english: "You nailed it! That was spot on.",
    korean: "완벽하게 해냈어요! 정말 딱 알맞은 표현이에요.",
  },
  {
    english: "That's a great way to put it! Very polite and clear.",
    korean: "정말 좋은 표현 방법이에요! 공손하고 또렷했어요.",
  },
  {
    english: "Wonderful! You're sounding more and more confident.",
    korean: "훌륭해요! 점점 더 자신감 있게 영어가 술술 나오네요.",
  },
  {
    english: "Superb! Lucy understood you without any trouble.",
    korean: "대단해요! 루시가 한 번에 척 알아들었어요.",
  },
  {
    english: "Spot on! That's exactly how native speakers say it.",
    korean: "정확해요! 원어민들이 실제로 이렇게 자주 쓴답니다.",
  },
  {
    english: "Brilliant! That was smooth and easy to understand.",
    korean: "멋져요! 막힘없이 부드럽고 듣기 편했어요.",
  },
  {
    english: "Excellent job! You're speaking like a real shopper.",
    korean: "최고예요! 진짜 쇼핑 고수처럼 능숙하게 말했어요.",
  },
];

const SMALL_WORD_PRAISES: Array<(word: string) => PraisePair> = [
  (word) => ({
    english: `Nicely done! Add "${word}" to make it sound even more complete.`,
    korean: `참 잘했어요! 문장을 완성하려면 "${word}"를 넣어 보세요.`,
  }),
  (word) => ({
    english: `That sounds great! Just add "${word}" to polish your sentence.`,
    korean: `아주 좋아요! "${word}"만 더해주면 훨씬 더 자연스러워져요.`,
  }),
  (word) => ({
    english: `You expressed that well! Remember to include "${word}" next time.`,
    korean: `표현을 잘했어요! 다음에는 "${word}"도 함께 넣어 완성해 볼까요?`,
  }),
  (word) => ({
    english: `That's a great start! Try adding "${word}" for extra politeness.`,
    korean: `정말 훌륭해요! 공손함을 더하려면 "${word}"를 잊지 마세요.`,
  }),
  (word) => ({
    english: `You're almost perfect! Add "${word}" to finish the sentence cleanly.`,
    korean: `거의 완벽해요! 문장을 깔끔하게 맺으려면 "${word}"를 넣어 보세요.`,
  }),
];

let lastSuccessIndex = -1;
function getRandomSuccessPraise(): PraisePair {
  let idx: number;
  if (SUCCESS_PRAISES.length <= 1) {
    return SUCCESS_PRAISES[0];
  }
  do {
    idx = Math.floor(Math.random() * SUCCESS_PRAISES.length);
  } while (idx === lastSuccessIndex);
  lastSuccessIndex = idx;
  return SUCCESS_PRAISES[idx];
}

let lastSmallWordIndex = -1;
function getRandomSmallWordPraise(word: string): PraisePair {
  let idx: number;
  if (SMALL_WORD_PRAISES.length <= 1) {
    return SMALL_WORD_PRAISES[0](word);
  }
  do {
    idx = Math.floor(Math.random() * SMALL_WORD_PRAISES.length);
  } while (idx === lastSmallWordIndex);
  lastSmallWordIndex = idx;
  return SMALL_WORD_PRAISES[idx](word);
}

/**
 * Returns Section 7 deterministic bilingual feedback with varied positive praise.
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

    case 'success': {
      const praise = getRandomSuccessPraise();
      return {
        isSuccess: true,
        hasSmallWordMissing: false,
        feedbackType: 'success',
        matchedAlternative: extra?.matchedAlternative,
        english: praise.english,
        korean: praise.korean,
      };
    }

    case 'small-word': {
      const word = extra?.missingSmallWord || 'please';
      const praise = getRandomSmallWordPraise(word);
      return {
        isSuccess: true,
        hasSmallWordMissing: true,
        missingSmallWord: word,
        feedbackType: 'small-word',
        english: praise.english,
        korean: praise.korean,
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
