import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Stopwatch } from "../Stopwatch";

describe("Stopwatch", () => {
  const mockOnStart = vi.fn();
  const mockOnStop = vi.fn();
  const mockOnClearError = vi.fn();

  const defaultProps = {
    isRunning: false,
    elapsedTime: 0,
    onStart: mockOnStart,
    onStop: mockOnStop,
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

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Visual Styling", () => {
    it("has large touch targets for mobile", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-28", "h-28");
    });

    it("has proper focus styles", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-4");
    });

    it("has active scale animation", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("active:scale-95");
    });

    it("has transition animations", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all");
      expect(button).toHaveClass("duration-200");
      expect(button).toHaveClass("ease-in-out");
    });

    it("applies correct colors for start button", () => {
      render(<Stopwatch {...defaultProps} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-green-500");
    });

    it("applies correct colors for stop button", () => {
      render(<Stopwatch {...defaultProps} isRunning={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-500");
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
});
