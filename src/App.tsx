/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { PracticeListScreen } from './components/PracticeListScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ResultScreen } from './components/ResultScreen';
import { PhrasebookScreen } from './components/PhrasebookScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { Navigation, TabKey } from './components/Navigation';
import { ShoppingScenario, TurnProgress, UserProgress } from './types/dialogue';
import { ALL_SCENARIOS, SCENARIOS_BY_LEVEL } from './data/scenarios';
import { StorageService } from './services/storageService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [userProgress, setUserProgress] = useState<UserProgress>(() => StorageService.getProgress());

  // Practice state
  const [activeScenario, setActiveScenario] = useState<ShoppingScenario | null>(null);
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [lastFinishedScenario, setLastFinishedScenario] = useState<ShoppingScenario | null>(null);
  const [lastTurnProgress, setLastTurnProgress] = useState<Record<number, TurnProgress>>({});
  const [isViewingResult, setIsViewingResult] = useState<boolean>(false);

  // Sync progress
  const refreshProgress = () => {
    setUserProgress(StorageService.getProgress());
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  // Launch a specific scenario
  const handleLaunchScenario = (scenario: ShoppingScenario) => {
    setActiveScenario(scenario);
    setIsPracticing(true);
    setIsViewingResult(false);
  };

  // Launch practice for a whole level
  const handleStartLevelPractice = (level: 1 | 2 | 3) => {
    const scenarios = SCENARIOS_BY_LEVEL[level];
    // Find first uncompleted scenario, or the first one
    const uncompleted = scenarios.find((s) => !userProgress.completedScenarioIds.includes(s.id));
    const target = uncompleted || scenarios[0];
    handleLaunchScenario(target);
  };

  // When student finishes all turns in a scenario
  const handleFinishPractice = (
    scenario: ShoppingScenario,
    progress: Record<number, TurnProgress>
  ) => {
    setLastFinishedScenario(scenario);
    setLastTurnProgress(progress);
    setIsPracticing(false);
    setIsViewingResult(true);
    refreshProgress();
  };

  // Retry same scenario
  const handlePracticeAgain = () => {
    if (lastFinishedScenario) {
      setActiveScenario(lastFinishedScenario);
      setIsPracticing(true);
      setIsViewingResult(false);
    }
  };

  // Move to next scenario
  const handleNextScenario = (next: ShoppingScenario) => {
    setActiveScenario(next);
    setIsPracticing(true);
    setIsViewingResult(false);
  };

  // Close practice / results
  const handleExitPractice = () => {
    setIsPracticing(false);
    setIsViewingResult(false);
    setActiveScenario(null);
    refreshProgress();
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#25364A] selection:bg-[#FF806B]/20">
      {/* Active Practice Screen (Full Focus) */}
      {isPracticing && activeScenario && (
        <PracticeScreen
          scenario={activeScenario}
          onFinish={handleFinishPractice}
          onBackToHome={handleExitPractice}
        />
      )}

      {/* Active Result Screen */}
      {!isPracticing && isViewingResult && lastFinishedScenario && (
        <ResultScreen
          scenario={lastFinishedScenario}
          progressMap={lastTurnProgress}
          onPracticeAgain={handlePracticeAgain}
          onNextScenario={handleNextScenario}
          onBackToPractice={() => {
            setIsViewingResult(false);
            setCurrentTab('practice');
          }}
          onViewInPhrasebook={() => {
            setIsViewingResult(false);
            setCurrentTab('expressions');
          }}
        />
      )}

      {/* Main App Navigation Tabs */}
      {!isPracticing && !isViewingResult && (
        <>
          {currentTab === 'home' && (
            <StartScreen
              userProgress={userProgress}
              onStart={() => setCurrentTab('practice')}
              onGoToExpressions={() => setCurrentTab('expressions')}
              onGoToProgress={() => setCurrentTab('progress')}
              onResumeScenario={handleLaunchScenario}
            />
          )}

          {currentTab === 'practice' && (
            <PracticeListScreen
              userProgress={userProgress}
              onSelectScenario={handleLaunchScenario}
              onStartLevelPractice={handleStartLevelPractice}
            />
          )}

          {currentTab === 'expressions' && (
            <PhrasebookScreen
              userProgress={userProgress}
              onUpdateProgress={setUserProgress}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressScreen
              userProgress={userProgress}
              onSelectScenario={handleLaunchScenario}
              onGoToPractice={() => setCurrentTab('practice')}
            />
          )}

          {/* Persistent Bottom Tab Bar */}
          <Navigation
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        </>
      )}
    </div>
  );
}
