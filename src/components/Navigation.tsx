import React from 'react';
import { Home, ShoppingBag, BookMarked, Award } from 'lucide-react';

export type TabKey = 'home' | 'practice' | 'expressions' | 'progress';

interface NavigationProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { key: 'home' as TabKey, label: 'Home', labelKo: '홈', icon: Home },
    { key: 'practice' as TabKey, label: 'Practice', labelKo: '쇼핑 연습', icon: ShoppingBag },
    { key: 'expressions' as TabKey, label: 'My Expressions', labelKo: '내 표현', icon: BookMarked },
    { key: 'progress' as TabKey, label: 'Progress', labelKo: '학습 현황', icon: Award },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shadow-slate-900/5 safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all duration-150 cursor-pointer ${
                isActive ? 'text-[#FF806B]' : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label={tab.label}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
                  isActive ? 'bg-[#FF806B]/15 scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#FF806B]" />
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-heading ${
                  isActive ? 'font-black text-[#FF806B]' : 'font-semibold text-slate-500'
                }`}
              >
                {tab.labelKo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
