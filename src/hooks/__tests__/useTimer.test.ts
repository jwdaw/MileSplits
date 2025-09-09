import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTimer } from "../useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedTime).toBe(0);
    expect(typeof result.current.startTimer).toBe("function");
    expect(typeof result.current.stopTimer).toBe("function");
    expect(typeof result.current.resetTimer).toBe("function");
  });

  it("should start the timer correctly", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it("should not start timer if already running", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    const firstState = result.current.isRunning;

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(firstState);
    expect(result.current.isRunning).toBe(true);
  });

  it("should stop the timer correctly", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it("should not stop timer if not running", () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it("should reset timer to initial state", () => {
    const { result } = renderHook(() => useTimer());

    // Start timer
    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);

    // Reset timer
    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedTime).toBe(0);
  });

  it("should handle rapid start/stop operations correctly", () => {
    const { result } = renderHook(() => useTimer());

    // Rapid start/stop/start sequence
    act(() => {
      result.current.startTimer();
      result.current.stopTimer();
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it("should maintain state consistency during timer operations", () => {
    const { result } = renderHook(() => useTimer());

    // Initial state
    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedTime).toBe(0);

    // Start timer
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.isRunning).toBe(true);

    // Stop timer
    act(() => {
      result.current.stopTimer();
    });
    expect(result.current.isRunning).toBe(false);

    // Reset timer
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedTime).toBe(0);
  });

  it("should clean up intervals on unmount", () => {
    const { result, unmount } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);

    // Unmount should clean up without errors
    unmount();
  });

  it("should update elapsed time when timer is running", async () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.startTimer();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.elapsedTime).toBe(0);

    // Wait a bit and check that elapsed time has increased
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.elapsedTime).toBeGreaterThan(0);
    expect(result.current.elapsedTime).toBeLessThan(200); // Should be around 150ms
  });

  it("should preserve elapsed time when stopped and resumed", async () => {
    const { result } = renderHook(() => useTimer());

    // Start timer
    act(() => {
      result.current.startTimer();
    });

    // Wait a bit and let the timer update
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    const firstElapsed = result.current.elapsedTime;
    expect(firstElapsed).toBeGreaterThan(0);

    // Stop timer
    act(() => {
      result.current.stopTimer();
    });

    // Wait more time while stopped
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Elapsed time should not have changed while stopped
    expect(result.current.elapsedTime).toBe(firstElapsed);

    // Resume timer
    act(() => {
      result.current.startTimer();
    });

    // Wait a bit more
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Elapsed time should have increased from where it left off
    expect(result.current.elapsedTime).toBeGreaterThan(firstElapsed);
  });
});
