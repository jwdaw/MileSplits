import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../../app/page";

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

describe("Reset Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("should show reset button", () => {
    render(<Home />);

    const resetButton = screen.getByRole("button", {
      name: "Reset timer and clear all data",
    });
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveTextContent("RESET");
  });

  it("should show confirmation dialog when reset is clicked", () => {
    render(<Home />);

    const resetButton = screen.getByRole("button", {
      name: "Reset timer and clear all data",
    });
    fireEvent.click(resetButton);

    expect(screen.getByText("Reset Timer?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will clear the timer and all runner data. This action cannot be undone."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Reset All Data")).toBeInTheDocument();
  });

  it("should cancel reset when cancel is clicked", () => {
    render(<Home />);

    const resetButton = screen.getByRole("button", {
      name: "Reset timer and clear all data",
    });
    fireEvent.click(resetButton);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Reset Timer?")).not.toBeInTheDocument();
  });

  it("should reset data when confirmed", async () => {
    render(<Home />);

    // Add a runner first
    const nameInput = screen.getByPlaceholderText("Enter runner name");
    const addButton = screen.getByRole("button", { name: /add runner/i });

    fireEvent.change(nameInput, { target: { value: "Test Runner" } });
    fireEvent.click(addButton);

    // Verify runner was added
    await waitFor(() => {
      expect(screen.getAllByText("Test Runner")).toHaveLength(3);
    });

    // Reset
    const resetButton = screen.getByRole("button", {
      name: "Reset timer and clear all data",
    });
    fireEvent.click(resetButton);

    const confirmButton = screen.getByText("Reset All Data");
    fireEvent.click(confirmButton);

    // Verify reset
    await waitFor(() => {
      expect(screen.queryByText("Test Runner")).not.toBeInTheDocument();
      expect(screen.getByText("No runners added yet")).toBeInTheDocument();
      expect(
        screen.getByText("Timer and all data successfully reset!")
      ).toBeInTheDocument();
    });

    // Verify localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "cross-country-timer-session"
    );
  });

  it("should reset timer state", async () => {
    render(<Home />);

    // Start timer
    const startButton = screen.getByText("START");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText("Running")).toBeInTheDocument();
    });

    // Reset
    const resetButton = screen.getByRole("button", {
      name: "Reset timer and clear all data",
    });
    fireEvent.click(resetButton);

    const confirmButton = screen.getByText("Reset All Data");
    fireEvent.click(confirmButton);

    // Verify timer is reset
    await waitFor(() => {
      expect(screen.getByText("00:00")).toBeInTheDocument();
      expect(screen.getByText("Stopped")).toBeInTheDocument();
      expect(screen.getByText("START")).toBeInTheDocument();
    });
  });

  it("should show success message temporarily", async () => {
    render(<Home />);

    // Add runner and reset
    const nameInput = screen.getByPlaceholderText("Enter runner name");
    const addButton = screen.getByRole("button", { name: /add runner/i });

    fireEvent.change(nameInput, { target: { value: "Test Runner" } });
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

    // Wait for the timeout to complete (3 seconds + buffer)
    await waitFor(
      () => {
        expect(
          screen.queryByText("Timer and all data successfully reset!")
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });
});
