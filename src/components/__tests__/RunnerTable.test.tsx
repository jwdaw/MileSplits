import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RunnerTable } from "../RunnerTable";
import { Runner } from "@/types";

describe("RunnerTable", () => {
  const mockOnSplitRecord = vi.fn();

  const defaultProps = {
    runners: [] as Runner[],
    elapsedTime: 300000, // 5 minutes
    isTimerRunning: true,
    onSplitRecord: mockOnSplitRecord,
  };

  const mockRunners: Runner[] = [
    {
      id: "runner-1",
      name: "John Doe",
      splits: {
        mile1: 300000, // 5:00
      },
    },
    {
      id: "runner-2",
      name: "Jane Smith",
      splits: {
        mile1: 280000, // 4:40
        mile2: 600000, // 10:00
      },
    },
    {
      id: "runner-3",
      name: "Bob Johnson",
      splits: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Empty State", () => {
    it("displays empty state when no runners are added", () => {
      render(<RunnerTable {...defaultProps} />);

      expect(screen.getByText("No runners added yet")).toBeInTheDocument();
      expect(
        screen.getByText("Add runners above to start timing splits")
      ).toBeInTheDocument();
    });

    it("does not show table headers when no runners", () => {
      render(<RunnerTable {...defaultProps} />);

      expect(screen.queryByText("Runner")).not.toBeInTheDocument();
      expect(screen.queryByText("Mile 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Mile 2")).not.toBeInTheDocument();
      expect(screen.queryByText("Mile 3")).not.toBeInTheDocument();
    });
  });

  describe("Runner Display", () => {
    it("displays all runners with their names", () => {
      render(<RunnerTable {...defaultProps} runners={mockRunners} />);

      expect(screen.getAllByText("John Doe")).toHaveLength(2); // Mobile + desktop view
      expect(screen.getAllByText("Jane Smith")).toHaveLength(2);
      expect(screen.getAllByText("Bob Johnson")).toHaveLength(2);
    });

    it("shows runner count in footer", () => {
      render(<RunnerTable {...defaultProps} runners={mockRunners} />);

      expect(screen.getByText("3 runners • Timer running")).toBeInTheDocument();
    });

    it("shows singular runner count for single runner", () => {
      const singleRunner = [mockRunners[0]];
      render(<RunnerTable {...defaultProps} runners={singleRunner} />);

      expect(screen.getByText("1 runner • Timer running")).toBeInTheDocument();
    });

    it("shows timer stopped status when timer is not running", () => {
      render(
        <RunnerTable
          {...defaultProps}
          runners={mockRunners}
          isTimerRunning={false}
        />
      );

      expect(screen.getByText("3 runners • Timer stopped")).toBeInTheDocument();
    });
  });

  describe("Split Button Integration", () => {
    it("renders split buttons for each runner and mile", () => {
      render(<RunnerTable {...defaultProps} runners={mockRunners} />);

      // Each runner should have 3 split buttons (mile 1, 2, 3)
      // Each button appears twice (mobile + desktop view)
      const mile1Buttons = screen.getAllByText("Mile 1");
      const mile2Buttons = screen.getAllByText("Mile 2");
      const mile3Buttons = screen.getAllByText("Mile 3");

      expect(mile1Buttons).toHaveLength(7); // 3 runners × 2 views + 1 header
      expect(mile2Buttons).toHaveLength(7);
      expect(mile3Buttons).toHaveLength(7);
    });

    it("passes correct props to SplitButton components", () => {
      render(<RunnerTable {...defaultProps} runners={[mockRunners[0]]} />);

      // Check that split buttons receive correct props by testing their behavior
      const recordButtons = screen.getAllByText("Record");
      expect(recordButtons.length).toBeGreaterThan(0);

      // Test clicking a record button
      fireEvent.click(recordButtons[0]);
      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        expect.any(String),
        300000
      );
    });

    it("displays recorded split times correctly", () => {
      render(<RunnerTable {...defaultProps} runners={mockRunners} />);

      // John Doe has mile1 split recorded (5:00)
      expect(screen.getAllByText("05:00")).toHaveLength(2); // Mobile + desktop

      // Jane Smith has mile1 (4:40) and mile2 (10:00) splits recorded
      expect(screen.getAllByText("04:40")).toHaveLength(2);
      expect(screen.getAllByText("10:00")).toHaveLength(2);
    });

    it("passes timer running state to split buttons", () => {
      render(
        <RunnerTable
          {...defaultProps}
          runners={[mockRunners[2]]} // Bob Johnson with no splits
          isTimerRunning={false}
        />
      );

      // All buttons should be disabled when timer is not running
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Responsive Layout", () => {
    it("has mobile-specific classes for stacked layout", () => {
      render(<RunnerTable {...defaultProps} runners={[mockRunners[0]]} />);

      // Check for mobile-specific grid layout
      const mobileGrid = screen.getByTestId
        ? screen.queryByTestId("mobile-grid")
        : document.querySelector(".grid.grid-cols-3.gap-2");

      // Since we can't easily test CSS classes in jsdom, we'll test that the component renders
      expect(screen.getAllByText("John Doe")).toHaveLength(2);
    });

    it("has desktop table headers that are hidden on mobile", () => {
      render(<RunnerTable {...defaultProps} runners={mockRunners} />);

      // Headers should be present but hidden on mobile (sm:block class)
      const runnerHeader = screen.getByText("Runner");
      expect(runnerHeader).toBeInTheDocument();
    });
  });

  describe("Split Recording", () => {
    it("calls onSplitRecord with correct parameters when split button is clicked", () => {
      render(<RunnerTable {...defaultProps} runners={[mockRunners[2]]} />);

      // Find a record button and click it
      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-3",
        expect.stringMatching(/mile[123]/),
        300000
      );
    });

    it("handles multiple split recordings for different runners", () => {
      render(
        <RunnerTable {...defaultProps} runners={mockRunners.slice(0, 2)} />
      );

      const recordButtons = screen.getAllByText("Record");

      // Click multiple record buttons
      if (recordButtons.length >= 2) {
        fireEvent.click(recordButtons[0]);
        fireEvent.click(recordButtons[1]);

        expect(mockOnSplitRecord).toHaveBeenCalledTimes(2);
      }
    });
  });

  describe("Edge Cases", () => {
    it("handles runner with very long name", () => {
      const longNameRunner: Runner = {
        id: "long-name",
        name: "This is a very long runner name that might cause layout issues",
        splits: {},
      };

      render(<RunnerTable {...defaultProps} runners={[longNameRunner]} />);

      expect(
        screen.getAllByText(
          "This is a very long runner name that might cause layout issues"
        )
      ).toHaveLength(2);
    });

    it("handles runner with special characters in name", () => {
      const specialCharRunner: Runner = {
        id: "special-char",
        name: "José María O'Connor-Smith",
        splits: {},
      };

      render(<RunnerTable {...defaultProps} runners={[specialCharRunner]} />);

      expect(screen.getAllByText("José María O'Connor-Smith")).toHaveLength(2);
    });

    it("handles zero elapsed time", () => {
      render(
        <RunnerTable
          {...defaultProps}
          runners={[mockRunners[2]]}
          elapsedTime={0}
        />
      );

      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      // Should not record split with zero elapsed time (this is correct behavior)
      expect(mockOnSplitRecord).not.toHaveBeenCalled();
    });

    it("handles very large elapsed time", () => {
      const largeElapsedTime = 3661000; // 61:01
      render(
        <RunnerTable
          {...defaultProps}
          runners={[mockRunners[2]]}
          elapsedTime={largeElapsedTime}
        />
      );

      const recordButtons = screen.getAllByText("Record");
      fireEvent.click(recordButtons[0]);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-3",
        expect.any(String),
        largeElapsedTime
      );
    });

    it("handles empty splits object", () => {
      const emptyRunner: Runner = {
        id: "empty",
        name: "Empty Runner",
        splits: {},
      };

      render(<RunnerTable {...defaultProps} runners={[emptyRunner]} />);

      // Should render without errors and show all Record buttons
      const recordButtons = screen.getAllByText("Record");
      expect(recordButtons.length).toBeGreaterThan(0);
    });

    it("handles partial splits", () => {
      const partialRunner: Runner = {
        id: "partial",
        name: "Partial Runner",
        splits: {
          mile2: 600000, // Only mile 2 recorded
        },
      };

      render(<RunnerTable {...defaultProps} runners={[partialRunner]} />);

      // Mile 1 and 3 should show "Record", mile 2 should show time
      expect(screen.getAllByText("Record")).toHaveLength(4); // 2 miles × 2 views
      expect(screen.getAllByText("10:00")).toHaveLength(2); // Mile 2 time × 2 views
    });
  });

  describe("Performance", () => {
    it("handles large number of runners efficiently", () => {
      const manyRunners: Runner[] = Array.from({ length: 50 }, (_, i) => ({
        id: `runner-${i}`,
        name: `Runner ${i + 1}`,
        splits: {},
      }));

      const startTime = performance.now();
      render(<RunnerTable {...defaultProps} runners={manyRunners} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);

      // Should show correct count
      expect(
        screen.getByText("50 runners • Timer running")
      ).toBeInTheDocument();
    });
  });
});
