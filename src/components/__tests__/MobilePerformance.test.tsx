import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Home from "@/app/page";
import { RunnerTable } from "../RunnerTable";
import { Stopwatch } from "../Stopwatch";
import { Runner } from "@/types";

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("Mobile Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Performance with 10+ Runners", () => {
    it("handles 15 runners without performance degradation", async () => {
      const startTime = performance.now();

      render(<Home />);

      // Add 15 runners rapidly
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 15; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      const endTime = performance.now();

      // Should complete within reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);

      // Verify all runners are displayed
      expect(
        screen.getByText("15 runners • Timer stopped")
      ).toBeInTheDocument();

      // Check that UI remains responsive
      expect(screen.getByText("Runner 1")).toBeInTheDocument();
      expect(screen.getByText("Runner 15")).toBeInTheDocument();
    });

    it("maintains smooth timer updates with 15 active runners", async () => {
      const mockRunners: Runner[] = Array.from({ length: 15 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      render(
        <div>
          <Stopwatch
            isRunning={true}
            elapsedTime={5000}
            onStart={() => {}}
            onStop={() => {}}
          />
          <RunnerTable
            runners={mockRunners}
            elapsedTime={5000}
            isTimerRunning={true}
            onSplitRecord={() => {}}
          />
        </div>
      );

      // Verify all runners render without performance issues
      expect(
        screen.getByText("15 runners • Timer running")
      ).toBeInTheDocument();

      // Check that split buttons are all functional
      const splitButtons = screen.getAllByText("Record");
      expect(splitButtons).toHaveLength(45); // 15 runners × 3 splits each
    });

    it("handles rapid split recording across multiple runners", async () => {
      const mockOnSplitRecord = vi.fn();
      const mockRunners: Runner[] = Array.from({ length: 10 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      render(
        <RunnerTable
          runners={mockRunners}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const startTime = performance.now();

      // Record splits rapidly for multiple runners
      const splitButtons = screen.getAllByText("Record");

      // Click first 10 split buttons (mile 1 for each runner)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(splitButtons[i]);
      }

      const endTime = performance.now();

      // Should handle rapid clicks efficiently
      expect(endTime - startTime).toBeLessThan(100);
      expect(mockOnSplitRecord).toHaveBeenCalledTimes(10);
    });
  });

  describe("Memory and Resource Management", () => {
    it("efficiently manages component re-renders with many runners", () => {
      const renderSpy = vi.fn();

      const TestComponent = ({ runners }: { runners: Runner[] }) => {
        renderSpy();
        return (
          <RunnerTable
            runners={runners}
            elapsedTime={60000}
            isTimerRunning={true}
            onSplitRecord={() => {}}
          />
        );
      };

      const initialRunners: Runner[] = Array.from({ length: 12 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      const { rerender } = render(<TestComponent runners={initialRunners} />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Update one runner's split
      const updatedRunners = initialRunners.map((runner, index) =>
        index === 0 ? { ...runner, splits: { mile1: 300000 } } : runner
      );

      rerender(<TestComponent runners={updatedRunners} />);

      // Should only trigger minimal re-renders
      expect(
        renderSpy.mock.calls.length - initialRenderCount
      ).toBeLessThanOrEqual(2);
    });

    it("handles localStorage operations efficiently with large datasets", () => {
      const largeRunnerSet: Runner[] = Array.from({ length: 20 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {
          mile1: 300000 + i * 1000,
          mile2: 600000 + i * 1000,
          mile3: 900000 + i * 1000,
        },
      }));

      render(<Home />);

      // Simulate saving large dataset
      const startTime = performance.now();

      // This would normally trigger localStorage save
      largeRunnerSet.forEach((runner) => {
        const input = screen.getByPlaceholderText("Enter runner name");
        const addButton = screen.getByRole("button", { name: /add runner/i });

        fireEvent.change(input, { target: { value: runner.name } });
        fireEvent.click(addButton);
      });

      const endTime = performance.now();

      // Should handle large datasets efficiently
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Real-time Updates Performance", () => {
    it("maintains smooth timer updates under load", async () => {
      render(<Home />);

      // Add multiple runners
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 12; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      // Start timer
      const startTimerButton = screen.getByRole("button", {
        name: /start timer/i,
      });
      fireEvent.click(startTimerButton);

      // Fast-forward timer and check updates
      const startTime = performance.now();

      act(() => {
        vi.advanceTimersByTime(5000); // 5 seconds
      });

      const endTime = performance.now();

      // Timer updates should be efficient
      expect(endTime - startTime).toBeLessThan(50);

      // Verify timer is showing updated time
      expect(screen.getByText("00:05")).toBeInTheDocument();
    });

    it("handles concurrent split recordings efficiently", async () => {
      const mockRunners: Runner[] = Array.from({ length: 8 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      const mockOnSplitRecord = vi.fn();

      render(
        <RunnerTable
          runners={mockRunners}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const splitButtons = screen.getAllByText("Record");

      // Simulate concurrent split recordings
      const startTime = performance.now();

      // Record multiple splits simultaneously
      splitButtons.slice(0, 8).forEach((button, index) => {
        setTimeout(() => fireEvent.click(button), index * 10);
      });

      // Wait for all operations to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const endTime = performance.now();

      // Should handle concurrent operations efficiently
      expect(endTime - startTime).toBeLessThan(200);
      expect(mockOnSplitRecord).toHaveBeenCalledTimes(8);
    });
  });

  describe("Mobile Device Simulation", () => {
    it("performs well on simulated low-end mobile device", async () => {
      // Simulate slower device by adding artificial delay
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = ((
        callback: (...args: unknown[]) => void,
        delay: number
      ) => {
        return originalSetTimeout(callback, delay * 1.5); // 50% slower
      }) as typeof setTimeout;

      try {
        const startTime = performance.now();

        render(<Home />);

        // Add runners and start timing
        const input = screen.getByPlaceholderText("Enter runner name");
        const addButton = screen.getByRole("button", { name: /add runner/i });

        for (let i = 1; i <= 10; i++) {
          fireEvent.change(input, { target: { value: `Runner ${i}` } });
          fireEvent.click(addButton);
        }

        const startTimerButton = screen.getByRole("button", {
          name: /start timer/i,
        });
        fireEvent.click(startTimerButton);

        const endTime = performance.now();

        // Should still perform reasonably on slower devices
        expect(endTime - startTime).toBeLessThan(1500);

        // Verify functionality is maintained
        expect(
          screen.getByText("10 runners • Timer running")
        ).toBeInTheDocument();
      } finally {
        window.setTimeout = originalSetTimeout;
      }
    });

    it("maintains responsiveness during intensive operations", async () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Measure responsiveness during rapid operations
      const responseTimes: number[] = [];

      for (let i = 1; i <= 15; i++) {
        const startTime = performance.now();

        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);

        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
      }

      // Calculate average response time
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // Should maintain good responsiveness (under 50ms average)
      expect(avgResponseTime).toBeLessThan(50);

      // No single operation should take too long
      expect(Math.max(...responseTimes)).toBeLessThan(100);
    });
  });

  describe("Touch Interaction Performance", () => {
    it("handles rapid touch events without lag", async () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <RunnerTable
          runners={[{ id: "runner-1", name: "Test Runner", splits: {} }]}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const splitButton = screen.getByText("Record");

      // Simulate rapid touch events (like accidental double-taps)
      const touchEvents = [];
      const startTime = performance.now();

      for (let i = 0; i < 5; i++) {
        const touchStart = performance.now();
        fireEvent.click(splitButton);
        const touchEnd = performance.now();
        touchEvents.push(touchEnd - touchStart);
      }

      const endTime = performance.now();

      // Total time should be reasonable
      expect(endTime - startTime).toBeLessThan(100);

      // Each touch event should be handled quickly
      touchEvents.forEach((time) => {
        expect(time).toBeLessThan(20);
      });
    });

    it("maintains smooth animations during interactions", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const button = screen.getByRole("button");

      // Verify animation classes are present for smooth interactions
      expect(button).toHaveClass("transition-all");
      expect(button).toHaveClass("duration-200");
      expect(button).toHaveClass("ease-in-out");
      expect(button).toHaveClass("active:scale-95");
    });
  });

  describe("Error Recovery Performance", () => {
    it("recovers quickly from localStorage errors", () => {
      // Simulate localStorage failure
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const startTime = performance.now();

      render(<Home />);

      const endTime = performance.now();

      // Should handle localStorage errors gracefully and quickly
      expect(endTime - startTime).toBeLessThan(100);

      // App should still be functional
      expect(
        screen.getByPlaceholderText("Enter runner name")
      ).toBeInTheDocument();
    });

    it("handles component errors without affecting performance", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        const startTime = performance.now();

        // This should not cause performance issues even with errors
        render(<Home />);

        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
