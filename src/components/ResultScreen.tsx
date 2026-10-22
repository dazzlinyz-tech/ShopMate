import React, { useState, useEffect } from 'react';
import {
  Star,
  RotateCcw,
  Home,
  Volume2,
  CheckCircle2,
  ArrowRight,
  BookMarked,
  Sparkles,
} from 'lucide-react';
import { ShoppingScenario, TurnProgress } from '../types/dialogue';
import { SpeechSynthesisManager } from '../services/speechService';
import { StorageService } from '../services/storageService';
import { sounds } from '../services/soundEffects';
import { ALL_SCENARIOS } from '../data/scenarios';

interface ResultScreenProps {
  scenario: ShoppingScenario;
  progressMap: Record<number, TurnProgress>;
  onPracticeAgain: () => void;
  onNextScenario?: (next: ShoppingScenario) => void;
  onBackToPractice: () => void;
  onViewInPhrasebook?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  scenario,
  progressMap,
  onPracticeAgain,
  onNextScenario,
  onBackToPractice,
  onViewInPhrasebook,
}) => {
  const turns = scenario.turns;
  const completedCount = turns.filter((t) => progressMap[t.id]?.completed).length;
  const totalCount = turns.length;

  // Star calculation based on completion proportion
  let starCount = 1;
  if (completedCount === totalCount) {
    starCount = 3;
  } else if (completedCount >= Math.ceil(totalCount / 2)) {
    starCount = 2;
  } else if (completedCount >= 1) {
    starCount = 1;
  } else {
    starCount = 0;
  }

  // Auto-record completion to localStorage on mount
  useEffect(() => {
    // Generate expression IDs from this scenario to unlock
    const expressionIds = turns.map((_, idx) => `expr-${scenario.id}-${idx + 1}`);
    StorageService.recordScenarioCompletion(
      scenario.id,
      starCount,
      completedCount,
      totalCount,
      expressionIds
    );
  }, [scenario.id, starCount, completedCount, totalCount, turns]);

  // Find next scenario in the curriculum
  const currentIndex = ALL_SCENARIOS.findIndex((s) => s.id === scenario.id);
  const nextScenario = currentIndex >= 0 && currentIndex < ALL_SCENARIOS.length - 1
    ? ALL_SCENARIOS[currentIndex + 1]
    : null;

  const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);

  const handlePlaySentence = (id: number, text: string) => {
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setPlayingSentenceId(id);
    SpeechSynthesisManager.play(
      text,
      0.9,
      () => setPlayingSentenceId(id),
      () => setPlayingSentenceId(null)
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-4 py-5 pb-8">
      {/* Top Section */}
      <header className="flex flex-col items-center text-center pt-1">
        {/* Star Badge */}
        <div className="flex items-center gap-1.5 mb-2">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= starCount;
            return (
              <div
                key={starIdx}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isEarned
                    ? 'bg-amber-100 text-amber-500 scale-105 ring-2 ring-amber-300/60'
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <Star
                  className={`w-5 h-5 ${
                    isEarned ? 'fill-amber-400 stroke-amber-500' : 'stroke-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#25364A] tracking-tight">
          Great Job!
        </h1>
        <p className="font-heading font-extrabold text-base text-[#FF806B]">
          You Finished Shopping!
        </p>

        {/* Celebrating Lucy 3D Character Card */}
        <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-slate-300/50 bg-gradient-to-b from-[#A9D5F5]/30 to-white mt-3 mb-2">
          <img
            src="/src/assets/images/lucy_celebrating_1792578552114.jpg"
            alt="Lucy celebrating"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs rounded-full p-1.5 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Turn completion tally */}
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 mt-1">
          <span className="font-heading font-black text-sm text-[#25364A]">
            {completedCount} / {totalCount} Turns Completed
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="font-korean text-xs font-semibold text-emerald-600">
            {starCount}개 별 획득!
          </span>
        </div>
      </header>

      {/* Middle Section: Review List of Sentences */}
      <main className="flex-1 my-3 overflow-y-auto max-h-[38vh] pr-0.5 space-y-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Review Sentences (복습하기)
          </span>
          <span className="text-[10px] text-slate-400">음성 아이콘으로 다시 듣기</span>
        </div>

        {turns.map((turn, index) => {
          const progress = progressMap[turn.id];
          const isDone = progress?.completed;
          const isPlaying = playingSentenceId === turn.id;

          return (
            <div
              key={turn.id}
              className={`p-3.5 rounded-2xl border transition-all duration-200 ${
                isDone
                  ? 'bg-white border-slate-200/80 shadow-xs'
                  : 'bg-slate-50/80 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-extrabold text-[#FF806B] uppercase tracking-wide">
                      Turn {index + 1}
                    </span>
                    {isDone ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                        <CheckCircle2 className="w-3 h-3" />
                        완료
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded-md">
                        건너뜀
                      </span>
                    )}
                  </div>

                  <p className="font-heading font-extrabold text-sm text-[#25364A] leading-snug">
                    {turn.studentTarget}
                  </p>
                  <p className="font-korean text-xs text-[#25364A]/70 mt-0.5">
                    {turn.koreanMeaning}
                  </p>
                </div>

                <button
                  onClick={() => handlePlaySentence(turn.id, turn.studentTarget)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors border cursor-pointer ${
                    isPlaying
                      ? 'bg-[#FF806B] border-[#FF806B] text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-[#25364A] hover:bg-slate-100'
                  }`}
                  title="Listen to sentence"
                >
                  <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Section Actions */}
      <footer className="pt-2 pb-1 space-y-2">
        {/* Next Scenario Button if available */}
        {nextScenario && onNextScenario && (
          <button
            onClick={() => {
              sounds.playTap();
              onNextScenario(nextScenario);
            }}
            className="w-full h-13 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-heading font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <span>Next Scenario ({nextScenario.title})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Practice Again Button */}
        <button
          onClick={() => {
            sounds.playTap();
            onPracticeAgain();
          }}
          className="w-full h-11 bg-gradient-to-r from-[#FF806B] to-[#FF6B52] hover:from-[#ff735c] text-white font-heading font-extrabold text-xs rounded-2xl shadow-md shadow-[#FF806B]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Practice Again (이 시나리오 다시하기)</span>
        </button>

        {/* Action Row: My Expressions & Back to Practice */}
        <div className="grid grid-cols-2 gap-2">
          {onViewInPhrasebook && (
            <button
              onClick={() => {
                sounds.playTap();
                onViewInPhrasebook();
              }}
              className="h-11 bg-white hover:bg-slate-50 border border-slate-200/90 text-[#25364A] font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#FF806B]" />
              <span>내 표현 모음</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playTap();
              onBackToPractice();
            }}
            className="h-11 bg-white hover:bg-slate-50 border border-slate-200/90 text-[#25364A] font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>목록으로</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
