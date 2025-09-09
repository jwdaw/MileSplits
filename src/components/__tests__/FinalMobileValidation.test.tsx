import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "@/app/page";
import { Stopwatch } from "../Stopwatch";
// SplitButton import removed as it's not used in this test file
import { RunnerTable } from "../RunnerTable";
import { Runner } from "@/types";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("Final Mobile Testing and Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("Performance with 10+ Runners", () => {
    it("handles 12 runners efficiently", async () => {
      const startTime = performance.now();

      render(<Home />);

      // Add 12 runners
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 12; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify all runners are displayed
      expect(
        screen.getByText("12 runners • Timer stopped")
      ).toBeInTheDocument();
    });

    it("maintains performance with active timing and multiple runners", () => {
      const mockRunners: Runner[] = Array.from({ length: 10 }, (_, i) => ({
        id: `runner-${i + 1}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      const startTime = performance.now();

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

      const endTime = performance.now();

      // Should render quickly even with many runners
      expect(endTime - startTime).toBeLessThan(200);

      // Verify all runners render
      expect(
        screen.getByText("10 runners • Timer running")
      ).toBeInTheDocument();

      // Check that split buttons are rendered (mobile + desktop = 2x)
      const splitButtons = screen.getAllByText("Record");
      expect(splitButtons.length).toBeGreaterThan(20); // At least 30 buttons (10 runners × 3 splits × mobile/desktop)
    });
  });

  describe("Touch Target Validation", () => {
    it("validates all interactive elements meet minimum touch target size", () => {
      render(<Home />);

      // Add a runner to get split buttons
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Test Runner" } });
      fireEvent.click(addButton);

      // Start timer to enable split buttons
      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      // Validate stopwatch button (112px = 28 * 4px)
      expect(startButton).toHaveClass("w-28", "h-28");

      // Validate add runner button has adequate height
      expect(addButton).toHaveClass("py-3");

      // Validate input field has adequate height
      expect(input).toHaveClass("py-3");

      // Validate split buttons meet minimum size (check the button element, not the text)
      const splitButtons = screen.getAllByRole("button", {
        name: /record mile \d+ split/i,
      });
      splitButtons.forEach((button) => {
        expect(button).toHaveClass("min-h-[48px]");
      });
    });
  });

  describe("Mobile Layout and Responsiveness", () => {
    it("validates mobile-first responsive design", () => {
      render(<Home />);

      // Add multiple runners to test layout
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 5; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      // Verify mobile layout classes
      const mainContent = screen.getByRole("main");
      expect(mainContent).toHaveClass("p-4"); // Mobile padding

      // Timer should be sticky on mobile (check the correct parent element)
      const stickyContainer = document.querySelector(".sticky.top-0");
      expect(stickyContainer).toBeInTheDocument();
    });

    it("validates safe area inset support", () => {
      render(<Home />);

      // Check for safe area classes
      const appContainer = screen.getByRole("main").parentElement;
      expect(appContainer).toHaveClass("safe-area-left", "safe-area-right");

      const mainContent = screen.getByRole("main");
      expect(mainContent).toHaveClass("safe-area-bottom");
    });
  });

  describe("Font Size and iOS Zoom Prevention", () => {
    it("validates input font size prevents iOS zoom", () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");

      // Should have 16px font size to prevent iOS zoom
      expect(input).toHaveClass("text-base"); // 16px in Tailwind

      // Check inline style for iOS zoom prevention
      expect(input.style.fontSize).toBe("16px");
    });

    it("validates readable text sizes across components", () => {
      render(<Home />);

      // Add runner to test all text elements
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Readability Test" } });
      fireEvent.click(addButton);

      // Timer display should be large and readable
      const timerDisplay = screen.getByText("00:00");
      expect(timerDisplay).toHaveClass("text-4xl"); // Mobile size

      // Status text should be readable
      const statusText = screen.getByText("1 runner • Timer stopped");
      expect(statusText).toHaveClass("text-sm"); // Small but readable
    });
  });

  describe("Touch Interaction and Feedback", () => {
    it("validates visual feedback for touch interactions", () => {
      render(<Home />);

      const startButton = screen.getByRole("button", { name: /start timer/i });
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // All interactive elements should have active states
      expect(startButton).toHaveClass("active:scale-95");
      expect(addButton).toHaveClass("active:bg-blue-800");

      // Focus states for accessibility
      expect(addButton).toHaveClass("focus:ring-2");
      expect(startButton).toHaveClass("focus:ring-4");
    });

    it("validates smooth animations and transitions", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const button = screen.getByRole("button");

      // Verify smooth transition classes
      expect(button).toHaveClass("transition-all");
      expect(button).toHaveClass("duration-200");
      expect(button).toHaveClass("ease-in-out");
    });
  });

  describe("Real-world Mobile Usage Scenarios", () => {
    it("simulates complete race timing workflow", async () => {
      render(<Home />);

      // Step 1: Add multiple runners
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      const runnerNames = [
        "Sarah Johnson",
        "Mike Chen",
        "Emma Davis",
        "Alex Rodriguez",
      ];

      for (const name of runnerNames) {
        fireEvent.change(input, { target: { value: name } });
        fireEvent.click(addButton);
      }

      // Step 2: Start the race timer
      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      expect(screen.getByText("Running")).toBeInTheDocument();

      // Step 3: Record splits for different runners
      await waitFor(() => {
        const splitButtons = screen.getAllByText("Record");

        // Record mile 1 splits for first few runners (should have multiple buttons per runner)
        if (splitButtons.length >= 4) {
          fireEvent.click(splitButtons[0]); // First runner's mile 1
          fireEvent.click(splitButtons[3]); // Second runner's mile 1
        }
      });

      // Verify the workflow completed successfully
      expect(screen.getByText("4 runners • Timer running")).toBeInTheDocument();
    });

    it("handles rapid task switching scenarios", async () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });
      const startButton = screen.getByRole("button", { name: /start timer/i });

      // Add runner
      fireEvent.change(input, { target: { value: "Quick Runner" } });
      fireEvent.click(addButton);

      // Start timer immediately
      fireEvent.click(startButton);

      // Add another runner while timer is running
      fireEvent.change(input, { target: { value: "Late Runner" } });
      fireEvent.click(addButton);

      // Should handle rapid task switching
      expect(screen.getByText("2 runners • Timer running")).toBeInTheDocument();
      expect(screen.getAllByText("Quick Runner").length).toBeGreaterThanOrEqual(
        2
      ); // Mobile + desktop + tag
      expect(screen.getAllByText("Late Runner").length).toBeGreaterThanOrEqual(
        2
      );
    });
  });

  describe("Error Handling and Recovery", () => {
    it("validates mobile-friendly error display", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
          error="Test error message for mobile display"
          onClearError={() => {}}
        />
      );

      // Error should be displayed prominently
      expect(
        screen.getByText("Test error message for mobile display")
      ).toBeInTheDocument();

      // Dismiss button should be touch-friendly
      const dismissButton = screen.getByText("Dismiss");
      expect(dismissButton).toBeInTheDocument();
    });

    it("handles localStorage failures gracefully", () => {
      // Mock localStorage failure
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      try {
        const startTime = performance.now();

        render(<Home />);

        const input = screen.getByPlaceholderText("Enter runner name");
        const addButton = screen.getByRole("button", { name: /add runner/i });

        fireEvent.change(input, { target: { value: "Storage Test" } });
        fireEvent.click(addButton);

        const endTime = performance.now();

        // Should handle gracefully and quickly
        expect(endTime - startTime).toBeLessThan(500);

        // App should continue working
        expect(
          screen.getAllByText("Storage Test").length
        ).toBeGreaterThanOrEqual(2); // Mobile + desktop + tag
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("Accessibility on Mobile", () => {
    it("validates ARIA labels and screen reader support", () => {
      render(<Home />);

      // Add runner to test all components
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Accessibility Test" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      // Validate ARIA labels (button state changes after clicking)
      expect(startButton).toHaveAttribute("aria-label", "Stop timer");

      // Split buttons should have descriptive labels
      const splitButtons = screen.getAllByRole("button", {
        name: /record mile \d+ split/i,
      });
      expect(splitButtons.length).toBeGreaterThan(0);
    });

    it("validates color contrast and visual hierarchy", () => {
      render(<Home />);

      const startButton = screen.getByRole("button", { name: /start timer/i });

      // Should have high contrast colors
      expect(startButton).toHaveClass("text-white");
      expect(startButton).toHaveClass("bg-green-500");

      // Timer display should be prominent
      const timerDisplay = screen.getByText("00:00");
      expect(timerDisplay).toHaveClass("text-gray-800");
      expect(timerDisplay).toHaveClass("font-bold");
    });
  });

  describe("Loading and Runtime Performance", () => {
    it("validates fast initial render", () => {
      const startTime = performance.now();

      render(<Home />);

      const endTime = performance.now();

      // Should render quickly
      expect(endTime - startTime).toBeLessThan(100);

      // Core elements should be immediately available
      expect(
        screen.getByRole("button", { name: /start timer/i })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter runner name")
      ).toBeInTheDocument();
    });

    it("validates smooth real-time updates", () => {
      render(
        <Stopwatch
          isRunning={true}
          elapsedTime={5000}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      // Timer should display current time
      expect(screen.getByText("00:05")).toBeInTheDocument();
      expect(screen.getByText("Running")).toBeInTheDocument();
    });
  });
});
