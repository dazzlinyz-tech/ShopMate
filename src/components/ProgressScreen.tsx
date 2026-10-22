import React from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  BookMarked,
  RotateCcw,
  Sparkles,
  Play,
  ShoppingBag,
} from 'lucide-react';
import { UserProgress, ShoppingScenario } from '../types/dialogue';
import { ALL_SCENARIOS, SCENARIOS_BY_LEVEL, getScenarioById } from '../data/scenarios';
import { sounds } from '../services/soundEffects';
import { IMAGES } from '../constants/images';

interface ProgressScreenProps {
  userProgress: UserProgress;
  onSelectScenario: (scenario: ShoppingScenario) => void;
  onGoToPractice: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  userProgress,
  onSelectScenario,
  onGoToPractice,
}) => {
  const totalScenarios = ALL_SCENARIOS.length;
  const completedCount = userProgress.completedScenarioIds.length;
  const learnedCount = userProgress.learnedExpressionIds.length;
  const totalStars = userProgress.totalStarsEarned;

  // Level completion stats
  const l1Count = SCENARIOS_BY_LEVEL[1].filter((s) =>
    userProgress.completedScenarioIds.includes(s.id)
  ).length;
  const l2Count = SCENARIOS_BY_LEVEL[2].filter((s) =>
    userProgress.completedScenarioIds.includes(s.id)
  ).length;
  const l3Count = SCENARIOS_BY_LEVEL[3].filter((s) =>
    userProgress.completedScenarioIds.includes(s.id)
  ).length;

  // Recently practiced scenarios
  const recentScenarioIds = Object.entries(userProgress.scenarioProgress)
    .sort(
      ([, a], [, b]) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .slice(0, 5)
    .map(([id]) => id);

  const recentScenarios = recentScenarioIds
    .map((id) => getScenarioById(id))
    .filter((s): s is ShoppingScenario => Boolean(s));

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#25364A] tracking-tight">
              My Learning Progress
            </h1>
            <p className="font-korean text-xs text-[#25364A]/70 mt-0.5">
              쇼핑 회화 실력과 완료한 시나리오 현황입니다
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </header>

      {/* Lucy Encouragement Banner */}
      <div className="bg-gradient-to-r from-[#A9D5F5]/40 via-white to-[#FF806B]/15 rounded-3xl p-4 border border-[#A9D5F5]/60 shadow-xs mb-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm bg-white">
          <img
            src={IMAGES.celebrating}
            alt="Lucy"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1">
          <p className="font-heading font-extrabold text-xs text-[#FF806B]">
            Lucy&apos;s Cheer
          </p>
          <p className="font-korean text-xs text-[#25364A] font-medium leading-relaxed mt-0.5">
            {completedCount === 0
              ? '첫 번째 쇼핑 연습을 시작해 볼까요? 천천히 말해도 괜찮아요!'
              : completedCount < 10
              ? '벌써 유용한 표현들을 말하기 시작했어요! 꾸준히 연습해 봐요.'
              : '어디서든 영어로 자신 있게 쇼핑할 수 있을 만큼 성장하고 있어요!'}
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="block font-heading font-black text-xl text-[#25364A]">
            {completedCount}
          </span>
          <span className="font-korean text-[10px] text-slate-400 font-semibold">
            완료 시나리오
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-500" />
          </div>
          <span className="block font-heading font-black text-xl text-[#25364A]">
            {totalStars}
          </span>
          <span className="font-korean text-[10px] text-slate-400 font-semibold">
            획득한 별
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
          <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-[#A9D5F5]/30 text-[#25364A] flex items-center justify-center">
            <BookMarked className="w-4 h-4" />
          </div>
          <span className="block font-heading font-black text-xl text-[#25364A]">
            {learnedCount}
          </span>
          <span className="font-korean text-[10px] text-slate-400 font-semibold">
            학습한 표현
          </span>
        </div>
      </div>

      {/* Level Breakdown Section */}
      <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs mb-4">
        <h3 className="font-heading font-extrabold text-sm text-[#25364A] mb-3">
          Level Progress (레벨별 달성도)
        </h3>

        <div className="space-y-3">
          {/* Level 1 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-heading font-bold text-[#25364A]">
                Level 1 · Beginner
              </span>
              <span className="font-heading font-black text-slate-600">
                {l1Count} / 20
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(l1Count / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Level 2 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-heading font-bold text-[#25364A]">
                Level 2 · Elementary
              </span>
              <span className="font-heading font-black text-slate-600">
                {l2Count} / 20
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#A9D5F5] rounded-full transition-all duration-500"
                style={{ width: `${(l2Count / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* Level 3 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-heading font-bold text-[#25364A]">
                Level 3 · Pre-Intermediate
              </span>
              <span className="font-heading font-black text-slate-600">
                {l3Count} / 20
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF806B] rounded-full transition-all duration-500"
                style={{ width: `${(l3Count / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recently Practiced Scenarios */}
      <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-extrabold text-sm text-[#25364A]">
            Recently Practiced (최근 연습한 시나리오)
          </h3>
        </div>

        {recentScenarios.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
            <p className="font-korean text-xs">아직 연습한 시나리오가 없습니다.</p>
            <button
              onClick={() => {
                sounds.playTap();
                onGoToPractice();
              }}
              className="mt-3 px-4 py-2 bg-[#FF806B] text-white font-heading font-bold text-xs rounded-xl shadow-xs"
            >
              쇼핑 연습 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentScenarios.map((scenario) => {
              const data = userProgress.scenarioProgress[scenario.id];
              return (
                <div
                  key={scenario.id}
                  onClick={() => {
                    sounds.playTap();
                    onSelectScenario(scenario);
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#FF806B]">
                        L{scenario.level}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-[#25364A] truncate">
                        {scenario.title}
                      </h4>
                    </div>
                    <p className="font-korean text-[11px] text-slate-500 truncate mt-0.5">
                      {scenario.titleKo}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from({ length: data?.stars || 1 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                    ))}
                    <button className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 ml-1">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Action Button */}
      <button
        onClick={() => {
          sounds.playTap();
          onGoToPractice();
        }}
        className="w-full h-12 bg-gradient-to-r from-[#FF806B] to-[#FF6B52] hover:from-[#ff735c] text-white font-heading font-extrabold text-sm rounded-2xl shadow-md shadow-[#FF806B]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
      >
        <span>Continue Practice (연습 이어하기)</span>
        <Play className="w-4 h-4 fill-white" />
      </button>
    </div>
  );
};
