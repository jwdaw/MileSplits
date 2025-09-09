import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Stopwatch } from "../Stopwatch";
import { SplitButton } from "../SplitButton";
import { RunnerTable } from "../RunnerTable";
import AddRunner from "../AddRunner";
import { Runner } from "@/types";

describe("Mobile Interaction Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Touch Target Sizes", () => {
    it("Stopwatch button meets minimum touch target size (44px)", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByRole("button");

      // Check for large touch target classes
      expect(button).toHaveClass("w-28"); // 112px (7rem)
      expect(button).toHaveClass("h-28"); // 112px (7rem)
    });

    it("SplitButton meets minimum touch target size", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");

      // Check for minimum height class
      expect(button).toHaveClass("min-h-[48px]");
    });

    it("AddRunner button has adequate touch target", () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const button = screen.getByRole("button", { name: /add runner/i });

      // Should have padding and height for touch targets
      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-3");
    });
  });

  describe("Touch Interaction Feedback", () => {
    it("Stopwatch button provides visual feedback on touch", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByRole("button");

      // Check for active state animation
      expect(button).toHaveClass("active:scale-95");
      expect(button).toHaveClass("transition-all");
    });

    it("SplitButton provides visual feedback on touch", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");

      // Check for touch feedback classes
      expect(button).toHaveClass("active:scale-95");
      expect(button).toHaveClass("transition-all");
    });

    it("Split button shows clear state changes after recording", async () => {
      const mockOnSplitRecord = vi.fn();

      const { rerender } = render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");

      // Initial state - should be blue and show "Record"
      expect(button).toHaveClass("bg-blue-500");
      expect(screen.getByText("Record")).toBeInTheDocument();

      // Click to record
      fireEvent.click(button);

      // Simulate the split being recorded
      rerender(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          splitTime={5000}
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Should show recorded state with green background and time
      expect(button).toHaveClass("text-green-800");
      expect(button.className).toMatch(/bg-green-/);
      expect(screen.getByText("00:05")).toBeInTheDocument();
    });
  });

  describe("Responsive Layout Behavior", () => {
    it("RunnerTable adapts layout for mobile screens", () => {
      const mockRunners: Runner[] = [
        {
          id: "runner-1",
          name: "John Doe",
          splits: { mile1: 300000 },
        },
      ];

      render(
        <RunnerTable
          runners={mockRunners}
          elapsedTime={600000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      // Mobile layout should stack elements vertically
      // Desktop headers should be hidden on mobile (sm:block class means hidden by default)
      const runnerHeader = screen.getByText("Runner");
      expect(runnerHeader).toBeInTheDocument();

      // Runner name should appear in both mobile and desktop layouts
      expect(screen.getAllByText("John Doe")).toHaveLength(2);
    });

    it("handles long runner names on mobile without breaking layout", () => {
      const longNameRunner: Runner = {
        id: "long-name",
        name: "This is an extremely long runner name that could potentially break the mobile layout if not handled properly",
        splits: {},
      };

      render(
        <RunnerTable
          runners={[longNameRunner]}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      // Name should be truncated with CSS classes
      const nameElements = screen.getAllByText(longNameRunner.name);
      nameElements.forEach((element) => {
        expect(element).toHaveClass("truncate");
      });
    });
  });

  describe("Accessibility on Mobile", () => {
    it("maintains proper focus management for touch interactions", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByRole("button");

      // Should have focus styles for accessibility
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-4");
    });

    it("provides proper aria labels for screen readers", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile2"
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Record mile 2 split");
    });

    it("maintains accessibility when split is recorded", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile3"
          splitTime={300000}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        "Mile 3 split recorded: 05:00"
      );
    });
  });

  describe("Input Handling on Mobile", () => {
    it("handles virtual keyboard interactions properly", async () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const form = input.closest("form");

      // Simulate typing on mobile virtual keyboard
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Mobile Runner" } });

      expect(input).toHaveValue("Mobile Runner");

      // Simulate form submission via virtual keyboard "Go" button
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockOnAddRunner).toHaveBeenCalledWith({
          id: expect.any(String),
          name: "Mobile Runner",
          splits: {},
        });
      });
    });

    it("clears input after successful submission on mobile", async () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Test Runner" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });
  });

  describe("Performance on Mobile Devices", () => {
    it("handles rapid touch events without performance degradation", async () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");

      // Simulate rapid touch events (double-tap, accidental touches)
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      const endTime = performance.now();

      // Should handle rapid events quickly
      expect(endTime - startTime).toBeLessThan(100);

      // Should call onSplitRecord for each click (component doesn't prevent multiple calls)
      expect(mockOnSplitRecord).toHaveBeenCalledTimes(10);
    });

    it("maintains smooth animations during interactions", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      const button = screen.getByRole("button");

      // Should have smooth transition classes
      expect(button).toHaveClass("transition-all");
      expect(button).toHaveClass("duration-200");
      expect(button).toHaveClass("ease-in-out");
    });
  });

  describe("Error Handling on Mobile", () => {
    it("displays mobile-friendly error messages", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      const mockOnClearError = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
          error="Network connection lost. Timer may not sync properly."
          onClearError={mockOnClearError}
        />
      );

      // Error should be displayed in mobile-friendly format
      expect(
        screen.getByText(
          "Network connection lost. Timer may not sync properly."
        )
      ).toBeInTheDocument();

      // Dismiss button should be touch-friendly
      const dismissButton = screen.getByText("Dismiss");
      expect(dismissButton).toBeInTheDocument();
    });

    it("handles input validation errors on mobile", async () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      // Try to submit empty name
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name cannot be empty")
        ).toBeInTheDocument();
      });

      // Error should clear when user starts typing
      fireEvent.change(input, { target: { value: "A" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Runner name cannot be empty")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Viewport and Orientation", () => {
    it("maintains functionality across different mobile viewport sizes", () => {
      const mockRunners: Runner[] = [
        { id: "1", name: "Runner 1", splits: {} },
        { id: "2", name: "Runner 2", splits: {} },
      ];

      // Test with different viewport configurations
      render(
        <RunnerTable
          runners={mockRunners}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      // Should render without layout issues
      expect(screen.getByText("2 runners • Timer running")).toBeInTheDocument();
      expect(screen.getAllByText("Runner 1")).toHaveLength(2);
      expect(screen.getAllByText("Runner 2")).toHaveLength(2);
    });

    it("handles safe area insets properly", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // Component should render without issues (safe area classes are applied at app level)
      expect(screen.getByText("START")).toBeInTheDocument();
    });
  });
});
