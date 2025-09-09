import { Runner, TimerState } from "@/types";

// Key for localStorage
const STORAGE_KEY = "cross-country-timer-session";

// Interface for the complete session state
export interface SessionState {
  runners: Runner[];
  timerState: {
    isRunning: boolean;
    elapsedTime: number;
    startTime: number | null;
  };
  lastSaved: number;
}

/**
 * Save session state to localStorage
 * Returns true if successful, false if failed
 */
export function saveSessionState(
  runners: Runner[],
  timerState: TimerState
): boolean {
  try {
    // Validate input data before saving
    if (!Array.isArray(runners)) {
      console.warn("Invalid runners data - not an array");
      return false;
    }

    if (!timerState || typeof timerState !== "object") {
      console.warn("Invalid timer state data");
      return false;
    }

    const sessionState: SessionState = {
      runners,
      timerState: {
        isRunning: timerState.isRunning,
        elapsedTime: timerState.elapsedTime,
        startTime: timerState.startTime,
      },
      lastSaved: Date.now(),
    };

    const serialized = JSON.stringify(sessionState);

    // Check if the serialized data is too large (localStorage limit is usually 5-10MB)
    if (serialized.length > 5 * 1024 * 1024) {
      console.warn("Session state too large to save to localStorage");
      return false;
    }

    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn("Failed to save session state to localStorage:", error);
    return false;
  }
}

/**
 * Load session state from localStorage
 * Returns null if no valid session is found
 */
export function loadSessionState(): SessionState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    // Validate the structure
    if (!isValidSessionState(parsed)) {
      console.warn("Invalid session state structure, clearing localStorage");
      clearSessionState();
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to load session state from localStorage:", error);
    clearSessionState();
    return null;
  }
}

/**
 * Clear session state from localStorage
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear session state from localStorage:", error);
  }
}

/**
 * Validate session state structure
 */
function isValidSessionState(state: any): state is SessionState {
  if (!state || typeof state !== "object") {
    return false;
  }

  // Check runners array
  if (!Array.isArray(state.runners)) {
    return false;
  }

  // Validate each runner
  for (const runner of state.runners) {
    if (!isValidRunner(runner)) {
      return false;
    }
  }

  // Check timer state
  if (!state.timerState || typeof state.timerState !== "object") {
    return false;
  }

  const { timerState } = state;
  if (
    typeof timerState.isRunning !== "boolean" ||
    typeof timerState.elapsedTime !== "number" ||
    (timerState.startTime !== null && typeof timerState.startTime !== "number")
  ) {
    return false;
  }

  // Check lastSaved
  if (typeof state.lastSaved !== "number") {
    return false;
  }

  return true;
}

/**
 * Validate runner structure
 */
function isValidRunner(runner: any): runner is Runner {
  if (!runner || typeof runner !== "object") {
    return false;
  }

  if (typeof runner.id !== "string" || typeof runner.name !== "string") {
    return false;
  }

  if (!runner.splits || typeof runner.splits !== "object") {
    return false;
  }

  const { splits } = runner;
  const validSplitKeys = ["mile1", "mile2", "mile3"];

  for (const key in splits) {
    if (!validSplitKeys.includes(key)) {
      return false;
    }

    const value = splits[key];
    if (value !== undefined && typeof value !== "number") {
      return false;
    }
  }

  return true;
}

/**
 * Check if a session is recent (within last 24 hours)
 * Used to determine if we should restore a session
 */
export function isSessionRecent(sessionState: SessionState): boolean {
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  return now - sessionState.lastSaved <= twentyFourHours;
}
