import { ShoppingScenario, ExpressionItem } from '../../types/dialogue';
import { LEVEL_1_SCENARIOS } from './level1';
import { LEVEL_2_SCENARIOS } from './level2';
import { LEVEL_3_SCENARIOS } from './level3';

export const ALL_SCENARIOS: ShoppingScenario[] = [
  ...LEVEL_1_SCENARIOS,
  ...LEVEL_2_SCENARIOS,
  ...LEVEL_3_SCENARIOS,
];

export const SCENARIOS_BY_LEVEL: Record<1 | 2 | 3, ShoppingScenario[]> = {
  1: LEVEL_1_SCENARIOS,
  2: LEVEL_2_SCENARIOS,
  3: LEVEL_3_SCENARIOS,
};

export function getScenarioById(id: string): ShoppingScenario | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByLevel(level: 1 | 2 | 3): ShoppingScenario[] {
  return SCENARIOS_BY_LEVEL[level] || [];
}

/**
 * Standard shopping expression categories
 */
export const PHRASEBOOK_CATEGORIES = [
  { id: 'all', label: 'All', labelKo: '전체' },
  { id: 'Greetings & Help', label: 'Greetings & Help', labelKo: '인사 및 도움 요청' },
  { id: 'Finding Products', label: 'Finding Products', labelKo: '상품 찾기' },
  { id: 'Colors & Sizes', label: 'Colors & Sizes', labelKo: '색상 및 사이즈' },
  { id: 'Asking Prices', label: 'Asking Prices', labelKo: '가격 묻기' },
  { id: 'Trying on Clothes', label: 'Trying on Clothes', labelKo: '옷 입어보기' },
  { id: 'Expressing Preferences', label: 'Preferences', labelKo: '선호 표현하기' },
  { id: 'Buying & Paying', label: 'Buying & Paying', labelKo: '구매 및 결제' },
  { id: 'Exchanges & Returns', label: 'Exchanges & Returns', labelKo: '교환 및 환불' },
  { id: 'Discounts & Promotions', label: 'Discounts', labelKo: '할인 및 프로모션' },
  { id: 'Problem Solving', label: 'Problem Solving', labelKo: '문제 해결' },
  { id: 'Useful Polite Expressions', label: 'Polite Phrases', labelKo: '유용한 공손 표현' },
] as const;

/**
 * Generates the full phrasebook collection from all 60 scenarios without duplicate expressions
 */
function buildExpressionsCatalog(): ExpressionItem[] {
  const seenMap = new Map<string, ExpressionItem>();

  ALL_SCENARIOS.forEach((scenario) => {
    scenario.turns.forEach((turn, turnIdx) => {
      const normalizedKey = turn.studentTarget.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seenMap.has(normalizedKey)) {
        const category = turn.category || scenario.topic;
        const categoryKo = turn.categoryKo || scenario.topicKo;

        seenMap.set(normalizedKey, {
          id: `expr-${scenario.id}-${turnIdx + 1}`,
          english: turn.studentTarget,
          korean: turn.koreanMeaning,
          category,
          categoryKo,
          level: scenario.level,
          exampleDialogue: {
            lucy: turn.partnerPrompt,
            lucyKo: turn.partnerKorean,
            student: turn.studentTarget,
            studentKo: turn.koreanMeaning,
          },
          scenarioId: scenario.id,
        });
      }
    });
  });

  return Array.from(seenMap.values());
}

export const EXPRESSIONS_CATALOG: ExpressionItem[] = buildExpressionsCatalog();
