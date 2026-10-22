import React from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Mic,
  RotateCcw,
  BookMarked,
  Award,
  Play,
} from 'lucide-react';
import { BrowserWarning } from './BrowserWarning';
import { sounds } from '../services/soundEffects';
import { UserProgress, ShoppingScenario } from '../types/dialogue';
import { getScenarioById, ALL_SCENARIOS } from '../data/scenarios';
import { IMAGES } from '../constants/images';

interface StartScreenProps {
  userProgress: UserProgress;
  onStart: () => void;
  onGoToExpressions: () => void;
  onGoToProgress: () => void;
  onResumeScenario: (scenario: ShoppingScenario) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  userProgress,
  onStart,
  onGoToExpressions,
  onGoToProgress,
  onResumeScenario,
}) => {
  const handleStart = () => {
    sounds.playTap();
    onStart();
  };

  const lastScenario = userProgress.lastPracticedScenarioId
    ? getScenarioById(userProgress.lastPracticedScenarioId)
    : null;

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-5 py-5 pb-24">
      {/* Top Section */}
      <header className="flex flex-col items-center text-center pt-1">
        {/* Brand Logo Lockup */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF806B] to-[#FFA28B] flex items-center justify-center shadow-md shadow-[#FF806B]/25 text-white">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="font-heading font-black text-2xl tracking-tight text-[#25364A]">
            Shop<span className="text-[#FF806B]">Mate</span>
          </span>
        </div>

        {/* Level & Subtitle */}
        <p className="text-xs font-semibold uppercase tracking-wider text-[#25364A]/60 mb-1">
          Middle School English Speaking Practice · 60 Scenarios
        </p>

        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#25364A] tracking-tight text-balance mt-0.5 mb-3">
          Let&apos;s Go Shopping!
        </h1>
      </header>

      {/* Middle Section: Hero Illustration & Intro */}
      <main className="flex-1 flex flex-col items-center justify-center my-1">
        {/* 3D Character & Store Scene Card */}
        <div className="relative w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden shadow-xl shadow-slate-300/60 border-4 border-white bg-gradient-to-b from-[#A9D5F5]/30 to-white">
          <img
            src={IMAGES.heroGreeting}
            alt="Lucy the store assistant welcoming you to shop"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />

          {/* Floating Tag */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#A9D5F5]/50 flex items-center justify-center text-[#25364A] font-bold text-xs shrink-0">
              👋
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-xs text-[#25364A] leading-tight">
                Meet Lucy
              </p>
              <p className="font-korean text-[11px] text-[#25364A]/70 truncate">
                상냥하고 친절한 매장 점원 루시예요!
              </p>
            </div>
          </div>
        </div>

        {/* Short introduction */}
        <div className="mt-4 text-center px-2">
          <p className="font-heading font-bold text-base text-[#25364A]">
            Practice shopping English with your friendly store assistant!
          </p>
          <p className="font-korean text-xs text-[#25364A]/75 mt-1 leading-relaxed">
            초급부터 실전까지 <span className="font-bold text-[#FF806B]">60가지 쇼핑 대화</span>를 듣고 말하며 루시의 피드백을 받아보세요.
          </p>
        </div>

        {/* Resume Previous Scenario Banner if available */}
        {lastScenario && (
          <div
            onClick={() => {
              sounds.playTap();
              onResumeScenario(lastScenario);
            }}
            className="w-full max-w-[340px] mt-3 p-3 bg-white/90 border border-[#FF806B]/30 hover:border-[#FF806B] rounded-2xl shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FF806B]/15 text-[#FF806B] flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 fill-[#FF806B]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-[#FF806B] uppercase tracking-wide">
                  최근 연습 이어하기 (L{lastScenario.level})
                </span>
                <p className="font-heading font-bold text-xs text-[#25364A] truncate">
                  {lastScenario.title}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
        )}

        {/* Mini 3-step practice flow indicator */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[340px] mt-3">
          <div className="bg-white/80 border border-slate-100 rounded-2xl p-2 text-center shadow-xs">
            <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-[#A9D5F5]/40 flex items-center justify-center text-[#25364A]">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <span className="block font-heading font-bold text-[11px] text-[#25364A]">1. Listen</span>
            <span className="font-korean text-[10px] text-[#25364A]/60">원어민 발음</span>
          </div>

          <div className="bg-white/80 border border-slate-100 rounded-2xl p-2 text-center shadow-xs">
            <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-[#FF806B]/20 flex items-center justify-center text-[#FF806B]">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="block font-heading font-bold text-[11px] text-[#25364A]">2. Speak</span>
            <span className="font-korean text-[10px] text-[#25364A]/60">마이크로 발화</span>
          </div>

          <div className="bg-white/80 border border-slate-100 rounded-2xl p-2 text-center shadow-xs">
            <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <span className="block font-heading font-bold text-[11px] text-[#25364A]">3. Feedback</span>
            <span className="font-korean text-[10px] text-[#25364A]/60">단계별 피드백</span>
          </div>
        </div>
      </main>

      {/* Bottom Section */}
      <footer className="pt-2 flex flex-col items-center">
        <BrowserWarning />

        {/* Start Shopping Button */}
        <button
          onClick={handleStart}
          className="w-full max-w-[340px] h-14 bg-gradient-to-r from-[#FF806B] to-[#FF6B52] hover:from-[#ff735c] hover:to-[#f85c41] active:scale-[0.98] transition-all duration-200 text-white font-heading font-extrabold text-lg rounded-2xl shadow-lg shadow-[#FF806B]/35 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Choose Your Level</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Privacy Notice */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-center max-w-[320px]">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-tight">
            Your voice is processed to turn it into text and is not recorded or saved.
            <br />
            <span className="font-korean text-[10px] text-slate-400">
              (음성은 텍스트 변환용으로만 처리되며 녹음되거나 저장되지 않습니다.)
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};
