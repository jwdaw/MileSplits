import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SplitButton } from "../SplitButton";
import { SplitType } from "@/types";

describe("SplitButton", () => {
  const mockOnSplitRecord = vi.fn();
  const defaultProps = {
    runnerId: "runner-1",
    splitType: "mile1" as SplitType,
    elapsedTime: 300000, // 5 minutes in milliseconds
    isTimerRunning: true,
    onSplitRecord: mockOnSplitRecord,
  };

  beforeEach(() => {
    mockOnSplitRecord.mockClear();
  });

  describe("Component Rendering", () => {
    it("renders with correct mile number for mile1", () => {
      render(<SplitButton {...defaultProps} splitType="mile1" />);
      expect(screen.getByText("Mile 1")).toBeInTheDocument();
    });

    it("renders with correct mile number for mile2", () => {
      render(<SplitButton {...defaultProps} splitType="mile2" />);
      expect(screen.getByText("Mile 2")).toBeInTheDocument();
    });

    it("renders with correct mile number for mile3", () => {
      render(<SplitButton {...defaultProps} splitType="mile3" />);
      expect(screen.getByText("Mile 3")).toBeInTheDocument();
    });

    it("shows 'Record' text when split is not recorded", () => {
      render(<SplitButton {...defaultProps} />);
      expect(screen.getByText("Record")).toBeInTheDocument();
    });

    it("shows formatted split time when split is recorded", () => {
      const splitTime = 300000; // 5:00
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("05:00")).toBeInTheDocument();
      expect(screen.queryByText("Record")).not.toBeInTheDocument();
    });
  });

  describe("Split Time Calculation", () => {
    it("records split time accurately for 1 minute elapsed", () => {
      const elapsedTime = 60000; // 1 minute
      render(<SplitButton {...defaultProps} elapsedTime={elapsedTime} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile1",
        60000
      );
    });

    it("records split time accurately for 5 minutes 30 seconds elapsed", () => {
      const elapsedTime = 330000; // 5:30
      render(<SplitButton {...defaultProps} elapsedTime={elapsedTime} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile1",
        330000
      );
    });

    it("records split time accurately for 10 minutes 45 seconds elapsed", () => {
      const elapsedTime = 645000; // 10:45
      render(<SplitButton {...defaultProps} elapsedTime={elapsedTime} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile1",
        645000
      );
    });

    it("records split time with millisecond precision", () => {
      const elapsedTime = 123456; // 2:03.456
      render(<SplitButton {...defaultProps} elapsedTime={elapsedTime} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile1",
        123456
      );
    });
  });

  describe("Button State Management", () => {
    it("is active when timer is running and split not recorded", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("bg-blue-500");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("is disabled when timer is not running", () => {
      render(<SplitButton {...defaultProps} isTimerRunning={false} />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-gray-100");
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("is disabled when split is already recorded", () => {
      render(<SplitButton {...defaultProps} splitTime={300000} />);
      const button = screen.getByRole("button");

      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-green-100");
      expect(button).toHaveClass("cursor-default");
    });

    it("does not record split when timer is not running", () => {
      render(<SplitButton {...defaultProps} isTimerRunning={false} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(mockOnSplitRecord).not.toHaveBeenCalled();
    });

    it("does not record split when already recorded", () => {
      render(<SplitButton {...defaultProps} splitTime={300000} />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(mockOnSplitRecord).not.toHaveBeenCalled();
    });
  });

  describe("Time Formatting", () => {
    it("formats time correctly for single digit minutes and seconds", () => {
      const splitTime = 65000; // 1:05
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("01:05")).toBeInTheDocument();
    });

    it("formats time correctly for double digit minutes and seconds", () => {
      const splitTime = 725000; // 12:05
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("12:05")).toBeInTheDocument();
    });

    it("formats time correctly for zero seconds", () => {
      const splitTime = 300000; // 5:00
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("05:00")).toBeInTheDocument();
    });

    it("formats time correctly for 59 seconds", () => {
      const splitTime = 359000; // 5:59
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("05:59")).toBeInTheDocument();
    });

    it("handles milliseconds correctly by truncating", () => {
      const splitTime = 65999; // 1:05.999 -> should display as 1:05
      render(<SplitButton {...defaultProps} splitTime={splitTime} />);
      expect(screen.getByText("01:05")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label when not recorded", () => {
      render(<SplitButton {...defaultProps} splitType="mile2" />);
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("aria-label", "Record mile 2 split");
    });

    it("has proper aria-label when recorded", () => {
      const splitTime = 300000; // 5:00
      render(
        <SplitButton
          {...defaultProps}
          splitType="mile3"
          splitTime={splitTime}
        />
      );
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute(
        "aria-label",
        "Mile 3 split recorded: 05:00"
      );
    });

    it("has proper button type", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Visual Feedback", () => {
    it("has large touch targets (minimum 44px height)", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("min-h-[48px]");
    });

    it("has proper focus styles", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
      expect(button).toHaveClass("focus:ring-offset-1");
    });

    it("has active scale animation", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("active:scale-95");
    });

    it("has transition animations", () => {
      render(<SplitButton {...defaultProps} />);
      const button = screen.getByRole("button");

      expect(button).toHaveClass("transition-all");
      expect(button).toHaveClass("duration-200");
      expect(button).toHaveClass("ease-in-out");
    });
  });

  describe("Different Split Types", () => {
    it("handles mile1 split type correctly", () => {
      render(<SplitButton {...defaultProps} splitType="mile1" />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile1",
        300000
      );
    });

    it("handles mile2 split type correctly", () => {
      render(<SplitButton {...defaultProps} splitType="mile2" />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile2",
        300000
      );
    });

    it("handles mile3 split type correctly", () => {
      render(<SplitButton {...defaultProps} splitType="mile3" />);
      const button = screen.getByRole("button");

      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "runner-1",
        "mile3",
        300000
      );
    });
  });
});
