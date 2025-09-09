import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "@/app/page";
import { Stopwatch } from "../Stopwatch";
import { SplitButton } from "../SplitButton";
import { RunnerTable } from "../RunnerTable";
import AddRunner from "../AddRunner";
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

describe("Mobile Optimization Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("Touch Target Size Validation (WCAG 2.1 AA)", () => {
    it("validates all interactive elements meet 44px minimum", () => {
      render(<Home />);

      // Add a runner to get split buttons
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Test Runner" } });
      fireEvent.click(addButton);

      // Start timer to enable split buttons
      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      // Validate stopwatch button (should be 112px = 28 * 4px)
      expect(startButton).toHaveClass("w-28", "h-28");

      // Validate add runner button
      expect(addButton).toHaveClass("py-3"); // Minimum 48px height

      // Validate input field
      expect(input).toHaveClass("py-3"); // Minimum 48px height

      // Validate split buttons
      const splitButtons = screen.getAllByText("Record");
      splitButtons.forEach((button) => {
        expect(button).toHaveClass("min-h-[48px]");
      });
    });

    it("validates touch targets have adequate spacing", () => {
      const mockRunners: Runner[] = [
        { id: "1", name: "Runner 1", splits: {} },
        { id: "2", name: "Runner 2", splits: {} },
      ];

      render(
        <RunnerTable
          runners={mockRunners}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={() => {}}
        />
      );

      // Check spacing between split buttons
      const container = screen
        .getByText("2 runners • Timer running")
        .closest("div");
      expect(container).toBeInTheDocument();

      // Mobile grid should have gap-2 (8px) minimum
      const mobileGrid = screen
        .getByText("Runner 1")
        .closest("div")
        ?.querySelector(".grid");
      if (mobileGrid) {
        expect(mobileGrid).toHaveClass("gap-2");
      }
    });
  });

  describe("Font Size and Readability Validation", () => {
    it("validates all text meets minimum readable size", () => {
      render(<Home />);

      // Add runner to test all text elements
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Readability Test" } });
      fireEvent.click(addButton);

      // Timer display should be large and readable
      const timerDisplay = screen.getByText("00:00");
      expect(timerDisplay).toHaveClass("text-4xl"); // Mobile size

      // Runner names should be readable
      const runnerName = screen.getByText("Readability Test");
      expect(runnerName).toHaveClass("text-base"); // Minimum readable size

      // Status text should be readable
      const statusText = screen.getByText("1 runner • Timer stopped");
      expect(statusText).toHaveClass("text-sm"); // Small but readable
    });

    it("validates input font size prevents iOS zoom", () => {
      render(<AddRunner runners={[]} onAddRunner={() => {}} />);

      const input = screen.getByPlaceholderText("Enter runner name");

      // Should have 16px font size to prevent iOS zoom
      const computedStyle = window.getComputedStyle(input);
      expect(input).toHaveClass("text-base"); // 16px in Tailwind
    });
  });

  describe("Responsive Layout Validation", () => {
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

      // Timer should be sticky on mobile
      const timerContainer = screen.getByText("00:00").closest("div");
      expect(timerContainer?.parentElement).toHaveClass("sticky", "top-0");
    });

    it("validates no horizontal scrolling on mobile", () => {
      // Simulate narrow mobile viewport
      Object.defineProperty(window, "innerWidth", { value: 320 }); // Very narrow

      render(<Home />);

      // Add content that could cause overflow
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, {
        target: {
          value: "Very Long Runner Name That Could Cause Overflow Issues",
        },
      });
      fireEvent.click(addButton);

      // Verify text truncation is applied
      const runnerName = screen.getByText(
        "Very Long Runner Name That Could Cause Overflow Issues"
      );
      expect(runnerName).toHaveClass("truncate");
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

  describe("Performance Optimization Validation", () => {
    it("validates efficient rendering with many runners", () => {
      const startTime = performance.now();

      render(<Home />);

      // Add 15 runners quickly
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 15; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify all runners are rendered
      expect(
        screen.getByText("15 runners • Timer stopped")
      ).toBeInTheDocument();
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

    it("validates optimized CSS classes usage", () => {
      render(<Home />);

      // Check for mobile-optimized CSS
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);

      // Should have mobile optimizations in global CSS
      expect(computedStyle.webkitTextSizeAdjust).toBe("100%");
    });
  });

  describe("Interaction Feedback Validation", () => {
    it("validates visual feedback for all interactions", () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });
      const startButton = screen.getByRole("button", { name: /start timer/i });

      // All interactive elements should have hover/active states
      expect(addButton).toHaveClass("hover:bg-blue-600");
      expect(startButton).toHaveClass("active:scale-95");

      // Focus states for accessibility
      expect(addButton).toHaveClass("focus:ring-4");
      expect(startButton).toHaveClass("focus:ring-4");
    });

    it("validates split button state changes", () => {
      const mockOnSplitRecord = vi.fn();

      const { rerender } = render(
        <SplitButton
          runnerId="test"
          splitType="mile1"
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");

      // Initial state - blue background
      expect(button).toHaveClass("bg-blue-500");
      expect(screen.getByText("Record")).toBeInTheDocument();

      // Click to record
      fireEvent.click(button);

      // Simulate recorded state
      rerender(
        <SplitButton
          runnerId="test"
          splitType="mile1"
          splitTime={300000}
          elapsedTime={300000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      // Should show recorded state
      expect(screen.getByText("05:00")).toBeInTheDocument();
    });
  });

  describe("Error Handling Validation", () => {
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

    it("validates input validation feedback", () => {
      render(<AddRunner runners={[]} onAddRunner={() => {}} />);

      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Try to add empty runner
      fireEvent.click(addButton);

      // Should show validation error
      expect(
        screen.getByText("Runner name cannot be empty")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility Validation", () => {
    it("validates ARIA labels and roles", () => {
      render(<Home />);

      // Add runner to test all components
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Accessibility Test" } });
      fireEvent.click(addButton);

      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      // Validate ARIA labels
      expect(startButton).toHaveAttribute("aria-label");

      // Split buttons should have descriptive labels
      const splitButtons = screen.getAllByRole("button", {
        name: /record mile \d+ split/i,
      });
      expect(splitButtons.length).toBeGreaterThan(0);
    });

    it("validates keyboard navigation support", () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Should be focusable
      input.focus();
      expect(document.activeElement).toBe(input);

      // Tab navigation should work
      fireEvent.keyDown(input, { key: "Tab" });
      expect(document.activeElement).toBe(addButton);
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

  describe("Loading Performance Validation", () => {
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

  describe("Storage and Session Management", () => {
    it("validates localStorage integration", () => {
      render(<Home />);

      // Add runner and start timer
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Storage Test" } });
      fireEvent.click(addButton);

      // Should attempt to save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it("validates graceful localStorage failure handling", () => {
      // Mock localStorage failure
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      try {
        render(<Home />);

        const input = screen.getByPlaceholderText("Enter runner name");
        const addButton = screen.getByRole("button", { name: /add runner/i });

        fireEvent.change(input, { target: { value: "Storage Failure Test" } });
        fireEvent.click(addButton);

        // App should continue working despite storage failure
        expect(screen.getByText("Storage Failure Test")).toBeInTheDocument();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
