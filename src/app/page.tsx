"use client";

import { Suspense } from "react";
import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Stopwatch } from "@/components/Stopwatch";
import { RunnerTable } from "@/components/RunnerTable";
import AddRunner from "@/components/AddRunner";
import { ExportButton } from "@/components/ExportButton";
import { useTimer } from "@/hooks/useTimer";
import { Runner, SplitType } from "@/types";
import { getRosterById } from "@/utils/rosterStorage";
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  isSessionRecent,
} from "@/utils/localStorage";

function HomeContent() {
  const searchParams = useSearchParams();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [rosterLoadError, setRosterLoadError] = useState<string | null>(null);
  const {
    isRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    restoreTimerState,
    error,
    clearError,
  } = useTimer();

  // Handle adding a new runner
  const handleAddRunner = useCallback((newRunner: Runner) => {
    setRunners((prevRunners) => [...prevRunners, newRunner]);
  }, []);

  // Handle loading roster from URL parameter
  const loadRosterFromUrl = useCallback(() => {
    const rosterId = searchParams.get("roster");
    if (!rosterId) return;

    try {
      const roster = getRosterById(rosterId);
      if (roster) {
        // Convert roster runner names to Runner objects
        const rosterRunners: Runner[] = roster.runners.map((name, index) => ({
          id: `roster-runner-${Date.now()}-${index}`,
          name: name,
          splits: {},
        }));

        setRunners(rosterRunners);
        console.log(
          `Loaded roster "${roster.name}" with ${roster.runners.length} runners`
        );
      } else {
        setRosterLoadError(`Roster not found`);
        setTimeout(() => setRosterLoadError(null), 5000);
      }
    } catch (error) {
      console.error("Failed to load roster:", error);
      setRosterLoadError("Failed to load roster");
      setTimeout(() => setRosterLoadError(null), 5000);
    }
  }, [searchParams]);

  // Handle recording a split for a runner with error handling
  const handleSplitRecord = useCallback(
    (runnerId: string, splitType: SplitType, time: number) => {
      try {
        setRunners((prevRunners) =>
          prevRunners.map((runner) =>
            runner.id === runnerId
              ? {
                  ...runner,
                  splits: {
                    ...runner.splits,
                    [splitType]: time,
                  },
                }
              : runner
          )
        );
      } catch (err) {
        console.error("Failed to record split:", err);
        throw new Error("Failed to record split");
      }
    },
    []
  );

  // Handle resetting all data
  const handleReset = useCallback(() => {
    try {
      // Clear all runners
      setRunners([]);

      // Reset timer state
      resetTimer();

      // Clear localStorage session data
      clearSessionState();

      console.log("All data successfully reset");
    } catch (err) {
      console.error("Failed to reset data:", err);
      throw new Error("Failed to reset data");
    }
  }, [resetTimer]);

  // Restore session from localStorage on component mount
  useEffect(() => {
    // Check if we should load a roster from URL first
    const rosterId = searchParams.get("roster");

    if (rosterId) {
      // Load roster instead of session
      loadRosterFromUrl();
      setIsSessionRestored(true);
    } else {
      // Normal session restoration
      const savedSession = loadSessionState();

      if (savedSession && isSessionRecent(savedSession)) {
        // Restore runners
        setRunners(savedSession.runners);

        // Restore timer state
        restoreTimerState(savedSession.timerState);

        console.log("Session restored from localStorage");
      } else if (savedSession && !isSessionRecent(savedSession)) {
        // Clear old session data
        clearSessionState();
        console.log("Old session data cleared");
      }

      setIsSessionRestored(true);
    }
  }, [restoreTimerState, loadRosterFromUrl, searchParams]);

  // Auto-save session state when runners or timer state changes
  useEffect(() => {
    // Don't save until we've had a chance to restore the session
    if (!isSessionRestored) {
      return;
    }

    // Only save if there are runners or the timer has been used
    if (runners.length > 0 || elapsedTime > 0) {
      const timerState = {
        isRunning,
        elapsedTime,
        startTime: isRunning ? Date.now() - elapsedTime : null,
      };

      const saveSuccess = saveSessionState(runners, timerState);
      if (!saveSuccess) {
        console.warn(
          "Failed to save session state - data may be lost on page refresh"
        );
      }
    }
  }, [runners, isRunning, elapsedTime, isSessionRestored]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 safe-area-left safe-area-right">
      {/* Stopwatch at top of screen for mobile prominence */}
      <div className="sticky top-0 z-10 safe-area-top">
        <Stopwatch
          isRunning={isRunning}
          elapsedTime={elapsedTime}
          onStart={startTimer}
          onStop={stopTimer}
          onReset={handleReset}
          error={error}
          onClearError={clearError}
        />
      </div>

      {/* Main content area */}
      <main className="p-4 space-y-4 pb-8 safe-area-bottom">
        {/* Navigation Header */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Cross Country Timer
              </h1>
              <p className="text-sm text-gray-600">
                Track runner splits during races
              </p>
            </div>
            <Link
              href="/roster"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Manage Rosters
            </Link>
          </div>
        </div>

        {/* Roster Load Error */}
        {rosterLoadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <p className="text-sm text-red-700">{rosterLoadError}</p>
            </div>
          </div>
        )}

        {/* Add Runner Component */}
        <AddRunner runners={runners} onAddRunner={handleAddRunner} />

        {/* Runner Table */}
        <RunnerTable
          runners={runners}
          elapsedTime={elapsedTime}
          isTimerRunning={isRunning}
          onSplitRecord={handleSplitRecord}
        />

        {/* Export Button */}
        <ExportButton
          runners={runners}
          elapsedTime={elapsedTime}
          isTimerRunning={isRunning}
        />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
