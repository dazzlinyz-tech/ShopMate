import { DialogueTurn, FeedbackResult } from '../types/dialogue';

/**
 * Common English contractions and their standard expansions
 */
const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "i am": "i'm",
  "i'll": 'i will',
  "i will": "i'll",
  "i'd": 'i would',
  "i would": "i'd",
  "i've": 'i have',
  "i have": "i've",
  "we'll": 'we will',
  "we will": "we'll",
  "you'll": 'you will',
  "you will": "you'll",
  "can't": 'cannot',
  "cannot": "can't",
  "can not": "can't",
  "won't": 'will not',
  "will not": "won't",
  "don't": 'do not',
  "do not": "don't",
  "it's": 'it is',
  "it is": "it's",
  "that's": 'that is',
  "that is": "that's",
  "there's": 'there is',
  "there is": "there's",
  "what's": 'what is',
  "what is": "what's",
  "where's": 'where is',
  "where is": "where's",
  "could you": 'can you',
  "can you": 'could you',
  "i would like": "i'd like",
  "i'd like": 'i want',
  "i want": "i'd like",
};

/**
 * Common harmless filler words that middle schoolers or speech recognition introduce
 */
const FILLER_WORDS = new Set([
  'um',
  'uh',
  'er',
  'ah',
  'oh',
  'well',
  'hmm',
  'like',
  'just',
]);

/**
 * Normalizes speech input: strips punctuation, extra spaces, lowercases.
 * Normalizes t-shirt / tshirt variations.
 */
export function basicNormalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\b(t\s*shirt|tshirt)\b/g, 't-shirt')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes harmless speech fillers while preserving meaningful words
 */
export function removeFillers(text: string): string {
  const words = basicNormalize(text).split(' ');
  const filtered = words.filter((w) => !FILLER_WORDS.has(w));
  return filtered.join(' ');
}

/**
 * Expands contractions to uniform form for flexible comparison
 */
export function expandContractions(text: string): string {
  let result = basicNormalize(text);

  // Apply explicit phrase contractions
  result = result
    .replace(/\bi'll\b/g, 'i will')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bi'd\b/g, 'i would')
    .replace(/\bi've\b/g, 'i have')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bthat's\b/g, 'that is')
    .replace(/\bthere's\b/g, 'there is')
    .replace(/\bwhat's\b/g, 'what is')
    .replace(/\bwhere's\b/g, 'where is')
    .replace(/\bcould you\b/g, 'can you');

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Compresses expanded forms to contraction form for flexible comparison
 */
export function contractForms(text: string): string {
  let result = basicNormalize(text);

  result = result
    .replace(/\bi will\b/g, "i'll")
    .replace(/\bi am\b/g, "i'm")
    .replace(/\bi would\b/g, "i'd")
    .replace(/\bi have\b/g, "i've")
    .replace(/\bcannot\b/g, "can't")
    .replace(/\bwill not\b/g, "won't")
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bit is\b/g, "it's")
    .replace(/\bthat is\b/g, "that's")
    .replace(/\bthere is\b/g, "there's")
    .replace(/\bwhat is\b/g, "what's")
    .replace(/\bwhere is\b/g, "where's")
    .replace(/\bcan you\b/g, "could you");

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a word or phrase exists in the text
 */
export function matchesKeyword(text: string, keyword: string): boolean {
  const normText = basicNormalize(text);
  const normKw = basicNormalize(keyword);

  if (normKw === 't-shirt' || normKw === 'tshirt' || normKw === 't shirt') {
    return (
      normText.includes('t-shirt') ||
      normText.includes('tshirt') ||
      normText.includes('t shirt') ||
      normText.includes('shirt')
    );
  }

  // Multi-word keyword (e.g. "try on")
  if (normKw.includes(' ')) {
    return normText.includes(normKw);
  }

  const words = normText.split(' ');
  return words.includes(normKw) || normText.includes(normKw);
}

/**
 * Comprehensive evaluator for student spoken speech against target and alternatives.
 */
export function evaluateAnswer(
  spokenText: string,
  turn: DialogueTurn,
  attemptNumber: number
): {
  isSuccess: boolean;
  hasSmallWordMissing: boolean;
  missingSmallWord?: string;
  missingKeyWord?: string;
  firstLetterHint?: string;
  feedbackType: 'success' | 'small-word' | 'recast' | 'elicitation' | 'chunking' | 'silence';
  matchedAlternative?: string;
} {
  const rawSpoken = spokenText?.trim();
  if (!rawSpoken) {
    return {
      isSuccess: false,
      hasSmallWordMissing: false,
      feedbackType: 'silence',
    };
  }

  const cleanSpoken = removeFillers(rawSpoken);
  const expandedSpoken = expandContractions(cleanSpoken);
  const contractedSpoken = contractForms(cleanSpoken);

  // All candidate acceptable variants: target + accepted alternatives
  const allCandidates = [turn.studentTarget, ...(turn.acceptedAlternatives || [])];

  // 1. Direct exact or contraction match check
  for (const candidate of allCandidates) {
    const cleanCand = removeFillers(candidate);
    const expandedCand = expandContractions(cleanCand);
    const contractedCand = contractForms(cleanCand);

    if (
      cleanSpoken === cleanCand ||
      expandedSpoken === expandedCand ||
      contractedSpoken === contractedCand ||
      expandedSpoken === cleanCand ||
      contractedSpoken === cleanCand
    ) {
      return {
        isSuccess: true,
        hasSmallWordMissing: false,
        feedbackType: 'success',
        matchedAlternative: candidate,
      };
    }
  }

  // 2. Meaning & Keyword based validation
  // Rule: Do NOT accept solely because it contains one matching keyword.
  // Check whether it contains all required keywords or sufficient semantic density
  const missingKeywords = turn.keywords.filter((kw) => !matchesKeyword(cleanSpoken, kw));

  // Minimum required keywords check
  const requiredCount = turn.keywords.length;
  const matchedKeywordsCount = requiredCount - missingKeywords.length;

  // If there are multiple keywords, requiring only 1 is NOT enough
  const hasSubstantialKeywords =
    requiredCount <= 2 ? missingKeywords.length === 0 : matchedKeywordsCount >= requiredCount - 1;

  if (hasSubstantialKeywords) {
    // Meaning is communicated! Check if a polite or small word is missing
    const missingSmall = turn.smallWords?.find((sw) => {
      const normSw = basicNormalize(sw);
      const words = cleanSpoken.split(' ');
      return !words.includes(normSw) && !cleanSpoken.includes(normSw);
    });

    if (missingSmall) {
      return {
        isSuccess: true,
        hasSmallWordMissing: true,
        missingSmallWord: missingSmall,
        feedbackType: 'small-word',
      };
    }

    return {
      isSuccess: true,
      hasSmallWordMissing: false,
      feedbackType: 'success',
    };
  }

  // 3. Failed attempt -> Progressive Feedback
  const firstMissingKw = missingKeywords[0] || turn.keywords[0];
  const firstLetter = turn.firstLetterHints[firstMissingKw] || firstMissingKw.charAt(0).toUpperCase();

  if (attemptNumber === 1) {
    return {
      isSuccess: false,
      hasSmallWordMissing: false,
      feedbackType: 'recast',
    };
  } else if (attemptNumber === 2) {
    return {
      isSuccess: false,
      hasSmallWordMissing: false,
      missingKeyWord: firstMissingKw,
      firstLetterHint: firstLetter,
      feedbackType: 'elicitation',
    };
  } else {
    return {
      isSuccess: false,
      hasSmallWordMissing: false,
      feedbackType: 'chunking',
    };
  }
}
