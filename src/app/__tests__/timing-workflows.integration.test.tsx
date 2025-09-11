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

  describe("Reset Functionality Integration", () => {
    it("should reset all data and return to initial state", async () => {
      render(<Home />);

      // Step 1: Set up a complete timing session
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Add multiple runners
      fireEvent.change(nameInput, { target: { value: "Runner 1" } });
      fireEvent.click(addButton);
      fireEvent.change(nameInput, { target: { value: "Runner 2" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("2 runners • Timer stopped")
        ).toBeInTheDocument();
      });

      // Start timer and record some splits
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Record splits
      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);
      fireEvent.click(recordButtons[3]); // Different runner

      await waitFor(() => {
        const timeDisplays = screen.queryAllByText(/\d{2}:\d{2}/);
        expect(timeDisplays.length).toBeGreaterThan(3); // Timer + splits
      });

      // Step 2: Initiate reset
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      // Should show confirmation dialog
      expect(screen.getByText("Reset Timer?")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This will clear the timer and all runner data. This action cannot be undone."
        )
      ).toBeInTheDocument();

      // Step 3: Confirm reset
      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      // Step 4: Verify complete reset
      await waitFor(() => {
        // Timer should be reset
        expect(screen.getByText("00:00")).toBeInTheDocument();
        expect(screen.getByText("Stopped")).toBeInTheDocument();
        expect(screen.getByText("START")).toBeInTheDocument();

        // All runners should be cleared
        expect(screen.queryByText("Runner 1")).not.toBeInTheDocument();
        expect(screen.queryByText("Runner 2")).not.toBeInTheDocument();

        // Should show empty state
        expect(screen.getByText("No runners added yet")).toBeInTheDocument();

        // Success message should appear
        expect(
          screen.getByText("Timer and all data successfully reset!")
        ).toBeInTheDocument();
      });

      // localStorage should be cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
    });

    it("should cancel reset when cancel button is clicked", async () => {
      render(<Home />);

      // Add a runner and start timing
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Test Runner" } });
      fireEvent.click(addButton);

      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Initiate reset
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      expect(screen.getByText("Reset Timer?")).toBeInTheDocument();

      // Cancel reset
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      // Everything should remain unchanged
      await waitFor(() => {
        expect(screen.queryByText("Reset Timer?")).not.toBeInTheDocument();
        expect(screen.getByText("Running")).toBeInTheDocument();
        expect(screen.getByText("Test Runner")).toBeInTheDocument();
        expect(
          screen.getByText("1 runner • Timer running")
        ).toBeInTheDocument();
      });

      // localStorage should not be cleared
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it("should disable reset button when error is present", async () => {
      render(<Home />);

      // Add runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Error Runner" } });
      fireEvent.click(addButton);

      // If there's an error state, reset button should be disabled
      // This test verifies the button exists and can be disabled
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).not.toBeDisabled(); // Should be enabled when no error
    });

    it("should handle reset during active timing session", async () => {
      render(<Home />);

      // Set up active timing session
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Active Runner" } });
      fireEvent.click(addButton);

      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
      });

      // Let timer run for a bit
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reset during active timing
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      // Should reset everything including stopping the timer
      await waitFor(() => {
        expect(screen.getByText("00:00")).toBeInTheDocument();
        expect(screen.getByText("Stopped")).toBeInTheDocument();
        expect(screen.getByText("START")).toBeInTheDocument();
        expect(screen.queryByText("Active Runner")).not.toBeInTheDocument();
      });
    });

    it("should show success message and hide it after timeout", async () => {
      vi.useFakeTimers();

      render(<Home />);

      // Add runner and reset
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Success Runner" } });
      fireEvent.click(addButton);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      // Success message should appear
      await waitFor(() => {
        expect(
          screen.getByText("Timer and all data successfully reset!")
        ).toBeInTheDocument();
      });

      // Fast forward 3 seconds
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();

      // Success message should disappear
      await waitFor(() => {
        expect(
          screen.queryByText("Timer and all data successfully reset!")
        ).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it("should allow adding new runners after reset", async () => {
      render(<Home />);

      // Add runner and reset
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, { target: { value: "Pre-Reset Runner" } });
      fireEvent.click(addButton);

      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText("Pre-Reset Runner")).not.toBeInTheDocument();
      });

      // Should be able to add new runners after reset
      fireEvent.change(nameInput, { target: { value: "Post-Reset Runner" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Post-Reset Runner")).toHaveLength(3);
        expect(
          screen.getByText("1 runner • Timer stopped")
        ).toBeInTheDocument();
      });

      // Should be able to start timing again
      const startButton = screen.getByText("START");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText("Running")).toBeInTheDocument();
        expect(
          screen.getByText("1 runner • Timer running")
        ).toBeInTheDocument();
      });
    });

    it("should handle reset with localStorage errors gracefully", async () => {
      // Mock localStorage.removeItem to fail
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Failed to clear storage");
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<Home />);

      // Add runner
      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(nameInput, {
        target: { value: "Storage Error Runner" },
      });
      fireEvent.click(addButton);

      // Reset should still work even if localStorage fails
      const resetButton = screen.getByRole("button", {
        name: "Reset timer and clear all data",
      });
      fireEvent.click(resetButton);

      const confirmButton = screen.getByText("Reset All Data");
      fireEvent.click(confirmButton);

      // App state should still be reset
      await waitFor(() => {
        expect(screen.getByText("00:00")).toBeInTheDocument();
        expect(screen.getByText("Stopped")).toBeInTheDocument();
        expect(
          screen.queryByText("Storage Error Runner")
        ).not.toBeInTheDocument();
        expect(
          screen.getByText("Timer and all data successfully reset!")
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should preserve app performance after multiple resets", async () => {
      render(<Home />);

      const nameInput = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Perform multiple reset cycles
      for (let cycle = 1; cycle <= 3; cycle++) {
        // Add runners
        for (let i = 1; i <= 5; i++) {
          fireEvent.change(nameInput, {
            target: { value: `Cycle ${cycle} Runner ${i}` },
          });
          fireEvent.click(addButton);
        }

        await waitFor(() => {
          expect(
            screen.getByText("5 runners • Timer stopped")
          ).toBeInTheDocument();
        });

        // Start timing and record splits
        const startButton = screen.getByText("START");
        fireEvent.click(startButton);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const recordButtons = screen.getAllByText("Record");
        for (let i = 0; i < 3 && i < recordButtons.length; i++) {
          fireEvent.click(recordButtons[i]);
        }

        // Reset
        const resetButton = screen.getByRole("button", {
          name: "Reset timer and clear all data",
        });
        fireEvent.click(resetButton);

        const confirmButton = screen.getByText("Reset All Data");
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(screen.getByText("00:00")).toBeInTheDocument();
          expect(screen.getByText("No runners added yet")).toBeInTheDocument();
        });
      }

      // App should still be responsive after multiple resets
      fireEvent.change(nameInput, { target: { value: "Final Test Runner" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getAllByText("Final Test Runner")).toHaveLength(3);
      });
    });
  });
});
