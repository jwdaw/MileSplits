import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Stopwatch } from "../Stopwatch";

describe("Stopwatch", () => {
  const mockOnStart = vi.fn();
  const mockOnStop = vi.fn();
  const mockOnReset = vi.fn();
  const mockOnClearError = vi.fn();

  const defaultProps = {
    isRunning: false,
    elapsedTime: 0,
    onStart: mockOnStart,
    onStop: mockOnStop,
    onReset: mockOnReset,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders with initial state", () => {
      render(<Stopwatch {...defaultProps} />);

      expect(screen.getByText("00:00")).toBeInTheDocument();
      expect(screen.getByText("Stopped")).toBeInTheDocument();
      expect(screen.getByText("START")).toBeInTheDocument();
    });

    it("shows running state when timer is active", () => {
      render(<Stopwatch {...defaultProps} isRunning={true} />);

      expect(screen.getByText("Running")).toBeInTheDocument();
      expect(screen.getByText("STOP")).toBeInTheDocument();
    });

    it("displays elapsed time correctly", () => {
      const elapsedTime = 125000; // 2:05
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("02:05")).toBeInTheDocument();
    });
  });

  describe("Time Formatting", () => {
    it("formats single digit minutes and seconds correctly", () => {
      const elapsedTime = 65000; // 1:05
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("01:05")).toBeInTheDocument();
    });

    it("formats double digit minutes correctly", () => {
      const elapsedTime = 725000; // 12:05
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("12:05")).toBeInTheDocument();
    });

    it("formats zero time correctly", () => {
      render(<Stopwatch {...defaultProps} elapsedTime={0} />);

      expect(screen.getByText("00:00")).toBeInTheDocument();
    });

    it("formats 59 seconds correctly", () => {
      const elapsedTime = 359000; // 5:59
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("05:59")).toBeInTheDocument();
    });

    it("handles milliseconds by truncating", () => {
      const elapsedTime = 65999; // 1:05.999 -> should display as 1:05
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("01:05")).toBeInTheDocument();
    });

    it("formats large times correctly", () => {
      const elapsedTime = 3599000; // 59:59
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("59:59")).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("calls onStart when START button is clicked", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByText("START");
      fireEvent.click(button);

      expect(mockOnStart).toHaveBeenCalledTimes(1);
      expect(mockOnStop).not.toHaveBeenCalled();
    });

    it("calls onStop when STOP button is clicked", () => {
      render(<Stopwatch {...defaultProps} isRunning={true} />);

      const button = screen.getByText("STOP");
      fireEvent.click(button);

      expect(mockOnStop).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
    });

    it("handles rapid button clicks correctly", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByText("START");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnStart).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Handling", () => {
    it("displays error message when error prop is provided", () => {
      const errorMessage = "Timer failed to start";
      render(
        <Stopwatch
          {...defaultProps}
          error={errorMessage}
          onClearError={mockOnClearError}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText("⚠️")).toBeInTheDocument();
      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });

    it("calls onClearError when dismiss button is clicked", () => {
      render(
        <Stopwatch
          {...defaultProps}
          error="Test error"
          onClearError={mockOnClearError}
        />
      );

      const dismissButton = screen.getByText("Dismiss");
      fireEvent.click(dismissButton);

      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });

    it("disables start/stop button when error is present", () => {
      render(<Stopwatch {...defaultProps} error="Test error" />);

      const button = screen.getByRole("button", { name: /start timer/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-gray-400");
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("does not call onStart when button is disabled due to error", () => {
      render(<Stopwatch {...defaultProps} error="Test error" />);

      const button = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(button);

      expect(mockOnStart).not.toHaveBeenCalled();
    });

    it("does not show dismiss button when onClearError is not provided", () => {
      render(<Stopwatch {...defaultProps} error="Test error" />);

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    });

    it("does not show error section when no error is provided", () => {
      render(<Stopwatch {...defaultProps} />);

      expect(screen.queryByText("⚠️")).not.toBeInTheDocument();
      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label for start button", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button", { name: "Start timer" });
      expect(button).toBeInTheDocument();
    });

    it("has proper aria-label for stop button", () => {
      render(<Stopwatch {...defaultProps} isRunning={true} />);

      const button = screen.getByRole("button", { name: "Stop timer" });
      expect(button).toBeInTheDocument();
    });

    it("has proper button type", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(startButton).toHaveAttribute("type", "button");
      expect(resetButton).toHaveAttribute("type", "button");
    });
  });

  describe("Visual Styling", () => {
    it("has optimized touch targets for mobile", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      expect(startButton).toHaveClass("w-16", "h-16");
    });

    it("has proper focus styles", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(startButton).toHaveClass("focus:outline-none");
      expect(startButton).toHaveClass("focus:ring-4");
      expect(resetButton).toHaveClass("focus:outline-none");
      expect(resetButton).toHaveClass("focus:ring-4");
    });

    it("has active scale animation", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(startButton).toHaveClass("active:scale-95");
      expect(resetButton).toHaveClass("active:scale-95");
    });

    it("has transition animations", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(startButton).toHaveClass("transition-all");
      expect(startButton).toHaveClass("duration-200");
      expect(startButton).toHaveClass("ease-in-out");
      expect(resetButton).toHaveClass("transition-all");
      expect(resetButton).toHaveClass("duration-200");
      expect(resetButton).toHaveClass("ease-in-out");
    });

    it("applies correct colors for start button", () => {
      render(<Stopwatch {...defaultProps} />);

      const startButton = screen.getByRole("button", { name: "Start timer" });
      expect(startButton).toHaveClass("bg-green-500");
    });

    it("applies correct colors for stop button", () => {
      render(<Stopwatch {...defaultProps} isRunning={true} />);

      const stopButton = screen.getByRole("button", { name: "Stop timer" });
      expect(stopButton).toHaveClass("bg-red-500");
    });
  });

  describe("Edge Cases", () => {
    it("handles very large elapsed times", () => {
      const elapsedTime = 3661000; // 61:01
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      expect(screen.getByText("61:01")).toBeInTheDocument();
    });

    it("handles negative elapsed time gracefully", () => {
      const elapsedTime = -1000;
      render(<Stopwatch {...defaultProps} elapsedTime={elapsedTime} />);

      // Should display negative time as formatted (the component doesn't handle negatives specially)
      expect(screen.getByText("-1:-1")).toBeInTheDocument();
    });

    it("handles null error gracefully", () => {
      render(<Stopwatch {...defaultProps} error={null} />);

      expect(screen.queryByText("⚠️")).not.toBeInTheDocument();
    });

    it("handles empty string error", () => {
      render(<Stopwatch {...defaultProps} error="" />);

      expect(screen.queryByText("⚠️")).not.toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("renders reset button", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveTextContent("RESET");
    });

    it("shows confirmation dialog when reset button is clicked", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      expect(screen.getByText("Reset Timer?")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This will clear the timer and all runner data. This action cannot be undone."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Reset All Data")).toBeInTheDocument();
    });

    it("hides confirmation dialog when cancel is clicked", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByText("Reset Timer?")).not.toBeInTheDocument();
    });

    it("calls onReset when reset is confirmed", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it("shows success message after reset is confirmed", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      expect(
        screen.getByText("Timer and all data successfully reset!")
      ).toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
    });

    it("hides confirmation dialog after reset is confirmed", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      expect(screen.queryByText("Reset Timer?")).not.toBeInTheDocument();
    });

    it("disables reset button when error is present", () => {
      render(<Stopwatch {...defaultProps} error="Test error" />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(resetButton).toBeDisabled();
    });

    it("disables reset button when confirmation dialog is shown", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      expect(resetButton).toBeDisabled();
    });

    it("does not call onReset when cancel is clicked", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it("has proper styling for reset button", () => {
      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(resetButton).toHaveClass("bg-gray-500");
      expect(resetButton).toHaveClass("w-12", "h-12");
      expect(resetButton).toHaveClass("rounded-full");
    });

    it("success message disappears after timeout", async () => {
      vi.useFakeTimers();

      render(<Stopwatch {...defaultProps} />);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      expect(
        screen.getByText("Timer and all data successfully reset!")
      ).toBeInTheDocument();

      // Fast forward 3 seconds and flush all timers
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();

      expect(
        screen.queryByText("Timer and all data successfully reset!")
      ).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
