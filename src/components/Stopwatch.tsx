"use client";

import { useState } from "react";

interface StopwatchProps {
  isRunning: boolean;
  elapsedTime: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  error?: string | null;
  onClearError?: () => void;
}

/**
 * Stopwatch component with mobile-optimized UI
 * Features large touch-friendly buttons and real-time display
 * Includes error handling and user feedback
 */
export function Stopwatch({
  isRunning,
  elapsedTime,
  onStart,
  onStop,
  onReset,
  error,
  onClearError,
}: StopwatchProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  /**
   * Format elapsed time in MM:SS format
   * @param milliseconds - Time in milliseconds
   * @returns Formatted time string
   */
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleButtonClick = () => {
    if (isRunning) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    onReset();
    setShowResetConfirm(false);
    setResetSuccess(true);
    // Clear success message after 3 seconds
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className="w-full bg-white border-b-2 border-gray-200 p-2 sm:p-6 shadow-sm">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                type="button"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Display */}
      {resetSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <p className="text-sm text-green-700">
              Timer and all data successfully reset!
            </p>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center">
            <div className="text-yellow-600 text-2xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Reset Timer?
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              This will clear the timer and all runner data. This action cannot
              be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleResetCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                type="button"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-2 sm:mb-6">
        <div className="text-2xl sm:text-6xl font-mono font-bold text-gray-800 mb-1 sm:mb-2 leading-tight">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-base sm:text-lg text-gray-600">
          {isRunning ? "Running" : "Stopped"}
        </div>
      </div>

      {/* Start/Stop and Reset Buttons */}
      <div className="flex justify-center items-center space-x-3">
        <button
          onClick={handleButtonClick}
          className={`
            px-6 py-3 sm:px-8 sm:py-4 rounded-lg text-base sm:text-xl font-bold text-white
            transition-all duration-200 ease-in-out
            active:scale-95 focus:outline-none focus:ring-4
            touch-target min-w-[80px] sm:min-w-[120px]
            ${
              error
                ? "bg-gray-400 cursor-not-allowed"
                : isRunning
                ? "bg-red-500 hover:bg-red-600 focus:ring-red-300 shadow-lg shadow-red-200"
                : "bg-green-500 hover:bg-green-600 focus:ring-green-300 shadow-lg shadow-green-200"
            }
          `}
          type="button"
          aria-label={isRunning ? "Stop timer" : "Start timer"}
          disabled={!!error}
        >
          {isRunning ? "STOP" : "START"}
        </button>

        {/* Reset Button */}
        <button
          onClick={handleResetClick}
          className="
            px-4 py-3 sm:px-6 sm:py-4 rounded-lg text-sm sm:text-base font-bold text-white
            bg-gray-500 hover:bg-gray-600 focus:ring-gray-300 shadow-lg shadow-gray-200
            transition-all duration-200 ease-in-out
            active:scale-95 focus:outline-none focus:ring-4
            touch-target min-w-[60px] sm:min-w-[80px]
          "
          type="button"
          aria-label="Reset timer and clear all data"
          disabled={!!error || showResetConfirm}
        >
          RESET
        </button>
      </div>
    </div>
  );
}
