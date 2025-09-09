"use client";

import { Runner, SplitType } from "@/types";
import { SplitButton } from "./SplitButton";

interface RunnerTableProps {
  runners: Runner[];
  elapsedTime: number;
  isTimerRunning: boolean;
  onSplitRecord: (runnerId: string, splitType: SplitType, time: number) => void;
}

/**
 * RunnerTable component displays all runners and their split recording buttons
 * Optimized for mobile with responsive layout and large touch targets
 */
export function RunnerTable({
  runners,
  elapsedTime,
  isTimerRunning,
  onSplitRecord,
}: RunnerTableProps) {
  if (runners.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No runners added yet</p>
          <p className="text-sm">Add runners above to start timing splits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table header - hidden on mobile, shown on larger screens */}
      <div className="hidden sm:block bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4 p-4">
          <div className="font-semibold text-gray-700">Runner</div>
          <div className="font-semibold text-gray-700 text-center">Mile 1</div>
          <div className="font-semibold text-gray-700 text-center">Mile 2</div>
          <div className="font-semibold text-gray-700 text-center">Mile 3</div>
        </div>
      </div>

      {/* Runner rows */}
      <div className="divide-y divide-gray-200">
        {runners.map((runner) => (
          <div key={runner.id} className="p-3 sm:p-4">
            {/* Mobile layout - stacked */}
            <div className="sm:hidden">
              {/* Runner name */}
              <div className="mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {runner.name}
                </h3>
              </div>

              {/* Split buttons in mobile grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile1"
                  splitTime={runner.splits.mile1}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile2"
                  splitTime={runner.splits.mile2}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile3"
                  splitTime={runner.splits.mile3}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
              </div>
            </div>

            {/* Desktop layout - table row */}
            <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4 sm:items-center">
              {/* Runner name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {runner.name}
                </h3>
              </div>

              {/* Split buttons */}
              <div className="flex justify-center">
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile1"
                  splitTime={runner.splits.mile1}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
              </div>
              <div className="flex justify-center">
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile2"
                  splitTime={runner.splits.mile2}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
              </div>
              <div className="flex justify-center">
                <SplitButton
                  runnerId={runner.id}
                  splitType="mile3"
                  splitTime={runner.splits.mile3}
                  elapsedTime={elapsedTime}
                  isTimerRunning={isTimerRunning}
                  onSplitRecord={onSplitRecord}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with runner count */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <p className="text-sm text-gray-600 text-center">
          {runners.length} runner{runners.length !== 1 ? "s" : ""} •
          {isTimerRunning ? " Timer running" : " Timer stopped"}
        </p>
      </div>
    </div>
  );
}
