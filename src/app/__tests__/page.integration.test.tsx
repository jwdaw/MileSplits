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

describe("Home Page Session Persistence Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("should save session state when runners are added", async () => {
    render(<Home />);

    // Add a runner
    const nameInput = screen.getByPlaceholderText("Enter runner name");
    const addButton = screen.getByRole("button", { name: /add runner/i });

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.click(addButton);

    // Wait for the session to be saved
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cross-country-timer-session",
        expect.stringContaining("John Doe")
      );
    });

    // Verify the saved data structure
    const savedCall = localStorageMock.setItem.mock.calls.find(
      (call) => call[0] === "cross-country-timer-session"
    );
    expect(savedCall).toBeDefined();

    const savedData = JSON.parse(savedCall![1]);
    expect(savedData).toMatchObject({
      runners: [
        {
          name: "John Doe",
          splits: {},
        },
      ],
      timerState: {
        isRunning: false,
        elapsedTime: 0,
        startTime: null,
      },
      lastSaved: expect.any(Number),
    });
  });

  it("should save session state when timer is started", async () => {
    render(<Home />);

    // Start the timer
    const startButton = screen.getByText("START");
    fireEvent.click(startButton);

    // Wait for the session to be saved
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cross-country-timer-session",
        expect.stringContaining('"isRunning":true')
      );
    });
  });

  it("should restore session state on page load", async () => {
    // Mock a saved session
    const mockSession = {
      runners: [
        {
          id: "test-id",
          name: "Jane Smith",
          splits: {
            mile1: 300000, // 5 minutes
          },
        },
      ],
      timerState: {
        isRunning: false,
        elapsedTime: 600000, // 10 minutes
        startTime: null,
      },
      lastSaved: Date.now() - 1000 * 60 * 60, // 1 hour ago
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession));

    render(<Home />);

    // Verify runner is restored
    await waitFor(() => {
      expect(screen.getAllByText("Jane Smith")).toHaveLength(3); // Name appears in multiple places
    });

    // Verify timer state is restored
    expect(screen.getByText("10:00")).toBeInTheDocument();

    // Verify split is restored (appears in both mobile and desktop views)
    expect(screen.getAllByText("05:00")).toHaveLength(2);
  });

  it("should not restore old session data", async () => {
    // Mock an old session (more than 24 hours)
    const oldSession = {
      runners: [
        {
          id: "old-id",
          name: "Old Runner",
          splits: {},
        },
      ],
      timerState: {
        isRunning: false,
        elapsedTime: 0,
        startTime: null,
      },
      lastSaved: Date.now() - 1000 * 60 * 60 * 25, // 25 hours ago
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(oldSession));

    render(<Home />);

    // Verify old session is not restored
    await waitFor(() => {
      expect(screen.queryByText("Old Runner")).not.toBeInTheDocument();
    });

    // Verify localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      "cross-country-timer-session"
    );
  });

  it("should handle corrupted session data gracefully", async () => {
    // Mock corrupted data
    localStorageMock.getItem.mockReturnValue("invalid json");

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<Home />);

    // Should render without crashing
    expect(screen.getByText("START")).toBeInTheDocument();

    // Should clear corrupted data
    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
    });

    consoleSpy.mockRestore();
  });
});
