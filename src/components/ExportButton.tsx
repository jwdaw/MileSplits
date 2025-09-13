"use client";

import { useState } from "react";
import { Runner } from "@/types";
import {
  exportRaceResultsToPDF,
  isPDFExportSupported,
} from "@/utils/pdfExport";

interface ExportButtonProps {
  runners: Runner[];
  elapsedTime: number;
  isTimerRunning: boolean;
}

/**
 * Export button component for generating PDF race results
 * Features mobile-optimized UI and error handling
 */
export function ExportButton({
  runners,
  elapsedTime,
  isTimerRunning,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (runners.length === 0) {
      setExportError("No runners to export");
      setTimeout(() => setExportError(null), 3000);
      return;
    }

    if (!isPDFExportSupported()) {
      setExportError("PDF export not supported in this browser");
      setTimeout(() => setExportError(null), 3000);
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for UI feedback
      exportRaceResultsToPDF(runners, elapsedTime);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportError("Failed to export PDF. Please try again.");
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = runners.length > 0;
  const hasAnySplits = runners.some(
    (runner) =>
      runner.splits.mile1 || runner.splits.mile2 || runner.splits.mile3
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {/* Success Message */}
      {exportSuccess && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <p className="text-sm text-green-700">PDF exported successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {exportError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <p className="text-sm text-red-700">{exportError}</p>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Export Results
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Generate a PDF report with race results and split times
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={!hasData || isExporting}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-sm
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2
            active:scale-95 touch-target
            ${
              !hasData || isExporting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md"
            }
          `}
          style={{ minHeight: "48px" }}
          type="button"
          aria-label="Export race results to PDF"
        >
          {isExporting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Generating PDF...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export PDF
            </div>
          )}
        </button>

        {/* Export Info */}
        <div className="text-xs text-gray-500 space-y-1">
          {hasData ? (
            <>
              <p>
                • {runners.length} runner{runners.length !== 1 ? "s" : ""} will
                be included
              </p>
              {hasAnySplits ? (
                <p>• Split times and race statistics will be included</p>
              ) : (
                <p>• No split times recorded yet</p>
              )}
              <p>
                • Race duration: {Math.floor(elapsedTime / 60000)}:
                {String(Math.floor((elapsedTime % 60000) / 1000)).padStart(
                  2,
                  "0"
                )}
              </p>
            </>
          ) : (
            <p>• Add runners to enable PDF export</p>
          )}
        </div>
      </div>
    </div>
  );
}
