"use client";

interface StopwatchProps {
  isRunning: boolean;
  elapsedTime: number;
  onStart: () => void;
  onStop: () => void;
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
  error,
  onClearError,
}: StopwatchProps) {
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

  return (
    <div className="w-full bg-white border-b-2 border-gray-200 p-4 sm:p-6 shadow-sm">
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

      {/* Timer Display */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="text-4xl sm:text-6xl font-mono font-bold text-gray-800 mb-2 leading-tight">
          {formatTime(elapsedTime)}
        </div>
        <div className="text-base sm:text-lg text-gray-600">
          {isRunning ? "Running" : "Stopped"}
        </div>
      </div>

      {/* Start/Stop Button */}
      <div className="flex justify-center">
        <button
          onClick={handleButtonClick}
          className={`
            w-28 h-28 sm:w-32 sm:h-32 rounded-full text-xl sm:text-2xl font-bold text-white
            transition-all duration-200 ease-in-out
            active:scale-95 focus:outline-none focus:ring-4
            touch-target
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
      </div>
    </div>
  );
}
