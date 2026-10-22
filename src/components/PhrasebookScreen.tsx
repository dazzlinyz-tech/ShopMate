import React, { useState, useMemo } from 'react';
import {
  Search,
  Bookmark,
  Volume2,
  Filter,
  CheckCircle2,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';
import { ExpressionItem, UserProgress } from '../types/dialogue';
import { EXPRESSIONS_CATALOG, PHRASEBOOK_CATEGORIES } from '../data/scenarios';
import { SpeechSynthesisManager } from '../services/speechService';
import { StorageService } from '../services/storageService';
import { sounds } from '../services/soundEffects';

interface PhrasebookScreenProps {
  userProgress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
}

export const PhrasebookScreen: React.FC<PhrasebookScreenProps> = ({
  userProgress,
  onUpdateProgress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyLearned, setOnlyLearned] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const bookmarkedSet = useMemo(
    () => new Set(userProgress.bookmarkedExpressionIds),
    [userProgress.bookmarkedExpressionIds]
  );

  const learnedSet = useMemo(
    () => new Set(userProgress.learnedExpressionIds),
    [userProgress.learnedExpressionIds]
  );

  // Filtered expressions
  const filteredExpressions = useMemo(() => {
    return EXPRESSIONS_CATALOG.filter((item) => {
      // Search query (English or Korean)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesEn = item.english.toLowerCase().includes(query);
        const matchesKo = item.korean.includes(query);
        const matchesCategory = item.categoryKo.includes(query) || item.category.toLowerCase().includes(query);
        if (!matchesEn && !matchesKo && !matchesCategory) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && item.level !== selectedLevel) {
        return false;
      }

      // Favorites filter
      if (onlyFavorites && !bookmarkedSet.has(item.id)) {
        return false;
      }

      // Learned filter
      if (onlyLearned && !learnedSet.has(item.id)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedLevel, onlyFavorites, onlyLearned, bookmarkedSet, learnedSet]);

  const handlePlay = (id: string, text: string) => {
    sounds.playTap();
    SpeechSynthesisManager.stop();
    setPlayingId(id);
    SpeechSynthesisManager.play(
      text,
      0.9,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  };

  const handleToggleBookmark = (id: string) => {
    sounds.playTap();
    StorageService.toggleBookmark(id);
    onUpdateProgress(StorageService.getProgress());
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-extrabold text-2xl text-[#25364A] tracking-tight">
              My Expressions
            </h1>
            <p className="font-korean text-xs text-[#25364A]/70 mt-0.5">
              내 표현 모음 · {learnedSet.size}개 학습 완료 / 총 {EXPRESSIONS_CATALOG.length}개
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FF806B]/15 border border-[#FF806B]/30 flex items-center justify-center text-[#FF806B]">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="영어 또는 한국어로 표현 검색..."
          className="w-full h-11 pl-10 pr-9 bg-white border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF806B]/40 focus:border-[#FF806B] shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Badges (Favorites, Learned, Level) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
        {/* Favorites Filter */}
        <button
          onClick={() => {
            sounds.playTap();
            setOnlyFavorites((prev) => !prev);
          }}
          className={`h-8 px-3 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            onlyFavorites
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>즐겨찾기 ({bookmarkedSet.size})</span>
        </button>

        {/* Learned Only Filter */}
        <button
          onClick={() => {
            sounds.playTap();
            setOnlyLearned((prev) => !prev);
          }}
          className={`h-8 px-3 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            onlyLearned
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>학습 완료만 ({learnedSet.size})</span>
        </button>

        {/* Level Filters */}
        {([1, 2, 3] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => {
              sounds.playTap();
              setSelectedLevel((prev) => (prev === lvl ? 'all' : lvl));
            }}
            className={`h-8 px-2.5 rounded-xl text-xs font-heading font-bold shrink-0 transition-all cursor-pointer ${
              selectedLevel === lvl
                ? 'bg-[#25364A] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            L{lvl}
          </button>
        ))}
      </div>

      {/* Category Pills Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {PHRASEBOOK_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playTap();
                setSelectedCategory(cat.id);
              }}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-korean font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FF806B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.labelKo}
            </button>
          );
        })}
      </div>

      {/* Expression Cards List */}
      {filteredExpressions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-base text-[#25364A] mb-1">
            해당하는 표현이 없습니다
          </h3>
          <p className="font-korean text-xs text-slate-500 leading-relaxed mb-4">
            {onlyFavorites
              ? '아직 즐겨찾기에 등록된 표현이 없습니다. 표현 카드의 북마크 아이콘을 눌러 저장해 보세요!'
              : onlyLearned
              ? '아직 완료된 시나리오가 없습니다. 쇼핑 연습에서 시나리오를 완료하면 표현이 자동으로 추가됩니다!'
              : '다른 검색어나 카테고리 필터를 선택해 보세요.'}
          </p>
          {(onlyFavorites || onlyLearned || searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
                setOnlyFavorites(false);
                setOnlyLearned(false);
              }}
              className="px-4 py-2 bg-[#FF806B] text-white font-heading font-bold text-xs rounded-xl shadow-xs"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpressions.map((item) => {
            const isBookmarked = bookmarkedSet.has(item.id);
            const isLearned = learnedSet.has(item.id);
            const isPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Meta Row: Category, Level & Bookmark */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black bg-[#A9D5F5]/40 text-[#25364A] px-2 py-0.5 rounded-md">
                      Level {item.level}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.categoryKo}
                    </span>
                    {isLearned && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        학습완료
                      </span>
                    )}
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                    aria-label="Bookmark expression"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isBookmarked ? 'fill-amber-400 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Target Expression */}
                <div className="flex items-start justify-between gap-3 my-1">
                  <div className="flex-1">
                    <h3 className="font-heading font-black text-lg text-[#25364A] leading-snug">
                      {item.english}
                    </h3>
                    <p className="font-korean text-xs font-semibold text-[#25364A]/70 mt-0.5">
                      {item.korean}
                    </p>
                  </div>

                  {/* Audio Speaker Button */}
                  <button
                    onClick={() => handlePlay(item.id, item.english)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-[#FF806B] border-[#FF806B] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-[#25364A] hover:bg-slate-100'
                    }`}
                    aria-label="Listen to pronunciation"
                  >
                    <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
                  </button>
                </div>

                {/* Dialogue Context Snippet */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 px-4 py-2.5 rounded-b-3xl">
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-heading font-extrabold text-[#FF806B]">Lucy: </span>
                    <span className="text-slate-600">&ldquo;{item.exampleDialogue.lucy}&rdquo;</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-korean ml-7 leading-tight">
                    ({item.exampleDialogue.lucyKo})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
