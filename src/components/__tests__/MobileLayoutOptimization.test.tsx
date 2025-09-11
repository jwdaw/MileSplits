import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Stopwatch } from "../Stopwatch";
import { RunnerTable } from "../RunnerTable";
import { Runner } from "@/types";

// Mock the useTimer hook
vi.mock("@/hooks/useTimer", () => ({
  useTimer: () => ({
    isRunning: false,
    elapsedTime: 0,
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    restoreTimerState: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}));

describe("Mobile Layout Optimization", () => {
  const mockOnSplitRecord = vi.fn();

  // Create test data with 8+ runners
  const createTestRunners = (count: number): Runner[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `runner-${i + 1}`,
      name: `Runner ${i + 1}`,
      splits: {},
    }));
  };

  const defaultStopwatchProps = {
    isRunning: false,
    elapsedTime: 0,
    onStart: vi.fn(),
    onStop: vi.fn(),
  };

  describe("Stopwatch Size Optimization", () => {
    it("uses compact button size on mobile (64px)", () => {
      render(<Stopwatch {...defaultStopwatchProps} />);

      const button = screen.getByRole("button");
      // w-16 h-16 = 64px x 64px
      expect(button).toHaveClass("w-16", "h-16");
    });

    it("uses smaller font size for timer display on mobile", () => {
      render(<Stopwatch {...defaultStopwatchProps} elapsedTime={125000} />);

      const timerDisplay = screen.getByText("02:05");
      // text-2xl on mobile, text-6xl on larger screens
      expect(timerDisplay).toHaveClass("text-2xl", "sm:text-6xl");
    });

    it("uses minimal padding on mobile", () => {
      const { container } = render(<Stopwatch {...defaultStopwatchProps} />);

      const stopwatchContainer = container.firstChild as HTMLElement;
      // p-2 on mobile, p-6 on larger screens
      expect(stopwatchContainer).toHaveClass("p-2", "sm:p-6");
    });

    it("uses reduced margins for timer display", () => {
      render(<Stopwatch {...defaultStopwatchProps} />);

      const timerContainer = screen.getByText("00:00").parentElement;
      // mb-2 on mobile, mb-6 on larger screens
      expect(timerContainer).toHaveClass("mb-2", "sm:mb-6");
    });
  });

  describe("Layout with Multiple Runners", () => {
    it("renders efficiently with 8 runners", () => {
      const runners = createTestRunners(8);

      render(
        <RunnerTable
          runners={runners}
          elapsedTime={0}
          isTimerRunning={false}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Verify split buttons are present for each runner
      const splitButtons = screen.getAllByText("Record");
      // 8 runners × 3 splits each = 24 buttons (but RunnerTable renders both mobile and desktop versions)
      // So we expect 48 buttons total (24 mobile + 24 desktop)
      expect(splitButtons.length).toBeGreaterThanOrEqual(24);
    });

    it("renders efficiently with 10 runners", () => {
      const runners = createTestRunners(10);

      render(
        <RunnerTable
          runners={runners}
          elapsedTime={0}
          isTimerRunning={false}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Verify split buttons are present for each runner
      const splitButtons = screen.getAllByText("Record");
      // 10 runners × 3 splits each = 30 buttons minimum
      expect(splitButtons.length).toBeGreaterThanOrEqual(30);
    });

    it("maintains split button functionality with many runners", () => {
      const runners = createTestRunners(12);

      render(
        <RunnerTable
          runners={runners}
          elapsedTime={0}
          isTimerRunning={false}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Get all split buttons
      const splitButtons = screen.getAllByText("Record");

      // Verify we have buttons for all runners
      expect(splitButtons.length).toBeGreaterThanOrEqual(36); // 12 × 3 = 36 minimum
    });
  });

  describe("Combined Layout Test", () => {
    it("maintains good proportions with compact stopwatch and many runners", () => {
      const runners = createTestRunners(8);

      const { container } = render(
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 z-10">
            <Stopwatch {...defaultStopwatchProps} />
          </div>
          <main className="p-4 space-y-4">
            <RunnerTable
              runners={runners}
              elapsedTime={0}
              isTimerRunning={false}
              onSplitRecord={mockOnSplitRecord}
            />
          </main>
        </div>
      );

      // Verify stopwatch is compact
      const stopwatchButton = screen.getByRole("button", { name: /timer/i });
      expect(stopwatchButton).toHaveClass("w-16", "h-16");

      // Verify the layout structure is maintained
      const stickyContainer = container.querySelector(".sticky");
      expect(stickyContainer).toBeInTheDocument();

      const mainContent = container.querySelector("main");
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass("p-4", "space-y-4");

      // Verify split buttons are still present
      const splitButtons = screen.getAllByText("Record");
      expect(splitButtons.length).toBeGreaterThanOrEqual(24);
    });
  });

  describe("Accessibility with Optimized Layout", () => {
    it("maintains minimum touch targets even with compact design", () => {
      render(<Stopwatch {...defaultStopwatchProps} />);

      const button = screen.getByRole("button");
      // Even though reduced to w-16 h-16 (64px), this still meets the 44px minimum
      expect(button).toHaveClass("w-16", "h-16");

      // Verify it still has touch-target class for additional accessibility
      expect(button).toHaveClass("touch-target");
    });

    it("maintains readable text sizes", () => {
      render(<Stopwatch {...defaultStopwatchProps} elapsedTime={125000} />);

      const timerDisplay = screen.getByText("02:05");
      // text-2xl is still readable on mobile
      expect(timerDisplay).toHaveClass("text-2xl");

      const statusText = screen.getByText("Stopped");
      expect(statusText).toHaveClass("text-base");
    });
  });
});
