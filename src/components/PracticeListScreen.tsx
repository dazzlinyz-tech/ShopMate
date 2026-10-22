import React, { useState } from 'react';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Play,
  Star,
  ChevronRight,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { ShoppingScenario, UserProgress } from '../types/dialogue';
import { SCENARIOS_BY_LEVEL, ALL_SCENARIOS } from '../data/scenarios';
import { sounds } from '../services/soundEffects';

interface PracticeListScreenProps {
  userProgress: UserProgress;
  onSelectScenario: (scenario: ShoppingScenario) => void;
  onStartLevelPractice: (level: 1 | 2 | 3) => void;
}

export const PracticeListScreen: React.FC<PracticeListScreenProps> = ({
  userProgress,
  onSelectScenario,
  onStartLevelPractice,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);

  const levelConfigs = [
    {
      level: 1 as const,
      badge: 'Level 1',
      name: 'Beginner (A1)',
      nameKo: '초급 · 기초 표현',
      descKo: '기본 인사, 도움 요청, 물건 찾기, 색상, 사이즈, 가격 묻기',
      color: 'from-amber-400/20 to-orange-400/10',
      border: 'border-amber-200/90',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    {
      level: 2 as const,
      badge: 'Level 2',
      name: 'Elementary (A1–A2)',
      nameKo: '중급 · 실전 쇼핑',
      descKo: '옷 입어보기, 재고 문의, 제품 비교, 선호 표현, 사이즈 교체',
      color: 'from-[#A9D5F5]/30 to-sky-400/10',
      border: 'border-[#A9D5F5]',
      badgeBg: 'bg-[#A9D5F5]/60 text-sky-900',
    },
    {
      level: 3 as const,
      badge: 'Level 3',
      name: 'Pre-Intermediate (A2)',
      nameKo: '상급 · 유창한 대화',
      descKo: '교환 및 환불, 할인 적용, 결제 수단, 품절 대처, 점원 추천, 문제 해결',
      color: 'from-rose-400/20 to-[#FF806B]/10',
      border: 'border-[#FF806B]/40',
      badgeBg: 'bg-rose-100 text-rose-800',
    },
  ];

  const currentLevelScenarios = SCENARIOS_BY_LEVEL[selectedLevel] || [];
  const completedInLevel = currentLevelScenarios.filter((s) =>
    userProgress.completedScenarioIds.includes(s.id)
  ).length;

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#25364A] tracking-tight">
              Shopping Practice
            </h1>
            <p className="font-korean text-xs text-[#25364A]/70 mt-0.5">
              난이도별 60가지 실전 쇼핑 시나리오를 자유롭게 연습하세요
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#A9D5F5]/30 border border-[#A9D5F5]/70 flex items-center justify-center text-[#25364A]">
            <ShoppingBag className="w-5 h-5 text-[#25364A]" />
          </div>
        </div>
      </header>

      {/* 3 Distinct Level Cards */}
      <div className="space-y-3 mb-6">
        {levelConfigs.map((cfg) => {
          const scenarios = SCENARIOS_BY_LEVEL[cfg.level];
          const completedCount = scenarios.filter((s) =>
            userProgress.completedScenarioIds.includes(s.id)
          ).length;
          const isSelected = selectedLevel === cfg.level;
          const progressPercent = Math.round((completedCount / scenarios.length) * 100);

          return (
            <div
              key={cfg.level}
              onClick={() => {
                sounds.playTap();
                setSelectedLevel(cfg.level);
              }}
              className={`p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer shadow-xs ${
                isSelected
                  ? `bg-white ${cfg.border} ring-2 ring-[#FF806B]/30 shadow-md`
                  : 'bg-white/70 border-slate-200/80 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${cfg.badgeBg}`}>
                      {cfg.badge}
                    </span>
                    <span className="font-heading font-extrabold text-xs text-slate-500">
                      {cfg.name}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-[#25364A]">
                    {cfg.nameKo}
                  </h3>
                  <p className="font-korean text-xs text-[#25364A]/70 mt-0.5 leading-snug">
                    {cfg.descKo}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-heading font-black text-sm text-[#25364A]">
                    {completedCount} <span className="text-xs text-slate-400">/ {scenarios.length}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">완료</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-[#FF806B] to-[#ffa394] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick Actions if selected */}
              {isSelected && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {scenarios.length}개 시나리오 준비됨
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTap();
                      onStartLevelPractice(cfg.level);
                    }}
                    className="h-9 px-3.5 bg-gradient-to-r from-[#FF806B] to-[#FF6B52] hover:from-[#ff735c] text-white text-xs font-heading font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>Start Practice</span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scenario List for the Selected Level */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-extrabold text-sm text-[#25364A]">
              Level {selectedLevel} Scenarios
            </span>
            <span className="text-xs text-slate-400">({currentLevelScenarios.length})</span>
          </div>
          <span className="text-[11px] font-semibold text-[#FF806B]">
            {completedInLevel}개 완료
          </span>
        </div>

        <div className="space-y-2.5">
          {currentLevelScenarios.map((scenario, index) => {
            const isCompleted = userProgress.completedScenarioIds.includes(scenario.id);
            const scenarioData = userProgress.scenarioProgress[scenario.id];
            const stars = scenarioData?.stars || 0;

            return (
              <div
                key={scenario.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectScenario(scenario);
                }}
                className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer ${
                  isCompleted
                    ? 'bg-white border-slate-200/90 shadow-xs hover:border-[#FF806B]/50'
                    : 'bg-white/80 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black text-slate-400">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                        {scenario.topicKo}
                      </span>
                      {isCompleted && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: stars || 1 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                          ))}
                        </div>
                      )}
                    </div>

                    <h4 className="font-heading font-extrabold text-sm text-[#25364A] truncate">
                      {scenario.title}
                    </h4>
                    <p className="font-korean text-xs text-[#25364A]/70 line-clamp-1 mt-0.5">
                      {scenario.situationKo}
                    </p>
                  </div>

                  {/* Practice / Repeat button */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        onSelectScenario(scenario);
                      }}
                      className={`h-8 px-2.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        isCompleted
                          ? 'bg-slate-100 text-[#25364A] hover:bg-slate-200'
                          : 'bg-[#FF806B] text-white hover:bg-[#ff735c] shadow-xs'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          <span className="text-[11px]">다시</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-white" />
                          <span className="text-[11px]">시작</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
