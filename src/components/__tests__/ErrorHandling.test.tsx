import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SplitButton } from "../SplitButton";
import { Stopwatch } from "../Stopwatch";
import AddRunner from "../AddRunner";
import { Runner } from "@/types";

describe("Error Handling and User Feedback", () => {
  describe("SplitButton Error Handling", () => {
    it("should disable button when timer is not running", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          elapsedTime={5000}
          isTimerRunning={false}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("cursor-not-allowed");
    });

    it("should disable button when split is already recorded", () => {
      const mockOnSplitRecord = vi.fn();

      render(
        <SplitButton
          runnerId="test-runner"
          splitType="mile1"
          splitTime={5000}
          elapsedTime={10000}
          isTimerRunning={true}
          onSplitRecord={mockOnSplitRecord}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("cursor-default");
    });

    it("should show success feedback when split is recorded", async () => {
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
      fireEvent.click(button);

      expect(mockOnSplitRecord).toHaveBeenCalledWith(
        "test-runner",
        "mile1",
        5000
      );

      // Simulate the split being recorded by rerendering with splitTime
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

      // Check for success indicator (green background - could be bg-green-100 or bg-green-200)
      expect(button).toHaveClass("text-green-800");
      expect(button.className).toMatch(/bg-green-/);
    });

    it("should be enabled and clickable when timer is running and split not recorded", () => {
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
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass("cursor-pointer");

      fireEvent.click(button);
      expect(mockOnSplitRecord).toHaveBeenCalled();
    });
  });

  describe("Stopwatch Error Display", () => {
    it("should display error message when provided", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      const mockOnClearError = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
          error="Test error message"
          onClearError={mockOnClearError}
        />
      );

      expect(screen.getByText("Test error message")).toBeInTheDocument();
      expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });

    it("should call onClearError when dismiss button is clicked", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();
      const mockOnClearError = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
          error="Test error message"
          onClearError={mockOnClearError}
        />
      );

      const dismissButton = screen.getByText("Dismiss");
      fireEvent.click(dismissButton);

      expect(mockOnClearError).toHaveBeenCalled();
    });

    it("should disable start/stop button when error is present", () => {
      const mockOnStart = vi.fn();
      const mockOnStop = vi.fn();

      render(
        <Stopwatch
          isRunning={false}
          elapsedTime={0}
          onStart={mockOnStart}
          onStop={mockOnStop}
          error="Test error message"
        />
      );

      const startButton = screen.getByRole("button", { name: /start timer/i });
      expect(startButton).toBeDisabled();
    });

    it("should not display error section when no error is provided", () => {
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

      expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    });
  });

  describe("AddRunner Validation Feedback", () => {
    it("should show success message when runner is added", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "John Doe" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("John Doe added successfully!")
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).toHaveBeenCalledWith({
        id: expect.any(String),
        name: "John Doe",
        splits: {},
      });
    });

    it("should show error for names that are too short", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name must be at least 2 characters")
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("should show error for names with invalid characters", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "John@Doe" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Runner name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods"
          )
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("should clear error when user starts typing", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // First, trigger an error
      fireEvent.change(input, { target: { value: "A" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name must be at least 2 characters")
        ).toBeInTheDocument();
      });

      // Then start typing to clear the error
      fireEvent.change(input, { target: { value: "Al" } });

      await waitFor(() => {
        expect(
          screen.queryByText("Runner name must be at least 2 characters")
        ).not.toBeInTheDocument();
      });
    });

    it("should show error for duplicate runner names", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [{ id: "1", name: "John Doe", splits: {} }];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      fireEvent.change(input, { target: { value: "John Doe" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Runner name already exists")
        ).toBeInTheDocument();
      });

      expect(mockOnAddRunner).not.toHaveBeenCalled();
    });

    it("should clear success message when user starts typing", async () => {
      const mockOnAddRunner = vi.fn();
      const runners: Runner[] = [];

      render(<AddRunner runners={runners} onAddRunner={mockOnAddRunner} />);

      const input = screen.getByPlaceholderText("Enter runner name");
      const addButton = screen.getByRole("button", { name: /add runner/i });

      // First, add a runner successfully
      fireEvent.change(input, { target: { value: "John Doe" } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("John Doe added successfully!")
        ).toBeInTheDocument();
      });

      // Then start typing to clear the success message
      fireEvent.change(input, { target: { value: "Jane" } });

      await waitFor(() => {
        expect(
          screen.queryByText("John Doe added successfully!")
        ).not.toBeInTheDocument();
      });
    });
  });
});
