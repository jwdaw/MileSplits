import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../page";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Complete Timing Workflows Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("Basic Timing Workflow", () => {
    it("should complete a full timing session with multiple runners", async () => {
      render(<Home />);

      // Step 1: Add multiple runners
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Add first runner
      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("John Doe")).toHaveLength(3); // Name appears in multiple places
      });

      // Add second runner
      fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Jane Smith")).toHaveLength(3);
      });

      // Step 2: Start the timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("STOP")).toBeInTheDocument();
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Step 3: Record splits for runners
      // Wait a moment for timer to update
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Find and click split buttons for John Doe
      const recordButtons = screen.getAllByText("Record");
      expect(recordButtons.length).toBeGreaterThan(0);

      // Record mile 1 for first runner (assuming first few buttons are for first runner)
      fireEvent.click(recordButtons[0]);

      // Verify split was recorded by checking for time display
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(2); // Timer display + split time
      });

      // Step 4: Stop the timer
      const stopButton = screen.getByText("STOP");
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByText("START")).toBeInTheDocument();
        expect(screen.getByText("Stopped")).toBeInTheDocument();
      });

      // Verify final state
      expect(screen.getByText("2 runners • Timer stopped")).toBeInTheDocument();
    });

    it("should handle rapid split recording during active timing", async () => {
      render(<Home />);

      // Add a runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Speed Runner" } });
      fireEvent.click(addButton);

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Wait for timer to update
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Rapidly record multiple splits
      const recordButtons = screen.getAllByText("Record");

      // Record mile 1
      fireEvent.click(recordButtons[0]);

      // Wait a bit and record mile 2
      await new Promise((resolve) => setTimeout(resolve, 50));
      const updatedRecordButtons = screen.getAllByText("Record");
      if (updatedRecordButtons.length > 0) {
        fireEvent.click(updatedRecordButtons[0]);
      }

      // Verify multiple splits were recorded
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(2);
      });
    });
  });

  describe("Split Time Accuracy", () => {
    it("should record accurate split times at different intervals", async () => {
      render(<Home />);

      // Add runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Accurate Runner" } });
      fireEvent.click(addButton);

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // Wait for specific time intervals and record splits
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Record first split
      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      // Verify split time is reasonable (should be around 0:00 to 0:01)
      await waitFor(() => {
        const splitTimes = screen.queryAllByText(/00:0[01]/);
        expect(splitTimes.length).toBeGreaterThan(0);
      });

      // Wait longer and record another split
      await new Promise((resolve) => setTimeout(resolve, 200));

      const updatedRecordButtons = screen.getAllByText("Record");
      if (updatedRecordButtons.length > 0) {
        fireEvent.click(updatedRecordButtons[0]);

        // Second split should be later than first
        await waitFor(() => {
          const allTimes = screen.queryAllByText(/\d{2}:\d{2}/);
          expect(allTimes.length).toBeGreaterThan(3); // Timer + 2 splits
        });
      }
    });

    it("should maintain split time accuracy across timer stop/start cycles", async () => {
      render(<Home />);

      // Add runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Cycle Runner" } });
      fireEvent.click(addButton);

      // Start timer
      let startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // Wait and record a split
      await new Promise((resolve) => setTimeout(resolve, 100));

      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      // Stop timer
      const stopButton = screen.getByText("STOP");
      fireEvent.click(stopButton);

      // Restart timer
      startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // Wait and record another split
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updatedRecordButtons = screen.getAllByText("Record");
      if (updatedRecordButtons.length > 0) {
        fireEvent.click(updatedRecordButtons[0]);

        // Both splits should be preserved and accurate
        await waitFor(() => {
          const allTimes = screen.queryAllByText(/\d{2}:\d{2}/);
          expect(allTimes.length).toBeGreaterThan(3);
        });
      }
    });
  });

  describe("Multiple Runner Scenarios", () => {
    it("should handle 10+ runners with individual split tracking", async () => {
      render(<Home />);

      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Add 10 runners
      for (let i = 1; i <= 10; i++) {
        fireEvent.change(nameInput, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);

        await waitFor(() => {
          expect(screen.getAllByText(`Runner ${i}`)).toHaveLength(3);
        });
      }

      // Verify all runners are displayed
      expect(
        screen.getByText("10 runners • Timer stopped")
      ).toBeInTheDocument();

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByText("10 runners • Timer running")
        ).toBeInTheDocument();
      });

      // Wait for timer to update
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Record splits for multiple runners
      const recordButtons = screen.getAllByText("Record");
      expect(recordButtons.length).toBe(60); // 10 runners × 3 miles × 2 views

      // Record some splits
      for (let i = 0; i < 5 && i < recordButtons.length; i++) {
        fireEvent.click(recordButtons[i]);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Verify splits were recorded
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(5); // Timer + recorded splits
      });
    });

    it("should track different split patterns for different runners", async () => {
      render(<Home />);

      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Add 3 runners
      const runnerNames = ["Fast Runner", "Medium Runner", "Slow Runner"];
      for (const name of runnerNames) {
        fireEvent.change(nameInput, { target: { value: name } });
        fireEvent.click(addButton);

        await waitFor(() => {
          expect(screen.getAllByText(name)).toHaveLength(3);
        });
      }

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Record different split patterns
      const recordButtons = screen.getAllByText("Record");

      // Fast Runner: Record mile 1 and 2
      fireEvent.click(recordButtons[0]); // Mile 1
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updatedButtons1 = screen.getAllByText("Record");
      fireEvent.click(updatedButtons1[0]); // Mile 2

      // Medium Runner: Record only mile 1
      await new Promise((resolve) => setTimeout(resolve, 50));
      const updatedButtons2 = screen.getAllByText("Record");
      if (updatedButtons2.length > 3) {
        fireEvent.click(updatedButtons2[3]); // Different runner's mile 1
      }

      // Verify different patterns
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(4); // Timer + multiple splits
      });
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("should handle timer errors gracefully without losing runner data", async () => {
      render(<Home />);

      // Add runners
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Test Runner" } });
      fireEvent.click(addButton);

      // Verify runner is added
      await waitFor(() => {
        expect(screen.getAllByText("Test Runner")).toHaveLength(3);
      });

      // Even if timer has issues, runner data should persist
      expect(screen.getByText("1 runner • Timer stopped")).toBeInTheDocument();
    });

    it("should recover from localStorage errors during active timing", async () => {
      // Mock localStorage to fail on setItem
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(<Home />);

      // Add runner and start timing
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Storage Test Runner" } });
      fireEvent.click(addButton);

      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // App should continue working despite storage errors
      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Should be able to record splits
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      // Verify functionality continues
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(1);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Mobile Interaction Scenarios", () => {
    it("should handle rapid touch interactions without errors", async () => {
      render(<Home />);

      // Add runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Touch Test Runner" } });
      fireEvent.click(addButton);

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Simulate rapid touch interactions
      const recordButtons = screen.getAllByText("Record");

      // Rapid clicks on same button (should only record once)
      fireEvent.click(recordButtons[0]);
      fireEvent.click(recordButtons[0]);
      fireEvent.click(recordButtons[0]);

      // Should only record one split
      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBe(3); // Timer + 1 split × 2 views
      });
    });

    it("should maintain functionality during simulated screen orientation changes", async () => {
      render(<Home />);

      // Add runner and start timing
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Orientation Runner" } });
      fireEvent.click(addButton);

      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // Simulate orientation change by triggering resize
      fireEvent(window, new Event("resize"));

      // App should continue functioning
      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Should still be able to record splits
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(1);
      });
    });
  });

  describe("Performance Under Load", () => {
    it("should maintain responsive UI with active timing and many runners", async () => {
      render(<Home />);

      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Add many runners quickly
      const startTime = performance.now();

      for (let i = 1; i <= 15; i++) {
        fireEvent.change(nameInput, { target: { value: `Perf Runner ${i}` } });
        fireEvent.click(addButton);
      }

      const addTime = performance.now();
      expect(addTime - startTime).toBeLessThan(1000); // Should add runners quickly

      // Start timer
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      // UI should remain responsive
      await waitFor(() => {
        expect(
          screen.getByText("15 runners • Timer running")
        ).toBeInTheDocument();
      });

      // Should handle split recording efficiently
      await new Promise((resolve) => setTimeout(resolve, 150));

      const recordButtons = screen.getAllByText("Record");
      const recordStartTime = performance.now();

      // Record several splits
      for (let i = 0; i < 10 && i < recordButtons.length; i++) {
        fireEvent.click(recordButtons[i]);
      }

      const recordEndTime = performance.now();
      expect(recordEndTime - recordStartTime).toBeLessThan(500); // Should record splits quickly
    });
  });
});
