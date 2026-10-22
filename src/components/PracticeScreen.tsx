import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  RotateCcw,
  ArrowRight,
  SkipForward,
  ChevronLeft,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { DialogueTurn, FeedbackResult, TurnProgress, ShoppingScenario } from '../types/dialogue';
import { ALL_SCENARIOS } from '../data/scenarios';
import {
  SpeechSynthesisManager,
  SpeechRecognizerSession,
} from '../services/speechService';
import { getFeedback } from '../services/feedbackService';
import { BrowserWarning } from './BrowserWarning';
import { sounds } from '../services/soundEffects';

interface PracticeScreenProps {
  scenario?: ShoppingScenario;
  onFinish: (scenario: ShoppingScenario, progress: Record<number, TurnProgress>) => void;
  onBackToHome: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  scenario = ALL_SCENARIOS[0],
  onFinish,
  onBackToHome,
}) => {
  const turns = scenario.turns;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentTurn: DialogueTurn = turns[currentStepIndex] || turns[0];

  // Turn progress tracking across all turns of the scenario
  const [turnProgressMap, setTurnProgressMap] = useState<Record<number, TurnProgress>>(() => {
    const initial: Record<number, TurnProgress> = {};
    turns.forEach((turn) => {
      initial[turn.id] = {
        turnId: turn.id,
        attempts: 0,
        completed: false,
        spokenText: '',
        feedbackHistory: [],
        skipped: false,
      };
    });
    return initial;
  });

  // Re-initialize if scenario changes
  useEffect(() => {
    setCurrentStepIndex(0);
    const initial: Record<number, TurnProgress> = {};
    scenario.turns.forEach((turn) => {
      initial[turn.id] = {
        turnId: turn.id,
        attempts: 0,
        completed: false,
        spokenText: '',
        feedbackHistory: [],
        skipped: false,
      };
    });
    setTurnProgressMap(initial);
  }, [scenario.id]);

  // Active step states
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingModel, setIsSpeakingModel] = useState(false);
  const [activeSpeechSpeed, setActiveSpeechSpeed] = useState<'normal' | 'slow' | 'question' | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [micError, setMicError] = useState<{ code: string; message: string } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Recognition session ref
  const recognizerRef = useRef<SpeechRecognizerSession | null>(null);
  const cancelTtsRef = useRef<(() => void) | null>(null);

  // Play partner question once when switching to a new question
  useEffect(() => {
    setSpokenText('');
    setFeedback(null);
    setMicError(null);
    setIsListening(false);

    SpeechSynthesisManager.stop();
    if (recognizerRef.current) {
      recognizerRef.current.abort();
    }

    const timer = setTimeout(() => {
      setIsSpeakingModel(true);
      setActiveSpeechSpeed('question');
      cancelTtsRef.current = SpeechSynthesisManager.play(
        currentTurn.partnerPrompt,
        0.9,
        () => {
          setIsSpeakingModel(true);
          setActiveSpeechSpeed('question');
        },
        () => {
          setIsSpeakingModel(false);
          setActiveSpeechSpeed(null);
        }
      );
    }, 400);

    return () => {
      clearTimeout(timer);
      SpeechSynthesisManager.stop();
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, [currentStepIndex, currentTurn.partnerPrompt]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      SpeechSynthesisManager.stop();
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  // Listen to Partner Question
  const handlePlayQuestion = () => {
    if (isListening) return;
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setIsSpeakingModel(true);
    setActiveSpeechSpeed('question');
    cancelTtsRef.current = SpeechSynthesisManager.play(
      currentTurn.partnerPrompt,
      0.9,
      () => {
        setIsSpeakingModel(true);
        setActiveSpeechSpeed('question');
      },
      () => {
        setIsSpeakingModel(false);
        setActiveSpeechSpeed(null);
      }
    );
  };

  // Play Target Model Sentence: Normal (0.9x)
  const handlePlayNormal = () => {
    if (isListening) return;
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setIsSpeakingModel(true);
    setActiveSpeechSpeed('normal');
    cancelTtsRef.current = SpeechSynthesisManager.play(
      currentTurn.studentTarget,
      0.9,
      () => {
        setIsSpeakingModel(true);
        setActiveSpeechSpeed('normal');
      },
      () => {
        setIsSpeakingModel(false);
        setActiveSpeechSpeed(null);
      }
    );
  };

  // Play Target Model Sentence: Slow (0.7x)
  const handlePlaySlow = () => {
    if (isListening) return;
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setIsSpeakingModel(true);
    setActiveSpeechSpeed('slow');
    cancelTtsRef.current = SpeechSynthesisManager.play(
      currentTurn.studentTarget,
      0.7,
      () => {
        setIsSpeakingModel(true);
        setActiveSpeechSpeed('slow');
      },
      () => {
        setIsSpeakingModel(false);
        setActiveSpeechSpeed(null);
      }
    );
  };

  // Start Speech Recognition
  const handleStartListening = () => {
    if (isSpeakingModel) {
      SpeechSynthesisManager.stop();
      setIsSpeakingModel(false);
      setActiveSpeechSpeed(null);
    }

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    sounds.playTap();
    setMicError(null);
    setIsListening(true);
    setSpokenText('');

    recognizerRef.current = new SpeechRecognizerSession({
      onStart: () => {
        setIsListening(true);
      },
      onInterim: (text) => {
        setSpokenText(text);
      },
      onFinal: async (finalTranscript) => {
        setIsListening(false);
        setSpokenText(finalTranscript);
        await processSpokenInput(finalTranscript);
      },
      onError: async (code, message) => {
        setIsListening(false);
        if (code === 'not-allowed') {
          setMicError({ code: 'not-allowed', message: message || 'Microphone permission denied.' });
        } else if (code === 'no-speech') {
          sounds.playEncouragement();
          const silenceFeedback = await getFeedback('', currentTurn, 1, true);
          setFeedback(silenceFeedback);
        } else {
          setMicError({ code, message: message || 'Speech recognition error.' });
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current.start();
  };

  // Process and evaluate student's spoken input
  const processSpokenInput = async (text: string) => {
    if (!text.trim()) {
      sounds.playEncouragement();
      const silenceFeedback = await getFeedback('', currentTurn, 1, true);
      setFeedback(silenceFeedback);
      return;
    }

    setIsLoadingFeedback(true);
    const prevTurnData = turnProgressMap[currentTurn.id] || {
      turnId: currentTurn.id,
      attempts: 0,
      completed: false,
      spokenText: '',
      feedbackHistory: [],
      skipped: false,
    };
    const newAttemptNumber = prevTurnData.attempts + 1;

    try {
      const result = await getFeedback(text, currentTurn, newAttemptNumber, false);
      setFeedback(result);

      if (result.isSuccess) {
        sounds.playSuccess();
      } else {
        sounds.playEncouragement();
      }

      setTurnProgressMap((prev) => ({
        ...prev,
        [currentTurn.id]: {
          ...prev[currentTurn.id],
          attempts: newAttemptNumber,
          completed: result.isSuccess ? true : prev[currentTurn.id]?.completed || false,
          spokenText: text,
          feedbackHistory: [...(prev[currentTurn.id]?.feedbackHistory || []), result],
          skipped: false,
        },
      }));
    } catch {
      // Fallback
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Try Again Button
  const handleTryAgain = () => {
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setSpokenText('');
    setFeedback(null);
    setMicError(null);
    handleStartListening();
  };

  // Skip Button
  const handleSkip = () => {
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setTurnProgressMap((prev) => ({
      ...prev,
      [currentTurn.id]: {
        ...prev[currentTurn.id],
        skipped: true,
      },
    }));
    handleGoNext();
  };

  // Next Button
  const handleGoNext = () => {
    sounds.playTap();
    SpeechSynthesisManager.stop();
    if (currentStepIndex < turns.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      sounds.playFanfare();
      onFinish(scenario, turnProgressMap);
    }
  };

  const currentProgress = turnProgressMap[currentTurn.id] || { completed: false };
  const isTurnCompleted = currentProgress.completed;

  // Decide Lucy portrait
  let lucyImageSrc = '/src/assets/images/lucy_assistant_avatar_1792578551775.jpg';
  if (isListening) {
    lucyImageSrc = '/src/assets/images/lucy_listening_1792578551021.jpg';
  } else if (isTurnCompleted) {
    lucyImageSrc = '/src/assets/images/lucy_celebrating_1792578552114.jpg';
  }

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-4 py-4 pb-6">
      {/* Top Bar */}
      <header className="w-full">
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Back button */}
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#25364A] hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            aria-label="Back to home"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Center Title & Counter */}
          <div className="text-center flex-1 min-w-0 px-2">
            <span className="font-heading font-black text-xs uppercase tracking-wider text-[#FF806B]">
              Question {currentStepIndex + 1} of {turns.length} · L{scenario.level}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5 truncate">
              <span className="font-heading font-extrabold text-sm text-[#25364A] truncate">
                {scenario.title}
              </span>
            </div>
          </div>

          {/* Compact brand logo badge */}
          <div className="w-10 h-10 rounded-xl bg-[#A9D5F5]/30 border border-[#A9D5F5]/60 flex items-center justify-center text-[#25364A] shrink-0">
            <ShoppingBag className="w-4 h-4 text-[#25364A]" />
          </div>
        </div>

        {/* Progress pill indicator */}
        <div
          className="grid gap-1.5 mt-1 px-1"
          style={{ gridTemplateColumns: `repeat(${turns.length}, minmax(0, 1fr))` }}
        >
          {turns.map((item, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isDone = turnProgressMap[item.id]?.completed;
            const isSkipped = turnProgressMap[item.id]?.skipped && !isDone;

            let barColor = 'bg-slate-200';
            if (isDone) barColor = 'bg-emerald-500';
            else if (isCurrent) barColor = 'bg-[#FF806B]';
            else if (isSkipped) barColor = 'bg-amber-300';

            return (
              <div key={item.id} className="h-2 rounded-full overflow-hidden bg-slate-200/80">
                <div
                  className={`h-full ${barColor} transition-all duration-300 ${
                    isCurrent ? 'w-full animate-pulse' : 'w-full'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center my-3 gap-3.5">
        <BrowserWarning
          micPermissionDenied={micError?.code === 'not-allowed'}
          onDismissMicError={() => setMicError(null)}
        />

        {/* Conversation Section: Lucy Avatar & Speech Bubble */}
        <section className="flex items-start gap-3 bg-white/70 backdrop-blur-xs p-3.5 rounded-3xl border border-slate-200/70 shadow-xs">
          {/* Lucy Character Thumbnail */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md shadow-slate-200 bg-[#A9D5F5]/40">
              <img
                src={lucyImageSrc}
                alt="Lucy the store assistant"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FF806B] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-xs uppercase tracking-tight">
              Lucy
            </span>
          </div>

          {/* Speech Bubble */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[11px] font-bold text-[#FF806B] uppercase tracking-wide">
                Store Assistant
              </span>
              <button
                onClick={handlePlayQuestion}
                disabled={isListening}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                  activeSpeechSpeed === 'question'
                    ? 'bg-[#FF806B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Listen to Lucy again"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="text-[10px]">다시 듣기</span>
              </button>
            </div>

            <p className="font-heading font-extrabold text-base text-[#25364A] leading-snug">
              &ldquo;{currentTurn.partnerPrompt}&rdquo;
            </p>
            <p className="font-korean text-xs text-[#25364A]/70 mt-0.5">
              {currentTurn.partnerKorean}
            </p>
          </div>
        </section>

        {/* Target Sentence Card */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              Target Sentence (내가 말할 문장)
            </span>
          </div>

          {/* Large English Target Sentence */}
          <h2 className="font-heading font-black text-2xl sm:text-[28px] text-[#25364A] leading-tight tracking-tight my-1 text-balance">
            {currentTurn.studentTarget}
          </h2>

          {/* Korean Meaning */}
          <p className="font-korean text-sm font-semibold text-[#25364A]/70 mt-1">
            {currentTurn.koreanMeaning}
          </p>

          {/* Audio Controls */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={handlePlayNormal}
              disabled={isListening}
              className={`h-11 rounded-2xl flex items-center justify-center gap-2 font-heading font-bold text-xs transition-all duration-200 border cursor-pointer ${
                activeSpeechSpeed === 'normal'
                  ? 'bg-[#A9D5F5] border-[#8bc6ef] text-[#25364A] shadow-inner'
                  : 'bg-slate-50 border-slate-200 text-[#25364A] hover:bg-slate-100 hover:border-slate-300'
              } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Volume2 className={`w-4 h-4 ${activeSpeechSpeed === 'normal' ? 'animate-bounce text-[#FF806B]' : ''}`} />
              <span>Listen (0.9x)</span>
            </button>

            <button
              onClick={handlePlaySlow}
              disabled={isListening}
              className={`h-11 rounded-2xl flex items-center justify-center gap-2 font-heading font-bold text-xs transition-all duration-200 border cursor-pointer ${
                activeSpeechSpeed === 'slow'
                  ? 'bg-[#A9D5F5] border-[#8bc6ef] text-[#25364A] shadow-inner'
                  : 'bg-slate-50 border-slate-200 text-[#25364A] hover:bg-slate-100 hover:border-slate-300'
              } ${isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Volume2 className={`w-4 h-4 ${activeSpeechSpeed === 'slow' ? 'animate-bounce text-[#FF806B]' : ''}`} />
              <span>Slow (0.7x)</span>
            </button>
          </div>
        </section>

        {/* Speaking & Microphone Section */}
        <section className="flex flex-col items-center my-1">
          <div className="relative flex items-center justify-center">
            {/* Animated sound-wave pulse rings */}
            {isListening && (
              <>
                <div className="absolute w-24 h-24 rounded-full bg-[#FF806B]/30 animate-pulse-ring-1 pointer-events-none" />
                <div className="absolute w-24 h-24 rounded-full bg-[#FF806B]/20 animate-pulse-ring-2 pointer-events-none" />
                <div className="absolute w-24 h-24 rounded-full bg-[#FF806B]/10 animate-pulse-ring-3 pointer-events-none" />
              </>
            )}

            <button
              onClick={handleStartListening}
              disabled={isSpeakingModel}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
                isSpeakingModel
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : isListening
                  ? 'bg-[#FF6B52] text-white shadow-[#FF806B]/50 scale-105 ring-4 ring-[#FF806B]/40'
                  : isTurnCompleted
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600'
                  : 'bg-gradient-to-tr from-[#FF806B] to-[#ff9785] text-white shadow-[#FF806B]/35 hover:scale-105 active:scale-95'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Tap to speak'}
            >
              {isListening ? (
                <>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-heading font-extrabold tracking-tight">Listening...</span>
                </>
              ) : isTurnCompleted ? (
                <>
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5] mb-0.5" />
                  <span className="text-[11px] font-heading font-extrabold">Done</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 stroke-[2.3] mb-0.5" />
                  <span className="text-[10px] font-heading font-extrabold tracking-tight">Tap to Speak</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-500 mt-2.5">
            {isListening ? (
              <span className="text-[#FF806B] font-bold animate-pulse">
                말씀해 주세요... (1.5초 멈추면 자동 인식됩니다)
              </span>
            ) : isSpeakingModel ? (
              <span className="text-slate-400">오디오 재생 중에는 마이크가 잠시 비활성화됩니다.</span>
            ) : isTurnCompleted ? (
              <span className="text-emerald-600 font-bold">성공했어요! 다음 질문으로 넘어가 볼까요?</span>
            ) : (
              <span>마이크를 누르고 영어로 말해 보세요.</span>
            )}
          </p>
        </section>

        {/* Speech Recognition Output Area */}
        {spokenText && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Recognized Speech (내가 말한 내용)
            </span>
            <p className="font-heading font-bold text-base text-[#25364A] leading-snug">
              &ldquo;{spokenText}&rdquo;
            </p>
          </div>
        )}

        {/* Lucy Feedback Box */}
        {isLoadingFeedback && (
          <div className="bg-[#A9D5F5]/25 border border-[#A9D5F5]/60 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#25364A] animate-pulse">
            <Sparkles className="w-4 h-4 text-[#FF806B] animate-spin" />
            <span>Lucy가 답변을 확인하고 있어요...</span>
          </div>
        )}

        {feedback && !isLoadingFeedback && (
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all duration-200 ${
              feedback.isSuccess
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-xs'
                : feedback.feedbackType === 'silence'
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs'
            }`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white shadow-xs bg-[#A9D5F5]/40 mt-0.5">
              <img
                src={
                  feedback.isSuccess
                    ? '/src/assets/images/lucy_celebrating_1792578552114.jpg'
                    : '/src/assets/images/lucy_assistant_avatar_1792578551775.jpg'
                }
                alt="Lucy"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-heading font-extrabold text-[11px] text-[#FF806B]">
                  Lucy&apos;s Feedback
                </span>
                {feedback.feedbackType === 'recast' && (
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md font-medium">
                    1st Try · Recast
                  </span>
                )}
                {feedback.feedbackType === 'elicitation' && (
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md font-medium">
                    2nd Try · First-Letter Hint
                  </span>
                )}
                {feedback.feedbackType === 'chunking' && (
                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md font-medium">
                    3rd Try · Small Parts
                  </span>
                )}
              </div>

              <p className="font-heading font-bold text-sm leading-snug">
                {feedback.english}
              </p>
              <p className="font-korean text-xs mt-0.5 opacity-80 leading-relaxed">
                {feedback.korean}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Buttons */}
      <footer className="pt-2">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleTryAgain}
            disabled={isListening}
            className="h-12 bg-white border border-slate-200/90 text-[#25364A] hover:bg-slate-50 font-heading font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            onClick={handleSkip}
            disabled={isListening}
            className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-heading font-bold text-xs rounded-2xl flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>

          <button
            onClick={handleGoNext}
            disabled={isListening}
            className={`h-12 font-heading font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
              isTurnCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                : 'bg-gradient-to-r from-[#FF806B] to-[#FF6B52] text-white shadow-[#FF806B]/25 hover:from-[#ff755e] hover:to-[#f85c41]'
            }`}
          >
            <span>{currentStepIndex === turns.length - 1 ? 'Finish!' : 'Next'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.3]" />
          </button>
        </div>
      </footer>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-[#25364A] mb-1">
              연습을 중단하시겠어요?
            </h3>
            <p className="font-korean text-xs text-slate-500 mb-5 leading-relaxed">
              지금 나가시면 현재까지의 쇼핑 대화 진행 상황이 초기화됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-heading font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                계속 연습하기
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onBackToHome();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-heading font-bold text-xs hover:bg-rose-600 cursor-pointer shadow-xs"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
