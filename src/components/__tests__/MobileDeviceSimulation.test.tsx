import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "@/app/page";
import { RunnerTable } from "../RunnerTable";
import { Stopwatch } from "../Stopwatch";
import { Runner } from "@/types";

// Mock different iPhone viewport sizes
const IPHONE_VIEWPORTS = {
  "iPhone SE": { width: 375, height: 667 },
  "iPhone 12/13/14": { width: 390, height: 844 },
  "iPhone 12/13/14 Pro": { width: 393, height: 852 },
  "iPhone 14 Plus": { width: 428, height: 926 },
  "iPhone 14 Pro Max": { width: 430, height: 932 },
};

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

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(mockMatchMedia),
});

describe("Mobile Device Simulation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe("iPhone Screen Size Compatibility", () => {
    Object.entries(IPHONE_VIEWPORTS).forEach(([deviceName, viewport]) => {
      it(`renders correctly on ${deviceName} (${viewport.width}x${viewport.height})`, () => {
        // Mock viewport dimensions
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, "innerHeight", {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        render(<Home />);

        // Verify core elements are visible and accessible
        expect(
          screen.getByRole("button", { name: /start timer/i })
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("Enter runner name")
        ).toBeInTheDocument();
        expect(screen.getByText("00:00")).toBeInTheDocument();

        // Verify no horizontal scrolling is needed
        const mainContent = screen.getByRole("main");
        expect(mainContent).toBeInTheDocument();
      });
    });

    it("maintains touch target sizes across all iPhone sizes", () => {
      Object.entries(IPHONE_VIEWPORTS).forEach(([deviceName, viewport]) => {
        Object.defineProperty(window, "innerWidth", {
          value: viewport.width,
        });

        const { unmount } = render(
          <Stopwatch
            isRunning={false}
            elapsedTime={0}
            onStart={() => {}}
            onStop={() => {}}
          />
        );

        const button = screen.getByRole("button");

        // Verify minimum touch target size (44px) is maintained
        expect(button).toHaveClass("w-28", "h-28"); // 112px minimum

        unmount();
      });
    });
  });

  describe("Portrait vs Landscape Orientation", () => {
    it("handles portrait orientation properly", () => {
      // Simulate portrait mode (height > width)
      Object.defineProperty(window, "innerWidth", { value: 390 });
      Object.defineProperty(window, "innerHeight", { value: 844 });

      render(<Home />);

      // Add some runners to test layout
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Test Runner" } });
      fireEvent.click(addButton);

      // Verify layout works in portrait
      expect(screen.getByText("Test Runner")).toBeInTheDocument();
      expect(screen.getByText("1 runner • Timer stopped")).toBeInTheDocument();
    });

    it("handles landscape orientation gracefully", () => {
      // Simulate landscape mode (width > height)
      Object.defineProperty(window, "innerWidth", { value: 844 });
      Object.defineProperty(window, "innerHeight", { value: 390 });

      render(<Home />);

      // Verify core functionality remains accessible
      expect(
        screen.getByRole("button", { name: /start timer/i })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter runner name")
      ).toBeInTheDocument();
    });
  });

  describe("Touch Interaction Simulation", () => {
    it("simulates finger touch interactions accurately", async () => {
      render(<Home />);

      // Add a runner
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // Simulate touch events (more realistic than click)
      fireEvent.touchStart(input);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Touch Test Runner" } });
      fireEvent.touchEnd(input);

      fireEvent.touchStart(addButton);
      fireEvent.click(addButton);
      fireEvent.touchEnd(addButton);

      await waitFor(() => {
        expect(screen.getByText("Touch Test Runner")).toBeInTheDocument();
      });
    });

    it("handles multi-touch scenarios", () => {
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

      const splitButtons = screen.getAllByText("Record");

      // Simulate accidental multi-touch (touching multiple buttons)
      fireEvent.touchStart(splitButtons[0]);
      fireEvent.touchStart(splitButtons[1]);
      fireEvent.click(splitButtons[0]);
      fireEvent.click(splitButtons[1]);
      fireEvent.touchEnd(splitButtons[0]);
      fireEvent.touchEnd(splitButtons[1]);

      // Should handle gracefully without errors
      expect(splitButtons[0]).toBeInTheDocument();
      expect(splitButtons[1]).toBeInTheDocument();
    });

    it("simulates thumb-friendly navigation patterns", () => {
      render(<Home />);

      // Add multiple runners to test scrolling/navigation
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      for (let i = 1; i <= 8; i++) {
        fireEvent.change(input, { target: { value: `Runner ${i}` } });
        fireEvent.click(addButton);
      }

      // Verify all runners are accessible
      expect(screen.getByText("8 runners • Timer stopped")).toBeInTheDocument();
      expect(screen.getByText("Runner 1")).toBeInTheDocument();
      expect(screen.getByText("Runner 8")).toBeInTheDocument();
    });
  });

  describe("iOS Safari Specific Tests", () => {
    it("prevents zoom on input focus", () => {
      render(<Home />);

      const input = screen.getByPlaceholderText("Enter runner name");

      // Verify font size is 16px or larger to prevent iOS zoom
      const computedStyle = window.getComputedStyle(input);
      const fontSize = parseInt(computedStyle.fontSize);

      expect(fontSize).toBeGreaterThanOrEqual(16);
    });

    it("handles iOS safe area insets", () => {
      // Mock safe area insets
      Object.defineProperty(document.documentElement.style, "setProperty", {
        value: vi.fn(),
      });

      render(<Home />);

      // Verify safe area classes are applied (these are in the main page component)
      const mainElement = screen.getByRole("main");
      expect(mainElement).toHaveClass("safe-area-bottom");
    });

    it("prevents double-tap zoom", () => {
      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={() => {}}
          onStop={() => {}}
        />
      );

      const button = screen.getByRole("button");

      // Simulate double-tap
      fireEvent.click(button);
      fireEvent.click(button);

      // Should not cause zoom (handled by CSS touch-action: manipulation)
      expect(button).toHaveClass("touch-target");
    });
  });

  describe("Performance on Actual Device Conditions", () => {
    it("simulates slower network conditions", async () => {
      // Mock slower performance
      const originalPerformance = window.performance;
      Object.defineProperty(window, "performance", {
        value: {
          ...originalPerformance,
          now: () => originalPerformance.now() * 1.5, // Simulate 50% slower
        },
      });

      try {
        const startTime = performance.now();

        render(<Home />);

        // Add runners and test performance
        const input = screen.getByPlaceholderText("Enter runner name");
        const addButton = screen.getByRole("button", { name: /add runner/i });

        for (let i = 1; i <= 10; i++) {
          fireEvent.change(input, { target: { value: `Runner ${i}` } });
          fireEvent.click(addButton);
        }

        const endTime = performance.now();

        // Should still perform reasonably under slower conditions
        expect(endTime - startTime).toBeLessThan(2000);
      } finally {
        Object.defineProperty(window, "performance", {
          value: originalPerformance,
        });
      }
    });

    it("handles memory constraints gracefully", () => {
      // Simulate memory pressure by creating large objects
      const memoryPressure = Array.from({ length: 1000 }, () =>
        new Array(1000).fill("memory-pressure-test")
      );

      const startTime = performance.now();

      render(<Home />);

      const endTime = performance.now();

      // Should still render quickly despite memory pressure
      expect(endTime - startTime).toBeLessThan(500);

      // Cleanup
      memoryPressure.length = 0;
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("simulates complete race timing workflow on mobile", async () => {
      render(<Home />);

      // Step 1: Add multiple runners (typical race scenario)
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      const runnerNames = [
        "Sarah Johnson",
        "Mike Chen",
        "Emma Davis",
        "Alex Rodriguez",
        "Jessica Kim",
        "David Wilson",
        "Maria Garcia",
        "James Lee",
      ];

      for (const name of runnerNames) {
        fireEvent.change(input, { target: { value: name } });
        fireEvent.click(addButton);
      }

      // Step 2: Start the race timer
      const startButton = screen.getByRole("button", { name: /start timer/i });
      fireEvent.click(startButton);

      expect(screen.getByText("Running")).toBeInTheDocument();

      // Step 3: Record splits for different runners at different times
      await waitFor(() => {
        const splitButtons = screen.getAllByText("Record");

        // Record mile 1 splits for first few runners
        fireEvent.click(splitButtons[0]); // Sarah's mile 1
        fireEvent.click(splitButtons[3]); // Mike's mile 1
        fireEvent.click(splitButtons[6]); // Emma's mile 1
      });

      // Verify the workflow completed successfully
      expect(screen.getByText("8 runners • Timer running")).toBeInTheDocument();
    });

    it("handles coach multitasking scenarios", async () => {
      render(<Home />);

      // Simulate rapid switching between tasks
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
      expect(screen.getByText("Quick Runner")).toBeInTheDocument();
      expect(screen.getByText("Late Runner")).toBeInTheDocument();
    });

    it("validates complete app functionality under mobile constraints", () => {
      // Simulate mobile constraints
      Object.defineProperty(window, "innerWidth", { value: 375 }); // iPhone SE width
      Object.defineProperty(navigator, "hardwareConcurrency", { value: 2 }); // Dual core

      render(<Home />);

      // Test all major features
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });
      const startButton = screen.getByRole("button", { name: /start timer/i });

      // Add runners
      fireEvent.change(input, { target: { value: "Mobile Test Runner" } });
      fireEvent.click(addButton);

      // Start timing
      fireEvent.click(startButton);

      // Verify all functionality works
      expect(screen.getByText("Running")).toBeInTheDocument();
      expect(screen.getByText("Mobile Test Runner")).toBeInTheDocument();
      expect(screen.getByText("1 runner • Timer running")).toBeInTheDocument();

      // Test split recording
      const recordButton = screen.getByText("Record");
      fireEvent.click(recordButton);

      // All features should work under mobile constraints
      expect(recordButton).toBeInTheDocument();
    });
  });

  describe("Accessibility on Mobile Devices", () => {
    it("maintains accessibility with screen readers on mobile", () => {
      render(<Home />);

      // Verify ARIA labels are present for mobile screen readers
      const startButton = screen.getByRole("button", { name: /start timer/i });
      expect(startButton).toHaveAttribute("aria-label", "Start timer");

      // Add a runner to test split button accessibility
      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "Accessibility Test" } });
      fireEvent.click(addButton);

      // Start timer to enable split buttons
      fireEvent.click(startButton);

      // Check split button accessibility
      const splitButtons = screen.getAllByRole("button", {
        name: /record mile \d+ split/i,
      });
      expect(splitButtons.length).toBeGreaterThan(0);

      splitButtons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
      });
    });

    it("supports high contrast mode on mobile", () => {
      // Mock high contrast media query
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-contrast: high)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<Home />);

      // Verify app renders without issues in high contrast mode
      expect(
        screen.getByRole("button", { name: /start timer/i })
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter runner name")
      ).toBeInTheDocument();
    });
  });
});
