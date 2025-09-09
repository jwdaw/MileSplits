import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  isSessionRecent,
  SessionState,
} from "../localStorage";
import { Runner, TimerState } from "@/types";

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

describe("localStorage utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRunners: Runner[] = [
    {
      id: "1",
      name: "John Doe",
      splits: {
        mile1: 300000, // 5 minutes
        mile2: 600000, // 10 minutes
      },
    },
    {
      id: "2",
      name: "Jane Smith",
      splits: {
        mile1: 280000, // 4:40
      },
    },
  ];

  const mockTimerState: TimerState = {
    isRunning: true,
    elapsedTime: 600000,
    startTime: Date.now() - 600000,
  };

  describe("saveSessionState", () => {
    it("should save session state to localStorage", () => {
      const mockDate = 1234567890000;
      vi.spyOn(Date, "now").mockReturnValue(mockDate);

      saveSessionState(mockRunners, mockTimerState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cross-country-timer-session",
        JSON.stringify({
          runners: mockRunners,
          timerState: {
            isRunning: mockTimerState.isRunning,
            elapsedTime: mockTimerState.elapsedTime,
            startTime: mockTimerState.startTime,
          },
          lastSaved: mockDate,
        })
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => saveSessionState(mockRunners, mockTimerState)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save session state to localStorage:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("loadSessionState", () => {
    it("should load valid session state from localStorage", () => {
      const mockSessionState: SessionState = {
        runners: mockRunners,
        timerState: {
          isRunning: false,
          elapsedTime: 600000,
          startTime: null,
        },
        lastSaved: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(mockSessionState)
      );

      const result = loadSessionState();

      expect(result).toEqual(mockSessionState);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
    });

    it("should return null when no session exists", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadSessionState();

      expect(result).toBeNull();
    });

    it("should handle corrupted JSON data", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = loadSessionState();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load session state from localStorage:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid session structure", () => {
      const invalidSession = {
        runners: "not an array",
        timerState: null,
        lastSaved: "not a number",
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidSession));
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = loadSessionState();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid session state structure, clearing localStorage"
      );

      consoleSpy.mockRestore();
    });

    it("should validate runner structure", () => {
      const invalidSession: SessionState = {
        runners: [
          {
            id: 123 as any, // Invalid: should be string
            name: "John",
            splits: {},
          },
        ],
        timerState: {
          isRunning: false,
          elapsedTime: 0,
          startTime: null,
        },
        lastSaved: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidSession));
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = loadSessionState();

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("clearSessionState", () => {
    it("should remove session from localStorage", () => {
      clearSessionState();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "cross-country-timer-session"
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Access denied");
      });

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => clearSessionState()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to clear session state from localStorage:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("isSessionRecent", () => {
    it("should return true for recent sessions", () => {
      const recentSession: SessionState = {
        runners: [],
        timerState: {
          isRunning: false,
          elapsedTime: 0,
          startTime: null,
        },
        lastSaved: Date.now() - 1000 * 60 * 60, // 1 hour ago
      };

      expect(isSessionRecent(recentSession)).toBe(true);
    });

    it("should return false for old sessions", () => {
      const oldSession: SessionState = {
        runners: [],
        timerState: {
          isRunning: false,
          elapsedTime: 0,
          startTime: null,
        },
        lastSaved: Date.now() - 1000 * 60 * 60 * 25, // 25 hours ago
      };

      expect(isSessionRecent(oldSession)).toBe(false);
    });

    it("should return true for sessions exactly 24 hours old", () => {
      const exactSession: SessionState = {
        runners: [],
        timerState: {
          isRunning: false,
          elapsedTime: 0,
          startTime: null,
        },
        lastSaved: Date.now() - 1000 * 60 * 60 * 24, // Exactly 24 hours ago
      };

      expect(isSessionRecent(exactSession)).toBe(true);
    });
  });
});
