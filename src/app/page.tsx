"use client";

import { useState, useCallback, useEffect } from "react";
import { Stopwatch } from "@/components/Stopwatch";
import { RunnerTable } from "@/components/RunnerTable";
import AddRunner from "@/components/AddRunner";
import { useTimer } from "@/hooks/useTimer";
import { Runner, SplitType } from "@/types";
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  isSessionRecent,
} from "@/utils/localStorage";

export default function Home() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const {
    isRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    restoreTimerState,
    error,
    clearError,
  } = useTimer();

  // Handle adding a new runner
  const handleAddRunner = useCallback((newRunner: Runner) => {
    setRunners((prevRunners) => [...prevRunners, newRunner]);
  }, []);

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

  // Restore session from localStorage on component mount
  useEffect(() => {
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
  }, [restoreTimerState]);

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
          error={error}
          onClearError={clearError}
        />
      </div>

      {/* Main content area */}
      <main className="p-4 space-y-4 pb-8 safe-area-bottom">
        {/* Add Runner Component */}
        <AddRunner runners={runners} onAddRunner={handleAddRunner} />

        {/* Runner Table */}
        <RunnerTable
          runners={runners}
          elapsedTime={elapsedTime}
          isTimerRunning={isRunning}
          onSplitRecord={handleSplitRecord}
        />
      </main>
    </div>
  );
}
