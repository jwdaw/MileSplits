"use client";

import { useState, useEffect } from "react";
import { SplitType } from "@/types";

export interface SplitButtonProps {
  runnerId: string;
  splitType: SplitType;
  splitTime?: number;
  elapsedTime: number;
  isTimerRunning: boolean;
  onSplitRecord: (runnerId: string, splitType: SplitType, time: number) => void;
}

/**
 * SplitButton component for recording individual mile splits
 * Features large touch targets and clear visual feedback for mobile use
 * Includes success feedback and error handling
 */
export function SplitButton({
  runnerId,
  splitType,
  splitTime,
  elapsedTime,
  isTimerRunning,
  onSplitRecord,
}: SplitButtonProps) {
  const [justRecorded, setJustRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  /**
   * Format time in MM:SS format
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

  /**
   * Calculate and record split time based on current elapsed time
   * Includes error handling and success feedback
   */
  const handleSplitRecord = async () => {
    if (!isTimerRunning) {
      setError("Timer must be running to record splits");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (splitTime !== undefined) {
      setError("Split already recorded");
      setTimeout(() => setError(null), 2000);
      return;
    }

    if (elapsedTime <= 0) {
      setError("Invalid time - please wait for timer to start");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      onSplitRecord(runnerId, splitType, elapsedTime);

      // Show success feedback
      setJustRecorded(true);
      setTimeout(() => setJustRecorded(false), 2000);
    } catch (err) {
      setError("Failed to record split. Please try again.");
      console.error("Split recording error:", err);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear error when split time changes (successful recording)
  useEffect(() => {
    if (splitTime !== undefined && error) {
      setError(null);
    }
  }, [splitTime, error]);

  /**
   * Get mile number for display
   */
  const getMileNumber = (): string => {
    switch (splitType) {
      case "mile1":
        return "1";
      case "mile2":
        return "2";
      case "mile3":
        return "3";
      default:
        return "?";
    }
  };

  // Determine button state
  const isRecorded = splitTime !== undefined;
  const isDisabled = !isTimerRunning || isRecorded || isProcessing;

  // Button styling based on state
  const getButtonClasses = (): string => {
    const baseClasses = `
      min-h-[48px] min-w-[48px] px-3 py-2 rounded-lg font-semibold text-sm
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-1
      active:scale-95 touch-target
      w-full flex flex-col items-center justify-center
      relative
    `;

    if (isProcessing) {
      // Processing state
      return `${baseClasses}
        bg-yellow-100 text-yellow-800 border-2 border-yellow-300
        cursor-wait
      `;
    }

    if (isRecorded) {
      // Recorded state - show the split time with success animation
      const successAnimation = justRecorded
        ? "animate-pulse bg-green-200"
        : "bg-green-100";
      return `${baseClasses}
        ${successAnimation} text-green-800 border-2 border-green-300
        cursor-default
      `;
    }

    if (!isTimerRunning) {
      // Disabled state - timer not running
      return `${baseClasses}
        bg-gray-100 text-gray-400 border-2 border-gray-200
        cursor-not-allowed
      `;
    }

    if (error) {
      // Error state
      return `${baseClasses}
        bg-red-100 text-red-800 border-2 border-red-300
        cursor-pointer
      `;
    }

    // Active state - ready to record
    return `${baseClasses}
      bg-blue-500 text-white border-2 border-blue-500
      hover:bg-blue-600 hover:border-blue-600
      focus:ring-blue-300
      shadow-sm hover:shadow-md
      cursor-pointer
    `;
  };

  return (
    <div className="relative">
      <button
        onClick={handleSplitRecord}
        disabled={isDisabled}
        className={getButtonClasses()}
        type="button"
        aria-label={
          isRecorded
            ? `Mile ${getMileNumber()} split recorded: ${formatTime(
                splitTime!
              )}`
            : `Record mile ${getMileNumber()} split`
        }
      >
        <div className="text-center">
          <div className="text-xs font-medium mb-1">Mile {getMileNumber()}</div>
          <div className="font-mono">
            {isProcessing ? (
              <span className="animate-spin">⏳</span>
            ) : isRecorded ? (
              formatTime(splitTime!)
            ) : error ? (
              "Error"
            ) : (
              "Record"
            )}
          </div>
          {justRecorded && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          )}
        </div>
      </button>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 text-center z-10">
          {error}
        </div>
      )}
    </div>
  );
}
