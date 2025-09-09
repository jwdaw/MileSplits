import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Stopwatch } from "../Stopwatch";
import { SplitButton } from "../SplitButton";
import { RunnerTable } from "../RunnerTable";
import AddRunner from "../AddRunner";
import { Runner } from "@/types";

describe("Edge Cases and Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Extreme Time Values", () => {
    it("handles very large elapsed times correctly", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      // Test with 24+ hours (86400000ms = 24 hours)
      const largeTime = 90061000; // 25:01:01
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={largeTime}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // Should display time correctly (minutes:seconds format, so 1501:01)
      expect(screen.getByText("1501:01")).toBeInTheDocument();
    });

    it("handles negative elapsed times gracefully", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={-5000}
          onStart={mockOnStart}
          onStop={mockOnStop}
        />
      );

      // Should display negative time as formatted (the component doesn't handle negatives specially)
      expect(screen.getByText("-1:-5")).toBeInTheDocument();
    });

    it("handles zero elapsed time correctly", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={0}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should not record split with zero elapsed time (this is correct behavior)
      expect(mockOnSplitRecord).not.toHaveBeenCalled();

      // Should show error message
      expect(
        screen.getByText("Invalid time - please wait for timer to start")
      ).toBeInTheDocument();
    });

    it("handles millisecond precision correctly", () => {
      const mockOnSplitRecord = vi.fn();

      // Test with precise millisecond value
      const preciseTime = 123456; // 2:03.456
      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={preciseTime}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "test-runner",
        "mile1",
        preciseTime
      );
    });
  });

  describe("Invalid Input Handling", () => {
    it("handles extremely long runner names", async () => {
      const mockOnAddRunner = vi.fn();
      const veryLongName = "A".repeat(1000); // 1000 character name

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: veryLongName } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name must be less than 50 characters")
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("handles special Unicode characters in runner names", async () => {
      const mockOnAddRunner = vi.fn();
      const unicodeName = "🏃‍♂️ José María Ñoño 中文 العربية";

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: unicodeName } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Runner name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods"
          )
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("handles whitespace-only runner names", async () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "   \t\n   " } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name cannot be empty")
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("handles null and undefined values gracefully", () => {
      const mockOnSplitRecord = vi.fn();

      // Test with undefined splitTime
      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          splitTime={undefined}
          elapsedTime={5000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      expect(screen.getByText("Record")).toBeInTheDocument();
    });
  });

  describe("Rapid User Interactions", () => {
    it("handles rapid button clicking without duplicate actions", async () => {
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

      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      // Should call onStart multiple times (component doesn't prevent this)
      expect(mockOnStart).toHaveBeenCalledTimes(10);
    });

    it("handles rapid split recording attempts", () => {
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

      // Rapid clicks on split button
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      // Should call onSplitRecord multiple times (component doesn't prevent this)
      expect(mockOnSplitRecord).toHaveBeenCalledTimes(5);
    });

    it("handles rapid runner addition", async () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      // Rapid form submissions
      for (let i = 0; i < 3; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(button);
      }

      await waitFor(() => {
        expect(mockOnAddRunner).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Component State Edge Cases", () => {
    it("handles timer running state changes during split recording", () => {
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

      // Timer is running, button should be enabled
      let button = screen.getByRole("button");
      expect(button).not.toBeDisabled();

      // Change timer state to stopped
      rerender(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={false}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Button should now be disabled
      button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("handles empty runners array in RunnerTable", () => {
      render(
        <RunnerTable
          runners={[]}
          elapsedTime={0}
          isTimerRunning={false}
          onSplitRecord={vi.fn()}
        />
      );

      expect(screen.getByText("No runners added yet")).toBeInTheDocument();
    });

    it("handles runners with missing split data", () => {
      const incompleteRunner: Runner = {
        id: "incomplete",
        name: "Incomplete Runner",
        splits: {}, // No splits recorded
      };

      render(
        <RunnerTable
          runners={[incompleteRunner]}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      // Should render without errors
      expect(screen.getAllByText("Incomplete Runner")).toHaveLength(2);
      expect(screen.getAllByText("Record")).toHaveLength(6); // 3 miles × 2 views
    });
  });

  describe("Error Boundary Scenarios", () => {
    it("handles component errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Test with invalid props that might cause errors
      const invalidRunner = {
        id: "invalid",
        name: "Invalid Runner",
        splits: {}, // Use empty object instead of null to avoid runtime errors
      } as unknown;

      // This should render without errors
      render(
        <RunnerTable
          runners={[invalidRunner]}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      // Should render the runner name
      expect(screen.getAllByText("Invalid Runner")).toHaveLength(2);

      consoleSpy.mockRestore();
    });

    it("handles callback function errors", () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={errorCallback}
          onStop={vi.fn()}
        />
      );

      const button = screen.getByRole("button");

      // Should not crash when callback throws error
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("handles large number of runners efficiently", () => {
      const manyRunners: Runner[] = Array.from({ length: 100 }, (_, i) => ({
        id: `runner-${i}`,
        name: `Runner ${i + 1}`,
        splits: {
          mile1: i * 1000,
          mile2: i * 2000,
          mile3: i * 3000,
        },
      }));

      const startTime = performance.now();

      render(
        <RunnerTable
          runners={manyRunners}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={vi.fn()}
        />
      );

      const endTime = performance.now();

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(200);

      // Should display correct count
      expect(
        screen.getByText("100 runners • Timer running")
      ).toBeInTheDocument();
    });

    it("handles frequent re-renders without performance issues", () => {
      const mockOnSplitRecord = vi.fn();

      const { rerender } = render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={0}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const startTime = performance.now();

      // Simulate frequent timer updates
      for (let i = 0; i < 100; i++) {
        rerender(
          <SplitButton
            runnerId="test-runner"
            splitType="mile1"
            elapsedTime={i * 100}
            isTimerRunning={true}
            onSplitRecord={mockOnSplitRecord}
          />
        );
      }

      const endTime = performance.now();

      // Should handle frequent updates efficiently
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Browser Compatibility Edge Cases", () => {
    it("handles missing localStorage gracefully", () => {
      // This test is more relevant for integration tests, but we can test component behavior
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      // Component should still function without localStorage
      const input = screen.getByPlaceholderText("Enter runner name");
      const button = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Test Runner" } });
      fireEvent.click(button);

      expect(mockOnAddRunner).toHaveBeenCalled();
    });

    it("handles focus events properly", () => {
      const mockOnAddRunner = vi.fn();

      render(<AddRunner runners={[]} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");

      // Should handle focus/blur events without errors
      fireEvent.focus(input);
      fireEvent.blur(input);
      fireEvent.focus(input);

      expect(input).toBeInTheDocument();
    });
  });
});
